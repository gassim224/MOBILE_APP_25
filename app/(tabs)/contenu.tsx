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
  thumbnail: string;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7;

// Mock data
const MOCK_COURSES: Course[] = [
  {
    id: "1",
    title: "Mathématiques Avancées",
    description: "Algèbre et Géométrie",
    thumbnail: "📐",
  },
  {
    id: "2",
    title: "Physique Moderne",
    description: "Mécanique et Électricité",
    thumbnail: "⚛️",
  },
  {
    id: "3",
    title: "Histoire Africaine",
    description: "Civilisations et Empires",
    thumbnail: "🌍",
  },
  {
    id: "4",
    title: "Littérature Française",
    description: "Romans et Poésie",
    thumbnail: "📖",
  },
];

const MOCK_BOOKS: Book[] = [
  {
    id: "1",
    title: "Une si longue lettre",
    author: "Mariama Bâ",
    thumbnail: "📕",
  },
  {
    id: "2",
    title: "L'Enfant noir",
    author: "Camara Laye",
    thumbnail: "📗",
  },
  {
    id: "3",
    title: "Le Ventre de l'Atlantique",
    author: "Fatou Diome",
    thumbnail: "📘",
  },
  {
    id: "4",
    title: "Les Soleils des Indépendances",
    author: "Ahmadou Kourouma",
    thumbnail: "📙",
  },
];

export default function Contenu() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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

  const renderCourseCard = (course: Course) => (
    <TouchableOpacity
      key={course.id}
      style={styles.courseCard}
      activeOpacity={0.8}
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
    <TouchableOpacity key={book.id} style={styles.bookCard} activeOpacity={0.8}>
      <View style={styles.bookThumbnail}>
        <Text style={styles.bookThumbnailEmoji}>{book.thumbnail}</Text>
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {book.author}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header with Welcome Message */}
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
          {/* My Courses Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Mes Cours</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.seeAllText}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {MOCK_COURSES.map(renderCourseCard)}
            </ScrollView>
          </View>

          {/* Library Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bibliothèque</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.seeAllText}>Voir tout</Text>
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
              <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
                <Ionicons name="calendar" size={32} color="#17A2B8" />
                <Text style={styles.quickActionText}>Calendrier</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    marginBottom: 0,
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
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#17A2B8",
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
  bookCard: {
    width: CARD_WIDTH * 0.65,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  bookThumbnail: {
    width: "100%",
    height: 180,
    backgroundColor: "#17A2B8",
    justifyContent: "center",
    alignItems: "center",
  },
  bookThumbnailEmoji: {
    fontSize: 72,
  },
  bookInfo: {
    padding: 14,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 6,
    lineHeight: 20,
  },
  bookAuthor: {
    fontSize: 13,
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
});
