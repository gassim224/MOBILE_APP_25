import { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useConnectionSimulator } from "@/contexts/ConnectionSimulatorContext";
import { Course, UserProfile } from "@/types";
import logger from "@/utils/Logger";
import { AcademicBadge } from "@/components/AcademicBadge";
import { StudentAPI, ApiSubject } from "@/services/api";

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

export default function AllCourses() {
  const router = useRouter();
  const { isConnectedToKiosk } = useConnectionSimulator();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const numColumns = width >= 768 ? 3 : 2;
  const cardWidth = (width - 64) / numColumns;

  const fetchSubjects = useCallback(async () => {
    if (!isConnectedToKiosk) { setCourses([]); return; }
    setLoading(true);
    try {
      const response = await StudentAPI.getSubjects();
      setCourses(response.success && response.subjects ? response.subjects.map(mapSubjectToCourse) : []);
    } catch (error) {
      logger.error("Failed to fetch subjects:", error);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [isConnectedToKiosk]);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const loadUserProfile = useCallback(async () => {
    try {
      const profileData = await AsyncStorage.getItem("userProfile");
      if (profileData) {
        setUserProfile(JSON.parse(profileData));
      } else {
        router.replace("/login");
      }
    } catch (error) {
      logger.error("Error loading user profile:", error);
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const filteredCourses = userProfile?.grade
    ? courses.filter(course => !course.gradeLevel || course.gradeLevel === userProfile.grade)
    : courses;

  const handleCoursePress = (course: Course) => {
    router.push({
      pathname: "/course-detail",
      params: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
      },
    });
  };

  const renderCourseCard = ({ item: course }: { item: Course }) => (
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
          size={cardWidth * 0.55}
        />
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {course.title}
        </Text>
      </View>
    </TouchableOpacity>
  );

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
            <Text style={styles.headerTitle}>Tous les cours</Text>
            <View style={styles.placeholder} />
          </View>
          <ConnectionStatus isConnected={isConnectedToKiosk} />
        </View>

        {/* Content */}
        {!isConnectedToKiosk ? (
          // Offline state
          <View style={styles.offlineContainer}>
            <View style={styles.offlineIcon}>
              <Ionicons name="cloud-offline-outline" size={80} color="#1E3A5F" />
            </View>
            <Text style={styles.offlineTitle}>Hors ligne</Text>
            <Text style={styles.offlineMessage}>
              Connectez-vous au Wi-Fi de l&apos;école pour découvrir et télécharger de nouveaux contenus.
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3A5F" />
            <Text style={styles.loadingText}>Chargement des cours...</Text>
          </View>
        ) : (
          // Online state - show filtered courses in grid
          <FlatList
            key={numColumns}
            data={filteredCourses}
            renderItem={renderCourseCard}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
          />
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
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
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
  },
  loadingText: {
    fontSize: 16,
    color: "#5A5A5A",
    marginTop: 16,
    fontWeight: "500",
  },
});
