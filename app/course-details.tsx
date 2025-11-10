import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useConnectionSimulator } from "@/contexts/ConnectionSimulatorContext";

interface Lesson {
  id: string;
  title: string;
  type: "video" | "pdf" | "quiz";
  duration: string;
}

// Mock lessons data
const MOCK_LESSONS: Lesson[] = [
  { id: "1", title: "Introduction au cours", type: "video", duration: "15 min" },
  { id: "2", title: "Chapitre 1: Les bases", type: "video", duration: "25 min" },
  { id: "3", title: "Document de référence", type: "pdf", duration: "10 min" },
  { id: "4", title: "Chapitre 2: Approfondissement", type: "video", duration: "30 min" },
  { id: "5", title: "Quiz d'évaluation", type: "quiz", duration: "5 min" },
  { id: "6", title: "Chapitre 3: Pratique", type: "video", duration: "20 min" },
];

export default function CourseDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isConnectedToKiosk } = useConnectionSimulator();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const courseTitle = params.title as string || "Détails du cours";
  const courseDescription = params.description as string || "";
  const courseThumbnail = params.thumbnail as string || "📚";

  const handleDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    // Simulate download progress
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const getLessonIcon = (type: Lesson["type"]) => {
    switch (type) {
      case "video":
        return "📹";
      case "pdf":
        return "📄";
      case "quiz":
        return "❓";
      default:
        return "📝";
    }
  };

  const renderLesson = (lesson: Lesson) => (
    <View key={lesson.id} style={styles.lessonItem}>
      <Text style={styles.lessonIcon}>{getLessonIcon(lesson.type)}</Text>
      <View style={styles.lessonInfo}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>
        <Text style={styles.lessonDuration}>{lesson.duration}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
    </View>
  );

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {courseTitle}
            </Text>
            <ConnectionStatus isConnected={isConnectedToKiosk} />
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Course Info */}
          <View style={styles.courseInfoSection}>
            <View style={styles.courseThumbnailLarge}>
              <Text style={styles.courseThumbnailEmoji}>{courseThumbnail}</Text>
            </View>
            <Text style={styles.courseTitle}>{courseTitle}</Text>
            <Text style={styles.courseDescription}>{courseDescription}</Text>
          </View>

          {isConnectedToKiosk ? (
            // Online state
            <>
              {/* Download Button */}
              {!isDownloading && downloadProgress < 100 && (
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={handleDownload}
                  activeOpacity={0.8}
                >
                  <Ionicons name="download" size={22} color="#1E3A5F" />
                  <Text style={styles.downloadButtonText}>Télécharger le cours</Text>
                </TouchableOpacity>
              )}

              {/* Download Progress */}
              {isDownloading && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressText}>Téléchargement en cours...</Text>
                    <Text style={styles.progressPercent}>{downloadProgress}%</Text>
                  </View>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
                  </View>
                </View>
              )}

              {/* Downloaded Status */}
              {downloadProgress === 100 && !isDownloading && (
                <View style={styles.downloadedBadge}>
                  <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                  <Text style={styles.downloadedText}>Cours téléchargé</Text>
                </View>
              )}

              {/* Lessons List */}
              <View style={styles.lessonsSection}>
                <Text style={styles.lessonsSectionTitle}>Contenu du cours</Text>
                <Text style={styles.lessonsSectionSubtitle}>
                  {MOCK_LESSONS.length} leçons • {MOCK_LESSONS.reduce((acc, l) => acc + parseInt(l.duration), 0)} min
                </Text>
                <View style={styles.lessonsList}>
                  {MOCK_LESSONS.map(renderLesson)}
                </View>
              </View>
            </>
          ) : (
            // Offline state - course not downloaded
            <View style={styles.offlineContainer}>
              <View style={styles.offlineIcon}>
                <Ionicons name="cloud-offline" size={60} color="#DC3545" />
              </View>
              <Text style={styles.offlineTitle}>Vous êtes hors-ligne</Text>
              <Text style={styles.offlineMessage}>
                Veuillez retrouver vos cours téléchargés ici.
              </Text>
              <TouchableOpacity
                style={styles.goToDownloadsButton}
                onPress={() => router.push("/(tabs)/downloads")}
                activeOpacity={0.8}
              >
                <Ionicons name="download" size={20} color="#1E3A5F" />
                <Text style={styles.goToDownloadsButtonText}>Mes téléchargements</Text>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 20,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  courseInfoSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  courseThumbnailLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1E3A5F",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  courseThumbnailEmoji: {
    fontSize: 64,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A5F",
    textAlign: "center",
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 16,
    color: "#5A5A5A",
    textAlign: "center",
    lineHeight: 22,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFD700",
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A5F",
  },
  progressContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C2C2C",
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "700",
    color: "#17A2B8",
  },
  progressBarContainer: {
    width: "100%",
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#17A2B8",
    borderRadius: 4,
  },
  downloadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  downloadedText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4CAF50",
  },
  lessonsSection: {
    paddingHorizontal: 24,
  },
  lessonsSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 4,
  },
  lessonsSectionSubtitle: {
    fontSize: 14,
    color: "#5A5A5A",
    marginBottom: 16,
  },
  lessonsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lessonItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  lessonIcon: {
    fontSize: 24,
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
  lessonDuration: {
    fontSize: 13,
    color: "#5A5A5A",
  },
  offlineContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  offlineIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#DC3545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 12,
    textAlign: "center",
  },
  offlineMessage: {
    fontSize: 16,
    color: "#5A5A5A",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  goToDownloadsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  goToDownloadsButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A5F",
  },
});
