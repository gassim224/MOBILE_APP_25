import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

interface DownloadedCourse {
  id: string;
  title: string;
  thumbnail: string;
  lessons: Lesson[];
  downloadedAt: string;
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
}

// Mock data - set to empty array to show empty state, or populate to show content
const MOCK_DOWNLOADS: DownloadedCourse[] = [
  // Uncomment to test populated state
  // {
  //   id: "1",
  //   title: "Mathématiques Avancées",
  //   thumbnail: "📐",
  //   downloadedAt: "Il y a 2 jours",
  //   lessons: [
  //     { id: "1-1", title: "Introduction à l'algèbre", duration: "15 min", isCompleted: true },
  //     { id: "1-2", title: "Équations linéaires", duration: "20 min", isCompleted: true },
  //     { id: "1-3", title: "Systèmes d'équations", duration: "25 min", isCompleted: false },
  //     { id: "1-4", title: "Fonctions quadratiques", duration: "30 min", isCompleted: false },
  //   ],
  // },
  // {
  //   id: "2",
  //   title: "Histoire Africaine",
  //   thumbnail: "🌍",
  //   downloadedAt: "Il y a 1 semaine",
  //   lessons: [
  //     { id: "2-1", title: "L'empire du Mali", duration: "18 min", isCompleted: true },
  //     { id: "2-2", title: "Le royaume de Songhaï", duration: "22 min", isCompleted: false },
  //     { id: "2-3", title: "Les royaumes côtiers", duration: "20 min", isCompleted: false },
  //   ],
  // },
];

export default function Downloads() {
  const [downloads] = useState<DownloadedCourse[]>(MOCK_DOWNLOADS);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
    new Set()
  );

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      {/* Illustration Placeholder */}
      <View style={styles.emptyIllustration}>
        <View style={styles.illustrationCircle}>
          <Text style={styles.illustrationEmoji}>👨🏿‍🎓</Text>
        </View>
        <View style={[styles.illustrationCircle, styles.illustrationCircleSecond]}>
          <Ionicons name="download-outline" size={48} color="#17A2B8" />
        </View>
      </View>

      <Text style={styles.emptyTitle}>Aucun téléchargement</Text>
      <Text style={styles.emptyMessage}>
        Vous n&apos;avez aucun téléchargement pour le moment.
      </Text>
      <Text style={styles.emptySubMessage}>
        Parcourez vos cours et téléchargez-les pour y accéder hors ligne.
      </Text>

      <TouchableOpacity style={styles.browseButton} activeOpacity={0.8}>
        <Ionicons name="book" size={20} color="#1E3A5F" />
        <Text style={styles.browseButtonText}>Parcourir le contenu</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLesson = (lesson: Lesson, courseId: string) => (
    <TouchableOpacity
      key={lesson.id}
      style={styles.lessonItem}
      activeOpacity={0.7}
    >
      <View style={styles.lessonIcon}>
        <Ionicons
          name={lesson.isCompleted ? "checkmark-circle" : "play-circle-outline"}
          size={24}
          color={lesson.isCompleted ? "#17A2B8" : "#5A5A5A"}
        />
      </View>
      <View style={styles.lessonInfo}>
        <Text
          style={[
            styles.lessonTitle,
            lesson.isCompleted && styles.lessonTitleCompleted,
          ]}
        >
          {lesson.title}
        </Text>
        <Text style={styles.lessonDuration}>{lesson.duration}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
    </TouchableOpacity>
  );

  const renderCourse = (course: DownloadedCourse) => {
    const isExpanded = expandedCourses.has(course.id);
    const completedLessons = course.lessons.filter((l) => l.isCompleted).length;
    const totalLessons = course.lessons.length;
    const progress = (completedLessons / totalLessons) * 100;

    return (
      <View key={course.id} style={styles.courseContainer}>
        <TouchableOpacity
          style={styles.courseHeader}
          onPress={() => toggleCourse(course.id)}
          activeOpacity={0.8}
        >
          <View style={styles.courseThumbnail}>
            <Text style={styles.courseThumbnailEmoji}>{course.thumbnail}</Text>
          </View>

          <View style={styles.courseHeaderInfo}>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseStats}>
              {completedLessons}/{totalLessons} leçons complétées
            </Text>
            <Text style={styles.downloadedDate}>{course.downloadedAt}</Text>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>
          </View>

          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#5A5A5A"
          />
        </TouchableOpacity>

        {/* Expanded Lessons */}
        {isExpanded && (
          <View style={styles.lessonsContainer}>
            {course.lessons.map((lesson) => renderLesson(lesson, course.id))}
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes Téléchargements</Text>
          {downloads.length > 0 && (
            <Text style={styles.headerSubtitle}>
              {downloads.length} cours téléchargé{downloads.length > 1 ? "s" : ""}
            </Text>
          )}
        </View>

        {/* Content */}
        {downloads.length === 0 ? (
          renderEmptyState()
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {downloads.map(renderCourse)}
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
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#5A5A5A",
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIllustration: {
    marginBottom: 32,
    position: "relative",
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  illustrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#1E3A5F",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  illustrationCircleSecond: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    bottom: 0,
    right: 0,
    borderWidth: 4,
    borderColor: "#F8F9FA",
  },
  illustrationEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyMessage: {
    fontSize: 16,
    color: "#5A5A5A",
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 22,
  },
  emptySubMessage: {
    fontSize: 14,
    color: "#A0A0A0",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  browseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFD700",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A5F",
  },

  // Populated State
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  courseContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  courseThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#1E3A5F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  courseThumbnailEmoji: {
    fontSize: 32,
  },
  courseHeaderInfo: {
    flex: 1,
    marginRight: 8,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 4,
  },
  courseStats: {
    fontSize: 13,
    color: "#17A2B8",
    marginBottom: 2,
    fontWeight: "600",
  },
  downloadedDate: {
    fontSize: 12,
    color: "#A0A0A0",
    marginBottom: 8,
  },
  progressBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#17A2B8",
    borderRadius: 3,
  },
  lessonsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 8,
    paddingBottom: 8,
  },
  lessonItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  lessonIcon: {
    marginRight: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C2C2C",
    marginBottom: 2,
  },
  lessonTitleCompleted: {
    color: "#5A5A5A",
  },
  lessonDuration: {
    fontSize: 12,
    color: "#A0A0A0",
  },
});
