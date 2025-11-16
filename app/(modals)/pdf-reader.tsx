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
import Pdf from 'react-native-pdf';
import { Ionicons } from '@expo/vector-icons';
import { progressStorage, MediaProgress } from '@/utils/progressStorage';

const { width, height } = Dimensions.get('window');

export default function PdfReader() {
  const router = useRouter();
  const { itemId, itemTitle, pdfUrl } = useLocalSearchParams<{
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
    loadProgress();
    return () => {
      if (hideHeaderTimer.current) {
        clearTimeout(hideHeaderTimer.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-hide header after 3 seconds
  useEffect(() => {
    if (showHeader) {
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
    await saveProgress(currentPage);
    router.back();
  };

  const toggleHeader = () => {
    setShowHeader(!showHeader);
  };

  // Use a demo PDF URL
  const demoPdfUrl = pdfUrl || 'http://www.pdf995.com/samples/pdf.pdf';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* PDF Viewer */}
      <TouchableOpacity
        style={styles.pdfContainer}
        activeOpacity={1}
        onPress={toggleHeader}
      >
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
});
