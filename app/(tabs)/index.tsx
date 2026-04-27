import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useConnectionSimulator } from "@/contexts/ConnectionSimulatorContext";
import { useDownloads } from "@/contexts/DownloadsContext";
import { progressStorage } from "@/utils/progressStorage";
import logger from "@/utils/Logger";
import { UserProfile, Course, Book } from "@/types";
import { AcademicBadge } from "@/components/AcademicBadge";
import { StudentAPI, ApiSubject, ApiBook } from "@/services/api";

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
const CARD_WIDTH = width * 0.38; // Unified card width for both courses and books

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

// Convert API data to local types
const mapSubjectToCourse = (subject: ApiSubject): Course => ({
  id: subject.id,
  title: subject.name,
  description: subject.description || SUBJECT_DESCRIPTIONS[subject.name] || "",
  thumbnail: subject.thumbnail || "📚",
  gradeLevel: subject.grade || "",
});

const mapApiBookToBook = (apiBook: ApiBook): Book => ({
  id: apiBook.id,
  title: apiBook.title,
  author: apiBook.author,
  description: "",
  thumbnail: "📚",
});

export default function Home() {
  const router = useRouter();
  const { downloadedCourses, downloadedBooks } = useDownloads();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [bookProgressMap, setBookProgressMap] = useState<Record<string, number>>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const { isConnectedToKiosk } = useConnectionSimulator();

  // Load downloaded content for offline mode — uses context (same storage as addDownloadedCourse)
  const loadDownloadedContent = useCallback(() => {
    setCourses(downloadedCourses.map(dc => ({
      id: dc.id,
      title: dc.title,
      description: `${dc.lessons.length} leçons téléchargées`,
      thumbnail: dc.thumbnail,
      gradeLevel: "",
    })));
    setBooks(downloadedBooks.map(db => ({
      id: db.id,
      title: db.title,
      author: db.author,
      description: "Téléchargé",
      thumbnail: db.thumbnail,
    })));
  }, [downloadedCourses, downloadedBooks]);

  // Fetch from API when online, load downloads when offline
  const fetchData = useCallback(async () => {
    setLoadingContent(true);
    if (!isConnectedToKiosk) {
      loadDownloadedContent();
      setLoadingContent(false);
      return;
    }
    try {
      const [subjectsResponse, booksResponse] = await Promise.all([
        StudentAPI.getSubjects().catch(err => { logger.warn("Failed to fetch subjects:", err); return { success: false, subjects: [] }; }),
        StudentAPI.getLibraryBooks().catch(err => { logger.warn("Failed to fetch books:", err); return { success: false, books: [] }; }),
      ]);
      setCourses(subjectsResponse.success && subjectsResponse.subjects ? subjectsResponse.subjects.map(mapSubjectToCourse) : []);
      setBooks(booksResponse.success && booksResponse.books ? booksResponse.books.map(mapApiBookToBook) : []);
    } catch (error) {
      logger.error("Error fetching home data:", error);
      setCourses([]);
      setBooks([]);
    } finally {
      setLoadingContent(false);
    }
  }, [isConnectedToKiosk, loadDownloadedContent]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useFocusEffect(
    useCallback(() => {
      if (!isConnectedToKiosk) {
        loadDownloadedContent();
      }
    }, [isConnectedToKiosk, loadDownloadedContent])
  );

  // Load book progress from storage
  useEffect(() => {
    const loadBookProgress = async () => {
      if (downloadedBooks.length === 0) return;
      const progressMap: Record<string, number> = {};
      for (const book of downloadedBooks) {
        const p = await progressStorage.getProgress(book.id);
        if (p && p.type === 'pdf' && p.position > 0) {
          // Calculate percentage: position = current page, duration = total pages
          const pct = p.duration && p.duration > 0
            ? Math.round((p.position / p.duration) * 100)
            : 0;
          progressMap[book.id] = Math.min(pct, 100);
        }
      }
      setBookProgressMap(progressMap);
    };
    loadBookProgress();
  }, [downloadedBooks]);

  // Create dynamic recent activities from downloaded content
  const recentActivities: RecentActivity[] = [
    // Add downloaded courses
    ...downloadedCourses.map(course => {
      const completedLessons = course.lessons.filter(l => l.isCompleted).length;
      const totalLessons = course.lessons.length;
      const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

      return {
        id: `course-${course.id}`,
        type: "course" as const,
        title: course.title,
        subtitle: `${completedLessons}/${totalLessons} leçons`,
        thumbnail: course.thumbnail,
        progress: Math.round(progress),
        lastAccessed: course.downloadedAt,
      };
    }),
    // Add downloaded books with progress if available
    ...downloadedBooks.map(book => ({
      id: `book-${book.id}`,
      type: "book" as const,
      title: book.title,
      subtitle: book.author,
      thumbnail: book.thumbnail,
      progress: bookProgressMap[book.id] !== undefined ? Math.min(bookProgressMap[book.id], 100) : undefined,
      lastAccessed: book.downloadedAt,
    })),
  ];

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

  // No client-side grade filter — the API already returns subjects for the logged-in student's class
  const filteredCourses = courses;

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
    // Validate activity data before navigation
    if (!activity || !activity.id || !activity.type) {
      logger.warn("Invalid activity data:", activity);
      return;
    }

    try {
      if (activity.type === "course") {
        // Navigate to Downloads screen with Cours tab
        router.push({
          pathname: "/(tabs)/downloads",
          params: {
            tab: "cours",
          },
        });
      } else if (activity.type === "book") {
        // Navigate to Downloads screen with Bibliothèque tab
        router.push({
          pathname: "/(tabs)/downloads",
          params: {
            tab: "bibliotheque",
          },
        });
      } else {
        logger.warn("Unknown activity type:", activity.type);
      }
    } catch (error) {
      logger.error("Error navigating to recent activity:", error);
    }
  };

  const renderCourseCard = (course: Course) => (
    <TouchableOpacity
      key={course.id}
      style={styles.courseCard}
      activeOpacity={0.8}
      onPress={() => handleCoursePress(course)}
    >
      <View style={styles.courseThumbnailContainer}>
        <AcademicBadge
          id={course.id}
          type="course"
          title={course.title}
          size={CARD_WIDTH * 0.9}
        />
      </View>
      <Text style={styles.courseTitle} numberOfLines={2}>
        {course.title}
      </Text>
    </TouchableOpacity>
  );

  const renderBookCard = (book: Book) => (
    <TouchableOpacity
      key={book.id}
      style={styles.bookCard}
      activeOpacity={0.8}
      onPress={() => handleBookPress(book)}
    >
      <View style={styles.bookCoverContainer}>
        <AcademicBadge
          id={book.id}
          type="book"
          author={book.author}
          size={CARD_WIDTH * 0.9}
        />
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
      <AcademicBadge
        id={activity.id}
        type={activity.type}
        title={activity.type === 'course' ? activity.title : undefined}
        author={activity.type === 'book' ? activity.subtitle : undefined}
        size={60}
      />
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

            <View style={styles.modalBookCoverContainer}>
              <AcademicBadge
                id={selectedBook.id}
                type="book"
                author={selectedBook.author}
                size={120}
              />
            </View>

            <Text style={styles.modalBookTitle}>{selectedBook.title}</Text>
            <Text style={styles.modalBookAuthor}>{selectedBook.author}</Text>
            <Text style={styles.modalBookDescription}>{selectedBook.description}</Text>

            <TouchableOpacity
              style={styles.modalDownloadButton}
              activeOpacity={0.8}
              onPress={() => {
                // Implement download logic
                logger.info("Download book:", selectedBook.title);
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

        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Continue Learning Section - Dynamic based on downloads */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continuer l&apos;apprentissage</Text>
            {recentActivities.length === 0 ? (
              <View style={styles.emptyRecentActivity}>
                <Ionicons name="book-outline" size={48} color="#A0A0A0" />
                <Text style={styles.emptyRecentText}>
                  Téléchargez des cours ou des livres pour continuer votre apprentissage
                </Text>
              </View>
            ) : (
              <View style={styles.recentActivityList}>
                {recentActivities.map(renderRecentActivityCard)}
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
                    onPress={() => router.push("/(tabs)/cours")}
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
                  {filteredCourses.slice(0, 5).map(renderCourseCard)}
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
                  {books.slice(0, 5).map(renderBookCard)}
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
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  courseThumbnailContainer: {
    width: "100%",
    aspectRatio: 0.9,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  courseTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 4,
    lineHeight: 18,
  },
  courseDescription: {
    fontSize: 12,
    color: "#5A5A5A",
    fontStyle: "italic",
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
    gap: 12,
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
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  bookCoverContainer: {
    width: "100%",
    aspectRatio: 0.7,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
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
  modalBookCoverContainer: {
    alignSelf: "center",
    marginBottom: 20,
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
