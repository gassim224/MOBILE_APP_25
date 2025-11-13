import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useConnectionSimulator } from "@/contexts/ConnectionSimulatorContext";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
}

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 64) / 2; // 2 columns with padding

// Mock data - complete course catalog
const ALL_COURSES: Course[] = [
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
  {
    id: "8",
    title: "Histoire",
    description: "Histoire du Monde",
    thumbnail: "📜",
  },
  {
    id: "9",
    title: "Géographie",
    description: "Géographie Mondiale",
    thumbnail: "🌍",
  },
  {
    id: "10",
    title: "Biologie",
    description: "Sciences de la Vie",
    thumbnail: "🧬",
  },
];

export default function Cours() {
  const router = useRouter();
  const { isConnectedToKiosk } = useConnectionSimulator();

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
        <Text style={styles.courseDescription} numberOfLines={2}>
          {course.description}
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
            <Text style={styles.headerTitle}>Tous les cours</Text>
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
        ) : (
          // Online state - show all courses in grid
          <FlatList
            data={ALL_COURSES}
            renderItem={renderCourseCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
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
    height: 120,
    backgroundColor: "#1E3A5F",
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailEmoji: {
    fontSize: 56,
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
});
