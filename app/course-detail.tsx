import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useConnectionSimulator } from "@/contexts/ConnectionSimulatorContext";
import { useActiveGrade } from "@/contexts/ActiveGradeContext";
import { useDownloads } from "@/contexts/DownloadsContext";
import { Lesson } from "@/types";
import { MESSAGES } from "@/constants/AppConstants";
import { downloadFile, generateFileName } from "@/utils/fileDownloader";
import logger from "@/utils/Logger";
import { AcademicBadge } from "@/components/AcademicBadge";
import { StudentAPI, DownloadAPI, ApiVideo, ApiPdf, ApiPastPaper, compareLessonsByPrefix } from "@/services/api";
import { enqueueEvent, type ContentType } from "@/services/analyticsService";

// Map a Lesson to its analytics content_type. PDFs that look like exercises
// (annale/corrigé/exercice) count as 'exercise'; everything else is 'course'.
const lessonContentType = (lesson: Lesson): ContentType => {
  const isExercise =
    lesson.id.startsWith('exercise_') ||
    lesson.title.toLowerCase().includes('exercice') ||
    lesson.title.toLowerCase().includes('annale') ||
    lesson.title.toLowerCase().includes('corrigé');
  return isExercise ? 'exercise' : 'course';
};

type TabType = 'lessons' | 'texts' | 'exercises';

// Categorize lessons based on type and ID prefix
const categorizeLessons = (lessons: Lesson[]) => {
  const categorized = {
    lessons: [] as Lesson[],
    texts: [] as Lesson[],
    exercises: [] as Lesson[],
  };

  lessons.forEach((lesson) => {
    const isExercise = lesson.id.startsWith('exercise_') ||
                       lesson.title.toLowerCase().includes('exercice') ||
                       lesson.title.toLowerCase().includes('annale') ||
                       lesson.title.toLowerCase().includes('corrigé');

    if (lesson.type === 'video' || lesson.type === 'audio') {
      categorized.lessons.push(lesson);
    } else if (lesson.type === 'pdf') {
      if (isExercise) {
        categorized.exercises.push(lesson);
      } else {
        categorized.texts.push(lesson);
      }
    }
  });

  return categorized;
};

// Format bytes to human-readable string
const formatBytes = (bytes?: number): string => {
  if (!bytes || bytes === 0) return 'N/A';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} Go`;
};

// Map API data to Lesson types
const mapVideoToLesson = (video: ApiVideo, subjectName: string): Lesson => {
  const isAudio = video.filename.toLowerCase().endsWith('.mp3') ||
                  video.filename.toLowerCase().endsWith('.wav') ||
                  video.filename.toLowerCase().endsWith('.m4a');
  return {
    id: `video_${video.id}`,
    title: video.title,
    type: isAudio ? 'audio' : 'video',
    size: formatBytes(video.sizeBytes),
    sizeBytes: video.sizeBytes,
    duration: video.duration,
    isDownloaded: false,
    mediaUrl: DownloadAPI.getVideoUrl(subjectName, video.filename),
    filename: video.filename,
  };
};

const mapPdfToLesson = (pdf: ApiPdf, subjectName: string): Lesson => ({
  id: `pdf_${pdf.id}`,
  title: pdf.title,
  type: 'pdf',
  size: formatBytes(pdf.sizeBytes),
  sizeBytes: pdf.sizeBytes,
  isDownloaded: false,
  mediaUrl: DownloadAPI.getPdfUrl(subjectName, pdf.filename),
  filename: pdf.filename,
});

const mapPastPaperToLesson = (paper: ApiPastPaper, subjectName: string): Lesson => ({
  id: `exercise_${paper.id}`,
  title: paper.title,
  type: 'pdf',
  size: formatBytes(paper.sizeBytes),
  sizeBytes: paper.sizeBytes,
  isDownloaded: false,
  mediaUrl: DownloadAPI.getPdfUrl(subjectName, paper.filename),
  filename: paper.filename,
});

export default function CourseDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isConnectedToKiosk } = useConnectionSimulator();
  const { activeGrade } = useActiveGrade();
  const { addDownloadedCourse, downloadedCourses } = useDownloads();

  // Ref so the fetch effect can access downloadedCourses without re-running on every download
  const downloadedCoursesRef = useRef(downloadedCourses);
  useEffect(() => { downloadedCoursesRef.current = downloadedCourses; }, [downloadedCourses]);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [downloadingLessonId, setDownloadingLessonId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('lessons');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Validate and extract navigation params with proper typing
  const courseTitle = (params.title as string | undefined) || "Cours";
  const courseDescription = (params.description as string | undefined) || "";
  const courseId = (params.id as string | undefined) || "unknown";

  // Fetch course content from API or load downloaded content.
  // Does NOT depend on downloadedCourses — the sync effect below handles isDownloaded updates.
  useEffect(() => {
    const fetchCourseContent = async () => {
      if (!params.title) {
        Alert.alert("Erreur", "Les informations du cours sont manquantes.", [{ text: MESSAGES.OK, onPress: () => router.back() }]);
        return;
      }

      setLoading(true);
      setError(null);

      if (!isConnectedToKiosk) {
        // Read from ref to avoid this effect re-running on every download
        const downloadedCourse = downloadedCoursesRef.current.find(c => c.id === courseId || c.title === courseTitle);
        if (downloadedCourse && downloadedCourse.lessons.length > 0) {
          setLessons(downloadedCourse.lessons.map(lesson => ({ ...lesson, isDownloaded: true })));
          setError(null);
        } else {
          setLessons([]);
          setError("Ce cours n'a pas été téléchargé");
        }
        setLoading(false);
        return;
      }

      try {
        const [videosResponse, pdfsResponse, pastPapersResponse] = await Promise.all([
          StudentAPI.getSubjectVideos(courseTitle, activeGrade).catch(err => { logger.warn("Failed to fetch videos:", err); return { success: false, videos: [] }; }),
          StudentAPI.getSubjectPdfs(courseTitle, activeGrade).catch(err => { logger.warn("Failed to fetch PDFs:", err); return { success: false, pdfs: [] }; }),
          StudentAPI.getSubjectPastPapers(courseTitle, activeGrade).catch(err => { logger.warn("Failed to fetch past papers:", err); return { success: false, pastPapers: [] }; }),
        ]);

        const allLessons: Lesson[] = [];
        if (videosResponse.success && videosResponse.videos) allLessons.push(...videosResponse.videos.map(v => mapVideoToLesson(v, courseTitle)));
        if (pdfsResponse.success && pdfsResponse.pdfs) allLessons.push(...pdfsResponse.pdfs.map(p => mapPdfToLesson(p, courseTitle)));
        if (pastPapersResponse.success && pastPapersResponse.pastPapers) allLessons.push(...pastPapersResponse.pastPapers.map(p => mapPastPaperToLesson(p, courseTitle)));

        setLessons(allLessons);
      } catch (err) {
        logger.error("Failed to fetch course content:", err);
        setError("Impossible de charger le contenu du cours. Vérifiez votre connexion.");
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseContent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.title, courseTitle, courseId, isConnectedToKiosk, activeGrade]);

  // Sort by source filename ("_1.2 Foo.mp4") so the chapter prefix in the
  // upstream filename drives ordering even when the displayed title was
  // edited or never carried the number. Falls back to the title for any
  // legacy item that lacks a stored filename.
  const sortedLessons = [...lessons].sort((a, b) =>
    compareLessonsByPrefix(a.filename || a.title, b.filename || b.title)
  );

  // Categorize lessons
  const categorizedLessons = categorizeLessons(sortedLessons);

  // Get active category lessons
  const getActiveCategoryLessons = () => {
    switch (activeTab) {
      case 'lessons':
        return categorizedLessons.lessons;
      case 'texts':
        return categorizedLessons.texts;
      case 'exercises':
        return categorizedLessons.exercises;
      default:
        return [];
    }
  };

  const activeCategoryLessons = getActiveCategoryLessons();

  // Sync downloaded state from context
  useEffect(() => {
    const downloadedCourse = downloadedCourses.find(c => c.id === courseId);
    if (downloadedCourse) {
      setLessons(prev => prev.map(lesson => {
        const downloadedLesson = downloadedCourse.lessons.find(l => l.id === lesson.id);
        return downloadedLesson ? { ...lesson, isDownloaded: true } : lesson;
      }));
    }
  }, [downloadedCourses, courseId]);

  const downloadedCount = lessons.filter((l) => l.isDownloaded).length;
  const totalCount = lessons.length;
  const totalSizeBytes = lessons.reduce((sum, l) => sum + (l.sizeBytes || 0), 0);
  const totalSizeFormatted = formatBytes(totalSizeBytes);

  const getIconForType = (type: Lesson["type"]) => {
    switch (type) {
      case "video":
        return "videocam";
      case "pdf":
        return "document-text";
      case "audio":
        return "headset";
      default:
        return "document";
    }
  };

  const handleDownloadLesson = async (lessonId: string) => {
    if (!isConnectedToKiosk) {
      Alert.alert(
        "Hors ligne",
        MESSAGES.DOWNLOAD_ERROR_OFFLINE,
        [{ text: MESSAGES.OK }]
      );
      return;
    }

    setDownloadingLessonId(lessonId);

    try {
      // Find the lesson
      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) {
        throw new Error('Lesson not found');
      }

      // Get the remote URL for this lesson
      const remoteUrl = lesson.mediaUrl || '';

      // Generate filename, preserving original extension from the URL
      const originalFilename = remoteUrl.split('/').pop()?.split('?')[0];
      const fileName = generateFileName(lessonId, lesson.title, lesson.type, originalFilename ? decodeURIComponent(originalFilename) : undefined);

      logger.info(`Starting download: ${lesson.title}`);
      logger.info(`Remote URL: ${remoteUrl}`);
      logger.info(`File name: ${fileName}`);

      // Actually download the file to local storage
      const localUri = await downloadFile(remoteUrl, fileName, (progress) => {
        logger.info(`Download progress: ${progress.progress.toFixed(2)}%`);
      });

      logger.info(`File downloaded to: ${localUri}`);

      // Analytics: a download only happens while connected to the kiosk, so offline=false.
      enqueueEvent({
        event_name: 'content_downloaded',
        offline: !isConnectedToKiosk,
        content: {
          content_id: lesson.id,
          content_type: lessonContentType(lesson),
          subject: courseTitle,
          content_title: lesson.title,
        },
      }).catch((e) => logger.error('analytics enqueue failed', e));

      // Mark lesson as downloaded in local state
      setLessons((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, isDownloaded: true } : l))
      );

      // Create lesson with LOCAL file path
      const lessonWithLocalFile = {
        ...lesson,
        isDownloaded: true,
        mediaUrl: localUri, // Store LOCAL path, not remote URL
        isCompleted: false,
      };

      // Check if course already exists in downloads
      const existingCourse = downloadedCourses.find(c => c.id === courseId);

      if (existingCourse) {
        // Update existing course with new lesson
        const updatedLessons = [...existingCourse.lessons];
        const lessonIndex = updatedLessons.findIndex(l => l.id === lessonId);

        if (lessonIndex >= 0) {
          updatedLessons[lessonIndex] = lessonWithLocalFile;
        } else {
          updatedLessons.push(lessonWithLocalFile);
        }

        await addDownloadedCourse({
          ...existingCourse,
          lessons: updatedLessons,
          downloadedAt: new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
        });
      } else {
        // Create new course with single lesson
        await addDownloadedCourse({
          id: courseId,
          title: courseTitle,
          thumbnail: "📚",
          downloadedAt: new Date().toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          lessons: [lessonWithLocalFile],
        });
      }

      setDownloadingLessonId(null);
    } catch (error) {
      logger.error("Download error:", error);
      setDownloadingLessonId(null);
      Alert.alert(
        "Erreur de téléchargement",
        "Impossible de télécharger la leçon. Vérifiez votre connexion.",
        [{ text: MESSAGES.OK }]
      );
    }
  };

  const handleDownloadAllCourse = () => {
    if (!isConnectedToKiosk) {
      Alert.alert(
        "Hors ligne",
        MESSAGES.DOWNLOAD_ERROR_OFFLINE,
        [{ text: MESSAGES.OK }]
      );
      return;
    }

    if (downloadedCount === totalCount) {
      Alert.alert("Déjà téléchargé", MESSAGES.DOWNLOAD_ALL_ALREADY, [
        { text: MESSAGES.OK },
      ]);
      return;
    }

    Alert.alert(
      MESSAGES.DOWNLOAD_ALL_CONFIRM,
      `Voulez-vous télécharger toutes les ${totalCount} leçons ?`,
      [
        { text: MESSAGES.CANCEL, style: "cancel" },
        {
          text: MESSAGES.DOWNLOAD,
          onPress: async () => {
            setDownloadingAll(true);

            try {
              logger.info(`Downloading all ${lessons.length} lessons for course: ${courseTitle}`);

              // Download all lessons and store with LOCAL file paths
              const lessonsWithLocalFiles = await Promise.all(
                lessons.map(async (lesson) => {
                  try {
                    // Get remote URL for this lesson
                    const remoteUrl = lesson.mediaUrl || '';

                    // Generate filename, preserving original extension
                    const originalFilename = remoteUrl.split('/').pop()?.split('?')[0];
                    const fileName = generateFileName(lesson.id, lesson.title, lesson.type, originalFilename ? decodeURIComponent(originalFilename) : undefined);

                    // Download file to local storage
                    const localUri = await downloadFile(remoteUrl, fileName, (progress) => {
                      logger.info(`${lesson.title}: ${progress.progress.toFixed(2)}%`);
                    });

                    logger.info(`Downloaded: ${lesson.title} -> ${localUri}`);

                    // Analytics: emit one content_downloaded event per successfully downloaded lesson
                    enqueueEvent({
                      event_name: 'content_downloaded',
                      offline: !isConnectedToKiosk,
                      content: {
                        content_id: lesson.id,
                        content_type: lessonContentType(lesson),
                        subject: courseTitle,
                        content_title: lesson.title,
                      },
                    }).catch((e) => logger.error('analytics enqueue failed', e));

                    return {
                      ...lesson,
                      isDownloaded: true,
                      mediaUrl: localUri, // Store LOCAL path
                      isCompleted: false,
                    };
                  } catch (error) {
                    logger.error(`Failed to download lesson ${lesson.title}:`, error);
                    // Return lesson without download if it fails
                    return {
                      ...lesson,
                      isDownloaded: false,
                      isCompleted: false,
                    };
                  }
                })
              );

              // Mark all lessons as downloaded in local state
              setLessons((prev) => prev.map((l) => ({ ...l, isDownloaded: true })));

              // Save to downloads context
              await addDownloadedCourse({
                id: courseId,
                title: courseTitle,
                thumbnail: "📚",
                downloadedAt: new Date().toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }),
                lessons: lessonsWithLocalFiles.filter(l => l.isDownloaded), // Only include successfully downloaded lessons
              });

              setDownloadingAll(false);

              const successCount = lessonsWithLocalFiles.filter(l => l.isDownloaded).length;
              Alert.alert(
                MESSAGES.DOWNLOAD_COMPLETE,
                `${successCount} sur ${totalCount} leçons téléchargées avec succès.`,
                [{ text: MESSAGES.OK }]
              );
            } catch (error) {
              logger.error("Download all error:", error);
              setDownloadingAll(false);
              Alert.alert(
                "Erreur",
                "Impossible de télécharger toutes les leçons. Certaines leçons n'ont peut-être pas été téléchargées.",
                [{ text: MESSAGES.OK }]
              );
            }
          },
        },
      ]
    );
  };

  const renderTabs = () => {
    const tabs = [
      { key: 'lessons' as TabType, label: 'Leçons', icon: 'play-circle', count: categorizedLessons.lessons.length },
      { key: 'texts' as TabType, label: 'Textes', icon: 'document-text', count: categorizedLessons.texts.length },
      { key: 'exercises' as TabType, label: 'Exercices', icon: 'pencil', count: categorizedLessons.exercises.length },
    ];

    return (
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.tabActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? '#1E3A5F' : '#5A5A5A'}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            <View
              style={[
                styles.tabBadge,
                activeTab === tab.key && styles.tabBadgeActive,
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  activeTab === tab.key && styles.tabBadgeTextActive,
                ]}
              >
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderLesson = (lesson: Lesson) => {
    const isDownloading = downloadingLessonId === lesson.id || downloadingAll;

    return (
      <View key={lesson.id} style={styles.lessonCard}>
        <View style={styles.lessonIcon}>
          <Ionicons
            name={getIconForType(lesson.type)}
            size={24}
            color={lesson.isDownloaded ? "#17A2B8" : "#5A5A5A"}
          />
        </View>

        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <View style={styles.lessonMeta}>
            {lesson.duration && (
              <Text style={styles.lessonDuration}>{lesson.duration}</Text>
            )}
            {lesson.size && lesson.size !== 'N/A' ? (
              <Text style={styles.lessonSize}>{lesson.size}</Text>
            ) : (
              <Text style={styles.lessonSize}>{lesson.type === 'pdf' ? 'PDF' : lesson.type === 'audio' ? 'Audio' : 'Vidéo'}</Text>
            )}
          </View>
        </View>

        {lesson.isDownloaded ? (
          <View style={styles.downloadedBadge}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.downloadButton,
              isDownloading && styles.downloadButtonDisabled,
            ]}
            onPress={() => handleDownloadLesson(lesson.id)}
            disabled={isDownloading}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDownloading ? "hourglass" : "download-outline"}
              size={20}
              color={isDownloading ? "#A0A0A0" : "#1E3A5F"}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    const emptyMessages = {
      lessons: 'Aucune leçon disponible pour ce cours',
      texts: 'Aucun texte disponible pour ce cours',
      exercises: 'Aucun exercice disponible pour ce cours',
    };

    return (
      <View style={styles.emptyState}>
        <Ionicons name="folder-open-outline" size={64} color="#A0A0A0" />
        <Text style={styles.emptyStateText}>{emptyMessages[activeTab]}</Text>
      </View>
    );
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <AcademicBadge
                id={courseId}
                type="course"
                title={courseTitle}
                size={80}
              />
            </View>
            <View style={styles.placeholder} />
          </View>

          <Text style={styles.courseTitle}>{courseTitle}</Text>

          <View style={styles.courseStats}>
            <View style={styles.statItem}>
              <Ionicons name="download" size={16} color="#FFD700" />
              <Text style={styles.statText}>
                {downloadedCount}/{totalCount} téléchargés
              </Text>
            </View>
            {totalSizeBytes > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="server-outline" size={16} color="#FFD700" />
                <Text style={styles.statText}>{totalSizeFormatted}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Download All Button */}
        <View style={styles.downloadAllContainer}>
          <TouchableOpacity
            style={[
              styles.downloadAllButton,
              downloadingAll && styles.downloadAllButtonDisabled,
              downloadedCount === totalCount && styles.downloadAllButtonCompleted,
            ]}
            onPress={handleDownloadAllCourse}
            disabled={downloadingAll}
            activeOpacity={0.8}
          >
            <Ionicons
              name={
                downloadedCount === totalCount
                  ? "checkmark-circle"
                  : downloadingAll
                    ? "hourglass"
                    : "download"
              }
              size={22}
              color={downloadedCount === totalCount ? "#4CAF50" : "#1E3A5F"}
            />
            <Text
              style={[
                styles.downloadAllText,
                downloadedCount === totalCount && styles.downloadAllTextCompleted,
              ]}
            >
              {downloadedCount === totalCount
                ? "Cours téléchargé"
                : downloadingAll
                  ? "Téléchargement en cours..."
                  : "Télécharger tout le cours"}
            </Text>
          </TouchableOpacity>

          {!isConnectedToKiosk && (
            <View style={styles.offlineWarning}>
              <Ionicons name="alert-circle" size={16} color="#DC3545" />
              <Text style={styles.offlineWarningText}>
                Connectez-vous au kiosque pour télécharger
              </Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        {renderTabs()}

        {/* Content List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3A5F" />
            <Text style={styles.loadingText}>Chargement du contenu...</Text>
          </View>
        ) : error && lessons.length === 0 ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#DC3545" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {activeCategoryLessons.length > 0 ? (
              activeCategoryLessons.map(renderLesson)
            ) : (
              renderEmptyState()
            )}
          </ScrollView>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#1E3A5F",
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  placeholder: {
    width: 40,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  courseDescription: {
    fontSize: 16,
    color: "#FFD700",
    marginBottom: 16,
    textAlign: "center",
  },
  courseStats: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  downloadAllContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  downloadAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD700",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  downloadAllButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  downloadAllButtonCompleted: {
    backgroundColor: "#E8F5E9",
  },
  downloadAllText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A5F",
  },
  downloadAllTextCompleted: {
    color: "#4CAF50",
  },
  offlineWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    gap: 6,
  },
  offlineWarningText: {
    fontSize: 13,
    color: "#DC3545",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  lessonsTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 16,
  },
  lessonCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lessonIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C2C2C",
    marginBottom: 4,
  },
  lessonMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lessonSize: {
    fontSize: 13,
    color: "#5A5A5A",
  },
  lessonMetaSeparator: {
    fontSize: 13,
    color: "#A0A0A0",
  },
  lessonDuration: {
    fontSize: 13,
    color: "#5A5A5A",
  },
  downloadedBadge: {
    marginLeft: 12,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EBF0F5",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  downloadButtonDisabled: {
    backgroundColor: "#F8F9FA",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "#F8F9FA",
    gap: 6,
  },
  tabActive: {
    backgroundColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#5A5A5A",
  },
  tabTextActive: {
    color: "#1E3A5F",
    fontWeight: "700",
  },
  tabBadge: {
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeActive: {
    backgroundColor: "#1E3A5F",
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5A5A5A",
  },
  tabBadgeTextActive: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#5A5A5A",
    marginTop: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: "#DC3545",
    marginTop: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#A0A0A0",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
});
