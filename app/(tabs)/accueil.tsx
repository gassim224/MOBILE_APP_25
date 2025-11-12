import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useConnectionSimulator } from "@/contexts/ConnectionSimulatorContext";

interface UserProfile {
  studentName: string;
  schoolName: string;
  grade: string;
  studentId: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7;

// Mock data
const MOCK_COURSES: Course[] = [
  {
    id: "1",
    title: "Mathématiques",
    description: "Algèbre et Géométrie",
    thumbnail: "📐",
  },
  {
    id: "2",
    title: "Physique",
    description: "Mécanique et Électricité",
    thumbnail: "⚛️",
  },
  {
    id: "3",
    title: "Chimie",
    description: "Chimie Organique",
    thumbnail: "🧪",
  },
  {
    id: "4",
    title: "Economie",
    description: "Micro et Macroéconomie",
    thumbnail: "📈",
  },
  {
    id: "5",
    title: "Philosophie",
    description: "Pensée et Raisonnement",
    thumbnail: "🤔",
  },
  {
    id: "6",
    title: "Anglais",
    description: "Langue et Culture",
    thumbnail: "🇬🇧",
  },
  {
    id: "7",
    title: "Français",
    description: "Littérature et Grammaire",
    thumbnail: "🇫🇷",
  },
];

export default function Accueil() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { isConnectedToKiosk } = useConnectionSimulator();

  const loadUserProfile = useCallback(async () => {
    try {
      const profileData = await AsyncStorage.getItem("userProfile");
      if (profileData) {
        setUserProfile(JSON.parse(profileData));
      } else {
        router.replace("/login");
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleCoursePress = (course: Course) => {
    router.push({
      pathname: "/course-details",
      params: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
      },
    });
  };

  const renderCourseCard = (course: Course) => (
    <TouchableOpacity
      key={course.id}
      style={styles.courseCard}
      activeOpacity={0.8}
      onPress={() => handleCoursePress(course)}
    >
      <View style={styles.courseThumbnail}>
        <Text style={styles.thumbnailEmoji}>{course.thumbnail}</Text>
      </View>
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.courseDescription} numberOfLines={1}>
          {course.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header with Welcome Message and Connection Status */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.greetingText}>
              Bonjour {userProfile?.studentName},
            </Text>
            <Text style={styles.schoolText}>
              de {userProfile?.schoolName}
            </Text>
          </View>
          <ConnectionStatus isConnected={isConnectedToKiosk} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {!isConnectedToKiosk ? (
            // Not connected state
            <View style={styles.notConnectedContainer}>
              <View style={styles.notConnectedIcon}>
                <Ionicons name="wifi-outline" size={80} color="#1E3A5F" />
              </View>
              <Text style={styles.notConnectedTitle}>
                Connexion requise
              </Text>
              <Text style={styles.notConnectedMessage}>
                Connectez-vous au Wi-Fi de l&apos;école pour découvrir et télécharger de nouveaux cours.
              </Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={() => router.push("/(tabs)/profile")}
                activeOpacity={0.8}
              >
                <Ionicons name="settings" size={20} color="#1E3A5F" />
                <Text style={styles.refreshButtonText}>Paramètres de connexion</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Connected state - show all courses
            <>
              {/* My Courses Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Mes Cours</Text>
                  <TouchableOpacity
                    style={styles.seeAllButton}
                    activeOpacity={0.7}
                    onPress={() => router.push("/all-courses")}
                  >
                    <Text style={styles.seeAllText}>Voir tout</Text>
                    <Ionicons name="chevron-forward" size={16} color="#1E3A5F" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}
                >
                  {MOCK_COURSES.slice(0, 5).map(renderCourseCard)}
                </ScrollView>
              </View>

              {/* Library Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Bibliothèque</Text>
                  <TouchableOpacity
                    style={styles.seeAllButton}
                    activeOpacity={0.7}
                    onPress={() => router.push("/(tabs)/bibliotheque")}
                  >
                    <Text style={styles.seeAllText}>Voir tout</Text>
                    <Ionicons name="chevron-forward" size={16} color="#1E3A5F" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalScroll}
                >
                  {MOCK_COURSES.slice(0, 3).map((course) => (
                    <TouchableOpacity
                      key={`lib-${course.id}`}
                      style={styles.courseCard}
                      activeOpacity={0.8}
                      onPress={() => handleCoursePress(course)}
                    >
                      <View style={styles.courseThumbnail}>
                        <Text style={styles.thumbnailEmoji}>{course.thumbnail}</Text>
                      </View>
                      <View style={styles.courseInfo}>
                        <Text style={styles.courseTitle} numberOfLines={2}>
                          {course.title}
                        </Text>
                        <Text style={styles.courseDescription} numberOfLines={1}>
                          {course.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickActionsSection}>
                <Text style={styles.quickActionsTitle}>Actions rapides</Text>
                <View style={styles.quickActionsGrid}>
                  <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
                    <Ionicons name="search" size={32} color="#1E3A5F" />
                    <Text style={styles.quickActionText}>Rechercher</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
                    <Ionicons name="star" size={32} color="#FFD700" />
                    <Text style={styles.quickActionText}>Favoris</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  welcomeSection: {
    marginBottom: 12,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  schoolText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFD700",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E3A5F",
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(30, 58, 95, 0.05)",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A5F",
    marginRight: 4,
  },
  horizontalScroll: {
    paddingHorizontal: 24,
    gap: 16,
  },
  courseCard: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  courseThumbnail: {
    width: "100%",
    height: 140,
    backgroundColor: "#1E3A5F",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailEmoji: {
    fontSize: 64,
  },
  courseInfo: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 6,
  },
  courseDescription: {
    fontSize: 14,
    color: "#5A5A5A",
  },
  quickActionsSection: {
    paddingHorizontal: 24,
    marginTop: 8,
  },
  quickActionsTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2C2C2C",
    marginTop: 8,
  },
  notConnectedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  notConnectedIcon: {
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
  notConnectedTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 16,
    textAlign: "center",
  },
  notConnectedMessage: {
    fontSize: 16,
    color: "#5A5A5A",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  refreshButton: {
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
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A5F",
    marginLeft: 8,
  },
});
