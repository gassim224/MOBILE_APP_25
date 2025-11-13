import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Switch,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
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

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  thumbnail: string;
}

interface RecentActivity {
  id: string;
  type: "course" | "book";
  title: string;
  subtitle: string;
  thumbnail: string;
  progress?: number;
  lastAccessed: string;
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

const MOCK_BOOKS: Book[] = [
  {
    id: "b1",
    title: "Une si longue lettre",
    author: "Mariama Bâ",
    description: "Un chef-d'œuvre de la littérature africaine francophone.",
    thumbnail: "📕",
  },
  {
    id: "b2",
    title: "L'Enfant noir",
    author: "Camara Laye",
    description: "Une autobiographie touchante sur l'enfance en Afrique.",
    thumbnail: "📗",
  },
  {
    id: "b3",
    title: "L'alchimiste",
    author: "Paulo Coelho",
    description: "Une quête spirituelle et philosophique inoubliable.",
    thumbnail: "📘",
  },
];

const MOCK_RECENT_ACTIVITIES: RecentActivity[] = [
  {
    id: "r1",
    type: "course",
    title: "Mathématiques",
    subtitle: "Algèbre et Géométrie",
    thumbnail: "📐",
    progress: 65,
    lastAccessed: "Il y a 2 heures",
  },
  {
    id: "r2",
    type: "book",
    title: "Une si longue lettre",
    subtitle: "Mariama Bâ",
    thumbnail: "📕",
    progress: 40,
    lastAccessed: "Hier",
  },
  {
    id: "r3",
    type: "course",
    title: "Physique",
    subtitle: "Mécanique et Électricité",
    thumbnail: "⚛️",
    progress: 30,
    lastAccessed: "Il y a 3 jours",
  },
];

export default function Home() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const { isConnectedToKiosk, isSimulatorEnabled, setSimulatedConnectionState } = useConnectionSimulator();

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
      pathname: "/course-detail",
      params: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
      },
    });
  };

  const handleBookPress = (book: Book) => {
    setSelectedBook(book);
    setBookModalVisible(true);
  };

  const handleRecentActivityPress = (activity: RecentActivity) => {
    if (activity.type === "course") {
      router.push({
        pathname: "/course-detail",
        params: {
          id: activity.id,
          title: activity.title,
          description: activity.subtitle,
          thumbnail: activity.thumbnail,
        },
      });
    } else {
      // Navigate to book reader (only if downloaded - will implement later)
      console.log("Open book:", activity.title);
    }
  };

  const toggleConnectionSimulator = async () => {
    await setSimulatedConnectionState(!isConnectedToKiosk);
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

  const renderBookCard = (book: Book) => (
    <TouchableOpacity
      key={book.id}
      style={styles.bookCard}
      activeOpacity={0.8}
      onPress={() => handleBookPress(book)}
    >
      <View style={styles.bookCover}>
        <Text style={styles.bookCoverEmoji}>{book.thumbnail}</Text>
      </View>
      <Text style={styles.bookTitle} numberOfLines={2}>
        {book.title}
      </Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>
        {book.author}
      </Text>
    </TouchableOpacity>
  );

  const renderRecentActivityCard = (activity: RecentActivity) => (
    <TouchableOpacity
      key={activity.id}
      style={styles.recentActivityCard}
      activeOpacity={0.8}
      onPress={() => handleRecentActivityPress(activity)}
    >
      <View style={styles.activityThumbnail}>
        <Text style={styles.activityEmoji}>{activity.thumbnail}</Text>
      </View>
      <View style={styles.activityInfo}>
        <Text style={styles.activityTitle} numberOfLines={1}>
          {activity.title}
        </Text>
        <Text style={styles.activitySubtitle} numberOfLines={1}>
          {activity.subtitle}
        </Text>
        <Text style={styles.activityTime}>{activity.lastAccessed}</Text>
        {activity.progress !== undefined && (
          <View style={styles.activityProgressContainer}>
            <View style={styles.activityProgressBar}>
              <View
                style={[styles.activityProgress, { width: `${activity.progress}%` }]}
              />
            </View>
            <Text style={styles.activityProgressText}>{activity.progress}%</Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
    </TouchableOpacity>
  );

  const renderBookModal = () => {
    if (!selectedBook) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={bookModalVisible}
        onRequestClose={() => setBookModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setBookModalVisible(false)}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={28} color="#2C2C2C" />
            </TouchableOpacity>

            <View style={styles.modalBookCover}>
              <Text style={styles.modalBookEmoji}>{selectedBook.thumbnail}</Text>
            </View>

            <Text style={styles.modalBookTitle}>{selectedBook.title}</Text>
            <Text style={styles.modalBookAuthor}>{selectedBook.author}</Text>
            <Text style={styles.modalBookDescription}>{selectedBook.description}</Text>

            <TouchableOpacity
              style={styles.modalDownloadButton}
              activeOpacity={0.8}
              onPress={() => {
                // Implement download logic
                console.log("Download book:", selectedBook.title);
                setBookModalVisible(false);
              }}
            >
              <Ionicons name="download" size={20} color="#1E3A5F" />
              <Text style={styles.modalDownloadButtonText}>Télécharger</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header with Welcome Message and Connection Toggle */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.greetingText}>
              Bonjour {userProfile?.studentName},
            </Text>
            <Text style={styles.schoolText}>
              de {userProfile?.schoolName}
            </Text>
          </View>

          {/* Connection Toggle Switch */}
          {isSimulatorEnabled && (
            <View style={styles.connectionToggle}>
              <Text style={styles.connectionToggleLabel}>
                {isConnectedToKiosk ? "🟢 En Ligne" : "🔴 Hors Ligne"}
              </Text>
              <Switch
                value={isConnectedToKiosk}
                onValueChange={toggleConnectionSimulator}
                trackColor={{ false: "#DC3545", true: "#4CAF50" }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#DC3545"
              />
            </View>
          )}
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Continue Learning Section - Always visible */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continuer l&apos;apprentissage</Text>
            {MOCK_RECENT_ACTIVITIES.length === 0 ? (
              <View style={styles.emptyRecentActivity}>
                <Ionicons name="book-outline" size={48} color="#A0A0A0" />
                <Text style={styles.emptyRecentText}>
                  Commencez à apprendre pour voir vos activités récentes ici
                </Text>
              </View>
            ) : (
              <View style={styles.recentActivityList}>
                {MOCK_RECENT_ACTIVITIES.map(renderRecentActivityCard)}
              </View>
            )}
          </View>

          {!isConnectedToKiosk ? (
            // Offline state - show offline message
            <View style={styles.notConnectedContainer}>
              <View style={styles.notConnectedIcon}>
                <Ionicons name="wifi-outline" size={80} color="#1E3A5F" />
              </View>
              <Text style={styles.notConnectedTitle}>
                Mode Hors Ligne
              </Text>
              <Text style={styles.notConnectedMessage}>
                Connectez-vous au Wi-Fi de l&apos;école pour découvrir et télécharger de nouveaux contenus.
              </Text>
            </View>
          ) : (
            // Online state - show discovery sections
            <>
              {/* Courses Section */}
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

              {/* Bibliothèque Section */}
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
                  {MOCK_BOOKS.map(renderBookCard)}
                </ScrollView>
              </View>
            </>
          )}
        </ScrollView>

        {/* Book Detail Modal */}
        {renderBookModal()}
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

  // Connection Toggle
  connectionToggle: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 8,
  },
  connectionToggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  // Recent Activity / Continue Learning
  recentActivityList: {
    paddingHorizontal: 24,
    gap: 12,
  },
  recentActivityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  activityThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#1E3A5F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 32,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
    color: "#5A5A5A",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: "#A0A0A0",
    marginBottom: 8,
  },
  activityProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activityProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  activityProgress: {
    height: "100%",
    backgroundColor: "#17A2B8",
    borderRadius: 3,
  },
  activityProgressText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#17A2B8",
    minWidth: 40,
    textAlign: "right",
  },
  emptyRecentActivity: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyRecentText: {
    fontSize: 14,
    color: "#A0A0A0",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
  },

  // Book Cards
  bookCard: {
    width: CARD_WIDTH * 0.6,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  bookCover: {
    width: "100%",
    aspectRatio: 0.7,
    backgroundColor: "#17A2B8",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  bookCoverEmoji: {
    fontSize: 40,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 4,
    lineHeight: 18,
  },
  bookAuthor: {
    fontSize: 12,
    color: "#5A5A5A",
    fontStyle: "italic",
  },

  // Book Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalCloseButton: {
    alignSelf: "flex-end",
    padding: 4,
    marginBottom: 8,
  },
  modalBookCover: {
    width: 120,
    height: 160,
    backgroundColor: "#17A2B8",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  modalBookEmoji: {
    fontSize: 64,
  },
  modalBookTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1E3A5F",
    textAlign: "center",
    marginBottom: 8,
  },
  modalBookAuthor: {
    fontSize: 16,
    color: "#5A5A5A",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 16,
  },
  modalBookDescription: {
    fontSize: 15,
    color: "#2C2C2C",
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  modalDownloadButton: {
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
  modalDownloadButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E3A5F",
  },

  // Offline State
  notConnectedContainer: {
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
  },
});
