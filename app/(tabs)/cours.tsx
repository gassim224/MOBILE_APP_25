import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, ListRenderItem, ActivityIndicator, ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useConnectionSimulator } from "@/contexts/ConnectionSimulatorContext";
import { useActiveGrade } from "@/contexts/ActiveGradeContext";
import { Course } from "@/types";
import { AcademicBadge } from "@/components/AcademicBadge";
import { StudentAPI, ApiSubject } from "@/services/api";
import { useDownloads } from "@/contexts/DownloadsContext";
import logger from "@/utils/Logger";

// Subject descriptions mapping
const SUBJECT_DESCRIPTIONS: Record<string, string> = {
  "Français": "Littérature et Grammaire",
  "Anglais": "Langue et Culture",
  "Histoire": "Histoire du Monde",
  "Géographie": "Géographie Mondiale",
  "Économie": "Micro et Macroéconomie",
  "Philosophie": "Pensée et Raisonnement",
  "Mathématiques": "Algèbre et Géométrie",
  "Physique": "Mécanique et Électricité",
  "Chimie": "Chimie Organique",
  "Biologie": "Sciences de la Vie",
};

const mapSubjectToCourse = (subject: ApiSubject): Course => ({
  id: subject.id,
  title: subject.name,
  description: subject.description || SUBJECT_DESCRIPTIONS[subject.name] || "",
  thumbnail: subject.thumbnail || "📚",
  gradeLevel: subject.grade || "",
});

function Cours() {
  const router = useRouter();
  const { isConnectedToKiosk } = useConnectionSimulator();
  const { activeGrade, availableGrades, canSwitch, setActiveGrade } = useActiveGrade();
  const { downloadedCourses: contextDownloadedCourses } = useDownloads();
  const { width } = useWindowDimensions();
  const numColumns = width >= 768 ? 3 : 2;
  const cardWidth = (width - 64) / numColumns;
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDownloadedCourses = useCallback(() => {
    if (contextDownloadedCourses.length === 0) {
      setCourses([]);
      setError("Aucun cours téléchargé");
    } else {
      setCourses(contextDownloadedCourses.map(dc => ({
        id: dc.id,
        title: dc.title,
        description: `${dc.lessons.length} leçons téléchargées`,
        thumbnail: dc.thumbnail,
        gradeLevel: "",
      })));
      setError(null);
    }
  }, [contextDownloadedCourses]);

  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError(null);
      if (!isConnectedToKiosk) {
        loadDownloadedCourses();
        setLoading(false);
        return;
      }
      try {
        const response = await StudentAPI.getSubjects(activeGrade);
        if (response.success && response.subjects) {
          setCourses(response.subjects.map(mapSubjectToCourse));
        } else {
          setCourses([]);
          setError("Aucun cours disponible");
        }
      } catch (err) {
        logger.error("Failed to fetch subjects:", err);
        setError("Impossible de charger les cours. Vérifiez votre connexion.");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, [isConnectedToKiosk, loadDownloadedCourses, activeGrade]);

  useFocusEffect(
    useCallback(() => {
      if (!isConnectedToKiosk) loadDownloadedCourses();
    }, [isConnectedToKiosk, loadDownloadedCourses])
  );

  const handleCoursePress = useCallback((course: Course) => {
    router.push({
      pathname: "/course-detail",
      params: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
      },
    });
  }, [router]);

  const renderCourseCard: ListRenderItem<Course> = useCallback(({ item: course }) => (
    <TouchableOpacity
      style={[styles.courseCard, { width: cardWidth }]}
      activeOpacity={0.8}
      onPress={() => handleCoursePress(course)}
    >
      <View style={[styles.courseThumbnailContainer, { height: cardWidth * 0.75 }]}>
        <AcademicBadge
          id={course.id}
          type="course"
          title={course.title}
          size={cardWidth * 0.65}
        />
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {course.title}
        </Text>
      </View>
    </TouchableOpacity>
  ), [handleCoursePress, cardWidth]);

  const keyExtractor = useCallback((item: Course) => item.id, []);

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Tous les cours</Text>
          </View>
          <ConnectionStatus isConnected={isConnectedToKiosk} />
        </View>

        {/* Teacher grade switcher — only visible for teachers with multiple
            assigned classes. Refetches the courses list for the picked grade. */}
        {canSwitch && availableGrades.length > 0 && (
          <View style={styles.gradeSwitcher}>
            <Text style={styles.gradeSwitcherLabel}>Classe :</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {availableGrades.map((g) => {
                const active = g === activeGrade;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setActiveGrade(g)}
                    style={[styles.gradeChip, active && styles.gradeChipActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.gradeChipText, active && styles.gradeChipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3A5F" />
            <Text style={styles.loadingText}>Chargement des cours...</Text>
          </View>
        ) : error && courses.length === 0 ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color="#DC3545" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            key={numColumns}
            data={courses}
            renderItem={renderCourseCard}
            keyExtractor={keyExtractor}
            numColumns={numColumns}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="folder-open-outline" size={64} color="#A0A0A0" />
                <Text style={styles.emptyText}>Aucun cours disponible</Text>
              </View>
            }
          />
        )}
      </View>
    </>
  );
}

export default React.memo(Cours);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  gradeSwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  gradeSwitcherLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    marginRight: 4,
  },
  gradeChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  gradeChipActive: {
    backgroundColor: '#1E3A5F',
    borderColor: '#1E3A5F',
  },
  gradeChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  gradeChipTextActive: {
    color: '#FFFFFF',
  },
  header: {
    backgroundColor: "#1E3A5F",
    paddingTop: 60,
    paddingBottom: 20,
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
    justifyContent: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  gridContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  courseCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  courseThumbnailContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  courseInfo: {
    padding: 12,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 13,
    color: "#5A5A5A",
    lineHeight: 18,
  },
  offlineContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  offlineIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#E8F4F8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#17A2B8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 16,
    textAlign: "center",
  },
  offlineMessage: {
    fontSize: 16,
    color: "#5A5A5A",
    textAlign: "center",
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: "#A0A0A0",
    marginTop: 16,
    fontWeight: "500",
  },
});
