import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useConnectionSimulator } from "@/contexts/ConnectionSimulatorContext";
import { useDownloads } from "@/contexts/DownloadsContext";
import { Lesson } from "@/types";
import { MESSAGES } from "@/constants/AppConstants";
import { SAMPLE_PDF_URL, SAMPLE_VIDEO_URL, SAMPLE_AUDIO_URL } from "@/constants/SampleData";
import { downloadFile, generateFileName } from "@/utils/fileDownloader";
import logger from "@/utils/Logger";
import { AcademicBadge } from "@/components/AcademicBadge";

// Mock lessons data for a course
const MOCK_LESSONS: Lesson[] = [
  {
    id: "l1",
    title: "Introduction à l'algèbre",
    type: "video",
    size: "45 MB",
    duration: "15 min",
    isDownloaded: false,
  },
  {
    id: "l2",
    title: "Équations linéaires - Théorie",
    type: "pdf",
    size: "2.3 MB",
    isDownloaded: false,
  },
  {
    id: "l3",
    title: "Équations linéaires - Pratique",
    type: "video",
    size: "52 MB",
    duration: "20 min",
    isDownloaded: false,
  },
  {
    id: "l4",
    title: "Systèmes d'équations",
    type: "video",
    size: "68 MB",
    duration: "25 min",
    isDownloaded: false,
  },
  {
    id: "l5",
    title: "Exercices - Systèmes d'équations",
    type: "pdf",
    size: "1.8 MB",
    isDownloaded: false,
  },
  {
    id: "l6",
    title: "Fonctions quadratiques",
    type: "video",
    size: "75 MB",
    duration: "30 min",
    isDownloaded: false,
  },
  {
    id: "l7",
    title: "Résolution de problèmes",
    type: "audio",
    size: "12 MB",
    duration: "18 min",
    isDownloaded: false,
  },
  {
    id: "l8",
    title: "Résumé du cours",
    type: "pdf",
    size: "3.5 MB",
    isDownloaded: false,
  },
  {
    id: "l9",
    title: "Guide de révision",
    type: "pdf",
    size: "4.2 MB",
    isDownloaded: false,
  },
  {
    id: "l10",
    title: "Exercices de pratique - Niveau 1",
    type: "pdf",
    size: "2.1 MB",
    isDownloaded: false,
  },
  {
    id: "l11",
    title: "Exercices de pratique - Niveau 2",
    type: "pdf",
    size: "2.5 MB",
    isDownloaded: false,
  },
];

type TabType = 'lessons' | 'texts' | 'exercises';

// Categorize lessons based on type and title
const categorizeLessons = (lessons: Lesson[]) => {
  const categorized = {
    lessons: [] as Lesson[],
    texts: [] as Lesson[],
    exercises: [] as Lesson[],
  };

  lessons.forEach((lesson) => {
    // Check if it's an exercise based on title
    const isExercise = lesson.title.toLowerCase().includes('exercice');

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

export default function CourseDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isConnectedToKiosk } = useConnectionSimulator();
  const { addDownloadedCourse, downloadedCourses } = useDownloads();

  const [lessons, setLessons] = useState<Lesson[]>(MOCK_LESSONS);
  const [downloadingLessonId, setDownloadingLessonId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('lessons');

  // Validate and extract navigation params with proper typing
  const courseTitle = (params.title as string | undefined) || "Cours";
  const courseDescription = (params.description as string | undefined) || "";
  const courseId = (params.id as string | undefined) || "unknown";

  // Validate required params on mount
  useEffect(() => {
    if (!params.title) {
      Alert.alert(
        "Erreur",
        "Les informations du cours sont manquantes.",
        [
          {
            text: MESSAGES.OK,
            onPress: () => router.back(),
          },
        ]
      );
    }
  }, [params.title, router]);

  // Categorize lessons
  const categorizedLessons = categorizeLessons(lessons);

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
        if (downloadedLesson) {
          return { ...lesson, isDownloaded: true };
        }
        return lesson;
      }));
    }
  }, [downloadedCourses, courseId]);

  const totalSize = lessons.reduce((sum, lesson) => {
    const size = parseFloat(lesson.size);
    return sum + size;
  }, 0);

  const downloadedCount = lessons.filter((l) => l.isDownloaded).length;
  const totalCount = lessons.length;

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

  const getMediaUrlForType = (type: Lesson["type"]): string => {
    switch (type) {
      case "video":
        return SAMPLE_VIDEO_URL;
      case "pdf":
        return SAMPLE_PDF_URL;
      case "audio":
        return SAMPLE_AUDIO_URL;
      default:
        return "";
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

      // Get the remote URL for this lesson type
      const remoteUrl = getMediaUrlForType(lesson.type);

      // Generate filename
      const fileName = generateFileName(lessonId, lesson.title, lesson.type);

      logger.info(`Starting download: ${lesson.title}`);
      logger.info(`Remote URL: ${remoteUrl}`);
      logger.info(`File name: ${fileName}`);

      // Actually download the file to local storage
      const localUri = await downloadFile(remoteUrl, fileName, (progress) => {
        logger.info(`Download progress: ${progress.progress.toFixed(2)}%`);
      });

      logger.info(`File downloaded to: ${localUri}`);

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
      `Voulez-vous télécharger toutes les ${totalCount} leçons (environ ${totalSize.toFixed(1)} MB) ?`,
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
                    // Get remote URL for this lesson type
                    const remoteUrl = getMediaUrlForType(lesson.type);

                    // Generate filename
                    const fileName = generateFileName(lesson.id, lesson.title, lesson.type);

                    // Download file to local storage
                    const localUri = await downloadFile(remoteUrl, fileName, (progress) => {
                      logger.info(`${lesson.title}: ${progress.progress.toFixed(2)}%`);
                    });

                    logger.info(`Downloaded: ${lesson.title} -> ${localUri}`);

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
            <Text style={styles.lessonSize}>{lesson.size}</Text>
            {lesson.duration && (
              <>
                <Text style={styles.lessonMetaSeparator}>•</Text>
                <Text style={styles.lessonDuration}>{lesson.duration}</Text>
              </>
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
          {courseDescription && (
            <Text style={styles.courseDescription}>{courseDescription}</Text>
          )}

          <View style={styles.courseStats}>
            <View style={styles.statItem}>
              <Ionicons name="list" size={16} color="#FFD700" />
              <Text style={styles.statText}>
                {downloadedCount}/{totalCount} leçons
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="cloud-download" size={16} color="#FFD700" />
              <Text style={styles.statText}>{totalSize.toFixed(1)} MB</Text>
            </View>
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
