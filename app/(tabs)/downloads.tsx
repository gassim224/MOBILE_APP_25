import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { SAMPLE_PDF_URL } from "@/constants/SampleData";

type FilterTab = "cours" | "bibliotheque";

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
  type: 'video' | 'audio' | 'pdf';
  mediaUrl?: string;
}

interface DownloadedBook {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  downloadedAt: string;
  pdfUrl?: string;
}

// Mock data - populate to test different states
const MOCK_DOWNLOADED_COURSES: DownloadedCourse[] = [
  {
    id: "1",
    title: "Mathématiques Avancées",
    thumbnail: "📐",
    downloadedAt: "Il y a 2 jours",
    lessons: [
      {
        id: "1-1",
        title: "Introduction à l'algèbre",
        duration: "15 min",
        isCompleted: true,
        type: 'video',
        mediaUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      },
      {
        id: "1-2",
        title: "Équations linéaires",
        duration: "20 min",
        isCompleted: true,
        type: 'video',
        mediaUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      },
      {
        id: "1-3",
        title: "Systèmes d'équations",
        duration: "25 min",
        isCompleted: false,
        type: 'audio',
        mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      {
        id: "1-4",
        title: "Fonctions quadratiques - Guide PDF",
        duration: "30 min",
        isCompleted: false,
        type: 'pdf',
        mediaUrl: SAMPLE_PDF_URL,
      },
    ],
  },
  {
    id: "2",
    title: "Histoire Africaine",
    thumbnail: "🌍",
    downloadedAt: "Il y a 1 semaine",
    lessons: [
      {
        id: "2-1",
        title: "L'empire du Mali",
        duration: "18 min",
        isCompleted: true,
        type: 'video',
        mediaUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
      {
        id: "2-2",
        title: "Le royaume de Songhaï",
        duration: "22 min",
        isCompleted: false,
        type: 'audio',
        mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
      {
        id: "2-3",
        title: "Les royaumes côtiers - Documentation",
        duration: "20 min",
        isCompleted: false,
        type: 'pdf',
        mediaUrl: SAMPLE_PDF_URL,
      },
    ],
  },
];

const MOCK_DOWNLOADED_BOOKS: DownloadedBook[] = [
  {
    id: "1",
    title: "Une si longue lettre",
    author: "Mariama Bâ",
    thumbnail: "📕",
    downloadedAt: "Il y a 3 jours",
    pdfUrl: SAMPLE_PDF_URL,
  },
  {
    id: "2",
    title: "L'Enfant noir",
    author: "Camara Laye",
    thumbnail: "📗",
    downloadedAt: "Il y a 1 semaine",
    pdfUrl: SAMPLE_PDF_URL,
  },
  {
    id: "3",
    title: "L'alchimiste",
    author: "Paulo Coelho",
    thumbnail: "📘",
    downloadedAt: "Il y a 2 semaines",
    pdfUrl: SAMPLE_PDF_URL,
  },
];

export default function Downloads() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>("cours");
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [downloadedCourses, setDownloadedCourses] = useState<DownloadedCourse[]>(MOCK_DOWNLOADED_COURSES);
  const [downloadedBooks, setDownloadedBooks] = useState<DownloadedBook[]>(MOCK_DOWNLOADED_BOOKS);

  const totalDownloads = downloadedCourses.length + downloadedBooks.length;

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  const handleDeleteCourse = (courseId: string, courseTitle: string) => {
    Alert.alert(
      "Supprimer le cours",
      "Voulez-vous vraiment supprimer ce cours ? Tous les fichiers associés seront effacés de votre appareil.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            // Remove course from state
            setDownloadedCourses((prevCourses) =>
              prevCourses.filter((course) => course.id !== courseId)
            );
            // Remove from expanded set if it was expanded
            setExpandedCourses((prev) => {
              const newSet = new Set(prev);
              newSet.delete(courseId);
              return newSet;
            });
          },
        },
      ]
    );
  };

  const handleDeleteBook = (bookId: string, bookTitle: string) => {
    Alert.alert(
      "Supprimer le livre",
      "Voulez-vous vraiment supprimer ce livre ? Il sera effacé de votre appareil.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            // Remove book from state
            setDownloadedBooks((prevBooks) =>
              prevBooks.filter((book) => book.id !== bookId)
            );
          },
        },
      ]
    );
  };

  const renderEmptyStateCours = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIllustration}>
        <View style={styles.illustrationCircle}>
          <Text style={styles.illustrationEmoji}>📚</Text>
        </View>
      </View>

      <Text style={styles.emptyTitle}>Aucun cours téléchargé</Text>
      <Text style={styles.emptyMessage}>
        Vous n&apos;avez aucun cours téléchargé pour le moment.
      </Text>
      <Text style={styles.emptySubMessage}>
        Découvrez et téléchargez des cours pour y accéder hors ligne.
      </Text>

      <TouchableOpacity
        style={styles.browseButton}
        activeOpacity={0.8}
        onPress={() => router.push("/(tabs)")}
      >
        <Ionicons name="home" size={20} color="#1E3A5F" />
        <Text style={styles.browseButtonText}>Découvrir les cours</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyStateBibliotheque = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyIllustration}>
        <View style={styles.illustrationCircle}>
          <Text style={styles.illustrationEmoji}>📖</Text>
        </View>
      </View>

      <Text style={styles.emptyTitle}>Aucun livre téléchargé</Text>
      <Text style={styles.emptyMessage}>
        Vous n&apos;avez aucun livre téléchargé pour le moment.
      </Text>
      <Text style={styles.emptySubMessage}>
        Explorez notre bibliothèque et téléchargez vos livres préférés.
      </Text>

      <TouchableOpacity
        style={styles.browseButton}
        activeOpacity={0.8}
        onPress={() => router.push("/(tabs)/bibliotheque")}
      >
        <Ionicons name="library" size={20} color="#1E3A5F" />
        <Text style={styles.browseButtonText}>Explorer la bibliothèque</Text>
      </TouchableOpacity>
    </View>
  );

  const handleLessonPress = (lesson: Lesson) => {
    if (lesson.type === 'video') {
      router.push({
        pathname: '/(modals)/video-player',
        params: {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          videoUrl: lesson.mediaUrl || '',
        },
      });
    } else if (lesson.type === 'audio') {
      router.push({
        pathname: '/(modals)/audio-player',
        params: {
          lessonId: lesson.id,
          lessonTitle: lesson.title,
          audioUrl: lesson.mediaUrl || '',
        },
      });
    } else if (lesson.type === 'pdf') {
      router.push({
        pathname: '/(modals)/pdf-reader',
        params: {
          itemId: lesson.id,
          itemTitle: lesson.title,
          pdfUrl: lesson.mediaUrl || '',
          itemType: 'lesson',
        },
      });
    }
  };

  const getMediaIcon = (type: 'video' | 'audio' | 'pdf') => {
    switch (type) {
      case 'video':
        return 'play-circle';
      case 'audio':
        return 'musical-notes';
      case 'pdf':
        return 'document-text';
      default:
        return 'play-circle-outline';
    }
  };

  const renderLesson = (lesson: Lesson) => (
    <TouchableOpacity
      key={lesson.id}
      style={styles.lessonItem}
      activeOpacity={0.7}
      onPress={() => handleLessonPress(lesson)}
    >
      <View style={styles.lessonIcon}>
        <Ionicons
          name={lesson.isCompleted ? "checkmark-circle" : getMediaIcon(lesson.type)}
          size={24}
          color={lesson.isCompleted ? "#17A2B8" : "#FFD700"}
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
        <View style={styles.lessonMeta}>
          <Text style={styles.lessonDuration}>{lesson.duration}</Text>
          <View style={styles.lessonTypeBadge}>
            <Text style={styles.lessonTypeText}>
              {lesson.type === 'video' ? '🎥 Vidéo' : lesson.type === 'audio' ? '🎵 Audio' : '📄 PDF'}
            </Text>
          </View>
        </View>
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
        <View style={styles.courseHeaderWrapper}>
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

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.courseDeleteButton}
            onPress={() => handleDeleteCourse(course.id, course.title)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={20} color="#DC3545" />
            <Text style={styles.courseDeleteText}>Supprimer</Text>
          </TouchableOpacity>
        </View>

        {/* Expanded Lessons */}
        {isExpanded && (
          <View style={styles.lessonsContainer}>
            {course.lessons.map(renderLesson)}
          </View>
        )}
      </View>
    );
  };

  const handleBookRead = (book: DownloadedBook) => {
    router.push({
      pathname: '/(modals)/pdf-reader',
      params: {
        itemId: book.id,
        itemTitle: book.title,
        pdfUrl: book.pdfUrl || '',
        itemType: 'book',
      },
    });
  };

  const renderBook = (book: DownloadedBook) => (
    <View key={book.id} style={styles.bookContainer}>
      <View style={styles.bookCover}>
        <Text style={styles.bookCoverEmoji}>{book.thumbnail}</Text>
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle}>{book.title}</Text>
        <Text style={styles.bookAuthor}>{book.author}</Text>
        <Text style={styles.bookDownloadedDate}>{book.downloadedAt}</Text>
      </View>
      <View style={styles.bookActions}>
        <TouchableOpacity
          style={styles.bookActionButton}
          activeOpacity={0.7}
          onPress={() => handleBookRead(book)}
        >
          <Ionicons name="book-outline" size={20} color="#1E3A5F" />
          <Text style={styles.bookActionText}>Lire</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bookActionButton, styles.deleteButton]}
          onPress={() => handleDeleteBook(book.id, book.title)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color="#DC3545" />
          <Text style={[styles.bookActionText, styles.deleteText]}>Supprimer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header with Image Background */}
        <ImageBackground
          source={require("@/assets/images/login-header.png")}
          style={styles.headerBackground}
          imageStyle={styles.headerBackgroundImage}
        >
          <View style={styles.headerOverlay}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Mes Téléchargements</Text>
              {totalDownloads > 0 && (
                <Text style={styles.headerSubtitle}>
                  {totalDownloads} élément{totalDownloads > 1 ? "s" : ""} téléchargé{totalDownloads > 1 ? "s" : ""}
                </Text>
              )}
            </View>
          </View>
        </ImageBackground>

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "cours" && styles.tabActive]}
            onPress={() => setActiveTab("cours")}
            activeOpacity={0.7}
          >
            <Text style={styles.tabEmoji}>🧩</Text>
            <Text style={[styles.tabText, activeTab === "cours" && styles.tabTextActive]}>
              Cours
            </Text>
            {downloadedCourses.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{downloadedCourses.length}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === "bibliotheque" && styles.tabActive]}
            onPress={() => setActiveTab("bibliotheque")}
            activeOpacity={0.7}
          >
            <Text style={styles.tabEmoji}>📚</Text>
            <Text
              style={[styles.tabText, activeTab === "bibliotheque" && styles.tabTextActive]}
            >
              Bibliothèque
            </Text>
            {downloadedBooks.length > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{downloadedBooks.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        {activeTab === "cours" ? (
          downloadedCourses.length === 0 ? (
            renderEmptyStateCours()
          ) : (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {downloadedCourses.map(renderCourse)}
            </ScrollView>
          )
        ) : downloadedBooks.length === 0 ? (
          renderEmptyStateBibliotheque()
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {downloadedBooks.map(renderBook)}
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
  headerBackground: {
    width: "100%",
  },
  headerBackgroundImage: {
    resizeMode: "cover",
  },
  headerOverlay: {
    backgroundColor: "rgba(30, 58, 95, 0.75)", // Academic Blue with 75% opacity
    width: "100%",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.95,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E0E0E0",
    gap: 6,
  },
  tabActive: {
    borderColor: "#1E3A5F",
    backgroundColor: "#EBF0F5",
  },
  tabEmoji: {
    fontSize: 18,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#5A5A5A",
  },
  tabTextActive: {
    color: "#1E3A5F",
  },
  tabBadge: {
    backgroundColor: "#17A2B8",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIllustration: {
    marginBottom: 32,
    width: 140,
    height: 140,
    justifyContent: "center",
    alignItems: "center",
  },
  illustrationCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#1E3A5F",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  illustrationEmoji: {
    fontSize: 64,
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

  // Content (Courses)
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
  courseHeaderWrapper: {
    flexDirection: "column",
  },
  courseHeader: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: 12,
    alignItems: "center",
  },
  courseDeleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    gap: 6,
  },
  courseDeleteText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#DC3545",
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
    marginBottom: 4,
  },
  lessonTitleCompleted: {
    color: "#5A5A5A",
  },
  lessonMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lessonDuration: {
    fontSize: 12,
    color: "#A0A0A0",
  },
  lessonTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#EBF0F5",
    borderRadius: 4,
  },
  lessonTypeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E3A5F",
  },

  // Books
  bookContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bookCover: {
    width: 60,
    height: 80,
    backgroundColor: "#17A2B8",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  bookCoverEmoji: {
    fontSize: 32,
  },
  bookInfo: {
    flex: 1,
    justifyContent: "center",
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: "#5A5A5A",
    fontStyle: "italic",
    marginBottom: 4,
  },
  bookDownloadedDate: {
    fontSize: 12,
    color: "#A0A0A0",
  },
  bookActions: {
    justifyContent: "center",
    gap: 8,
  },
  bookActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#EBF0F5",
    borderRadius: 8,
    gap: 6,
  },
  bookActionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E3A5F",
  },
  deleteButton: {
    backgroundColor: "#FFEBEE",
  },
  deleteText: {
    color: "#DC3545",
  },
});
