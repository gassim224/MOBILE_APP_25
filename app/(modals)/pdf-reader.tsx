import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { progressStorage, MediaProgress } from '@/utils/progressStorage';
import { scheduleLessonContinuationReminder, cancelLessonContinuationReminder } from '@/utils/notificationService';
import { emitContentAccessed, emitContentConsumedOnce, emitExerciseCompletedOnce } from '@/services/analyticsService';
import { useConnectionSimulator } from '@/contexts/ConnectionSimulatorContext';
import { useDownloads } from '@/contexts/DownloadsContext';
import { ANALYTICS } from '@/constants/AppConstants';

// Conditionally import react-native-pdf only for native platforms
let Pdf: any = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Pdf = require('react-native-pdf').default;
}

const { width, height } = Dimensions.get('window');

export default function PdfReader() {
  const router = useRouter();
  const { isConnectedToKiosk } = useConnectionSimulator();
  const { markLessonCompleteByLessonId } = useDownloads();
  const { itemId, itemTitle, pdfUrl, itemType } = useLocalSearchParams<{
    itemId: string;
    itemTitle: string;
    pdfUrl: string;
    itemType?: 'book' | 'lesson';
  }>();

  const pdfRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const hideHeaderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      loadProgress();
    }
    // Analytics: emit content_accessed_offline on PDF open. Books are 'ebook',
    // lessons are 'course' or 'exercise'. Past papers come through with
    // id `exercise_paper_*` (see course-detail.tsx mapPastPaperToLesson) — that
    // is the structural signal. Title keyword check stays as a fallback for
    // exercise PDFs that aren't past-papers but happen to be named after one.
    if (itemId && itemTitle) {
      const isBook = itemType === 'book';
      const isExercise =
        !isBook &&
        (itemId.startsWith('exercise_') || /exerc|annale|corrig/i.test(itemTitle));
      emitContentAccessed({
        lessonId: itemId,
        lessonTitle: itemTitle,
        contentType: isBook ? 'ebook' : isExercise ? 'exercise' : 'course',
        offline: !isConnectedToKiosk,
      }).catch(() => undefined);

      // Per spec ("the trigger for this event is open and reading downloaded
      // exercise"): fire exercises_completed when the user OPENS an exercise
      // PDF, not only when they reach the last page. Dedup'd per (user, item)
      // by emitExerciseCompletedOnce, so opening the same exercise twice
      // doesn't double-count.
      if (isExercise) {
        emitExerciseCompletedOnce({
          offline: !isConnectedToKiosk,
          content: { content_id: itemId, content_type: 'exercise', content_title: itemTitle },
        }).catch(() => undefined);
      }
    }
    return () => {
      if (hideHeaderTimer.current) {
        clearTimeout(hideHeaderTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide header after 3 seconds
  useEffect(() => {
    if (showHeader && Platform.OS !== 'web') {
      if (hideHeaderTimer.current) {
        clearTimeout(hideHeaderTimer.current);
      }
      hideHeaderTimer.current = setTimeout(() => {
        setShowHeader(false);
      }, 3000);
    }
    return () => {
      if (hideHeaderTimer.current) {
        clearTimeout(hideHeaderTimer.current);
      }
    };
  }, [showHeader]);

  const loadProgress = async () => {
    if (!itemId) return;

    try {
      const savedProgress = await progressStorage.getProgress(itemId);
      if (savedProgress && savedProgress.type === 'pdf' && savedProgress.position > 0) {
        setCurrentPage(savedProgress.position);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async (page: number) => {
    if (!itemId || page === 0) return;

    try {
      const progress: MediaProgress = {
        lessonId: itemId,
        position: page,
        duration: totalPages > 0 ? totalPages : undefined, // store total pages as duration
        lastUpdated: new Date().toISOString(),
        type: 'pdf',
      };
      await progressStorage.saveProgress(progress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handlePageChanged = (page: number, numberOfPages: number) => {
    setCurrentPage(page);
    setTotalPages(numberOfPages);
    saveProgress(page);

    // Analytics: fire content_consumed once when reader passes 50% of pages.
    // Skip for books — gassim said no consumption tracking for ebooks.
    if (itemId && itemTitle && itemType !== 'book' && numberOfPages > 0) {
      const isExercise =
        itemId.startsWith('exercise_') || /exerc|annale|corrig/i.test(itemTitle);
      const ratio = page / numberOfPages;
      if (ratio >= ANALYTICS.CONSUMED_THRESHOLD) {
        // Mark the lesson complete locally so the per-course progress bar updates.
        markLessonCompleteByLessonId(itemId).catch(() => undefined);
        emitContentConsumedOnce({
          offline: !isConnectedToKiosk,
          content: {
            content_id: itemId,
            content_type: isExercise ? 'exercise' : 'course',
            content_title: itemTitle,
          },
        }).catch(() => undefined);
      }
    }

    // If user reached the last page, cancel continuation reminder
    if (page === numberOfPages && itemId) {
      cancelLessonContinuationReminder(itemId);
      // Analytics: an exercise PDF completed end-to-end fires exercises_completed
      const isExercise =
        itemType !== 'book' &&
        (itemId.startsWith('exercise_') || /exerc|annale|corrig/i.test(itemTitle || ''));
      if (isExercise && itemTitle) {
        emitExerciseCompletedOnce({
          offline: !isConnectedToKiosk,
          content: { content_id: itemId, content_type: 'exercise', content_title: itemTitle },
        }).catch(() => undefined);
      }
    }
  };

  const handleLoadComplete = (numberOfPages: number) => {
    setTotalPages(numberOfPages);
    setIsLoading(false);
  };

  const handleError = (error: any) => {
    console.error('PDF Load Error:', error);
    Alert.alert(
      'Erreur',
      'Impossible de charger le document PDF. Veuillez réessayer.',
      [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleClose = async () => {
    if (Platform.OS !== 'web') {
      await saveProgress(currentPage);

      // If PDF was not completed (current page < 90% of total pages), schedule continuation reminder
      if (itemId && itemTitle && totalPages > 0 && currentPage < totalPages * 0.9) {
        await scheduleLessonContinuationReminder(itemId, itemTitle);
      }
    }
    router.back();
  };

  const toggleHeader = () => {
    setShowHeader(!showHeader);
  };

  const demoPdfUrl = pdfUrl || '';

  // Web fallback view
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.headerOverlay}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.documentTitle} numberOfLines={1}>
                {itemTitle || 'Document PDF'}
              </Text>
            </View>
          </View>
        </View>

        {/* Web Fallback Message */}
        <View style={styles.webFallbackContainer}>
          <View style={styles.webFallbackIcon}>
            <Ionicons name="document-text-outline" size={80} color="#FFD700" />
          </View>
          <Text style={styles.webFallbackTitle}>Lecteur PDF non disponible</Text>
          <Text style={styles.webFallbackMessage}>
            Le lecteur PDF n&apos;est pas disponible sur le web.
          </Text>
          <Text style={styles.webFallbackSubMessage}>
            Veuillez utiliser l&apos;application mobile pour lire ce document.
          </Text>

          {pdfUrl && (
            <TouchableOpacity
              style={styles.downloadButton}
              onPress={() => {
                if (typeof window !== 'undefined') {
                  window.open(demoPdfUrl, '_blank');
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={20} color="#1E3A5F" />
              <Text style={styles.downloadButtonText}>Télécharger le PDF</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Native PDF viewer
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* PDF Viewer */}
      <TouchableOpacity
        style={styles.pdfContainer}
        activeOpacity={1}
        onPress={toggleHeader}
      >
        {Pdf && (
          <Pdf
            ref={pdfRef}
            source={{ uri: demoPdfUrl, cache: true }}
            page={currentPage}
            onLoadComplete={handleLoadComplete}
            onPageChanged={handlePageChanged}
            onError={handleError}
            style={styles.pdf}
            trustAllCerts={false}
            enablePaging
            horizontal={false}
            spacing={0}
            enableAntialiasing
            renderActivityIndicator={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.loadingText}>Chargement du document...</Text>
              </View>
            )}
          />
        )}

        {/* Header Overlay */}
        {showHeader && !isLoading && (
          <View style={styles.headerOverlay}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerContent}>
                <Text style={styles.documentTitle} numberOfLines={1}>
                  {itemTitle || 'Document PDF'}
                </Text>
                <Text style={styles.pageInfo}>
                  Page {currentPage} sur {totalPages}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Page Navigation Buttons (when header is visible) */}
        {showHeader && !isLoading && totalPages > 1 && (
          <View style={styles.navigationOverlay}>
            {currentPage > 1 && (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={() => {
                  if (pdfRef.current && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {currentPage < totalPages && (
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={() => {
                  if (pdfRef.current && currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A5F',
  },
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#1E3A5F',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E3A5F',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(30, 58, 95, 0.95)',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  documentTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  pageInfo: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
  },
  navigationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    pointerEvents: 'box-none',
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(30, 58, 95, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  prevButton: {
    marginRight: 'auto',
  },
  nextButton: {
    marginLeft: 'auto',
  },
  // Web fallback styles
  webFallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  webFallbackIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  webFallbackTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  webFallbackMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  webFallbackSubMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A5F',
  },
});
