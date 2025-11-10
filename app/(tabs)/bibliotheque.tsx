import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import ConnectionStatus from "@/components/ConnectionStatus";

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  thumbnail: string;
  isDownloaded?: boolean;
}

const { width } = Dimensions.get("window");
const BOOK_WIDTH = (width - 72) / 3; // 3 columns with padding

// Mock books data
const MOCK_BOOKS: Book[] = [
  {
    id: "1",
    title: "Une si longue lettre",
    author: "Mariama Bâ",
    description: "Un chef-d'œuvre de la littérature africaine francophone.",
    thumbnail: "📕",
  },
  {
    id: "2",
    title: "L'Enfant noir",
    author: "Camara Laye",
    description: "Une autobiographie touchante sur l'enfance en Afrique.",
    thumbnail: "📗",
  },
  {
    id: "3",
    title: "L'alchimiste",
    author: "Paulo Coelho",
    description: "Une quête spirituelle et philosophique inoubliable.",
    thumbnail: "📘",
  },
  {
    id: "4",
    title: "Pensez et devenez riche",
    author: "Napoleon Hill",
    description: "Les clés du succès et de la réussite personnelle.",
    thumbnail: "📙",
  },
  {
    id: "5",
    title: "Le Petit Prince",
    author: "Antoine de Saint-Exupéry",
    description: "Un conte poétique sur l'amitié et l'amour.",
    thumbnail: "📔",
  },
  {
    id: "6",
    title: "Choses dont je suis sûr",
    author: "Aminata Sow Fall",
    description: "Réflexions sur la vie et la société.",
    thumbnail: "📓",
  },
  {
    id: "7",
    title: "Les Misérables",
    author: "Victor Hugo",
    description: "Une épopée sur la justice et la rédemption.",
    thumbnail: "📕",
  },
  {
    id: "8",
    title: "Madame Bovary",
    author: "Gustave Flaubert",
    description: "Un classique sur les illusions romantiques.",
    thumbnail: "📗",
  },
  {
    id: "9",
    title: "Le Ventre de l'Atlantique",
    author: "Fatou Diome",
    description: "Entre l'Afrique et l'Europe, une histoire d'émigration.",
    thumbnail: "📘",
  },
];

export default function Bibliotheque() {
  const router = useRouter();
  const [isConnectedToKiosk, setIsConnectedToKiosk] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [downloadingBookId, setDownloadingBookId] = useState<string | null>(null);
  const [downloadedBooks, setDownloadedBooks] = useState<Set<string>>(new Set());

  const checkKioskConnection = useCallback(async () => {
    try {
      const netInfo = await NetInfo.fetch();

      if (netInfo.type === "wifi" && netInfo.isConnected) {
        const ssid = netInfo.details && 'ssid' in netInfo.details ? netInfo.details.ssid : null;

        const isKiosk = ssid ?
          (ssid.toLowerCase().includes("ecole") ||
           ssid.toLowerCase().includes("school") ||
           ssid.toLowerCase().includes("kiosk")) :
          false;

        setIsConnectedToKiosk(isKiosk);
      } else {
        setIsConnectedToKiosk(false);
      }
    } catch (error) {
      console.error("Error checking kiosk connection:", error);
      setIsConnectedToKiosk(false);
    }
  }, []);

  useEffect(() => {
    checkKioskConnection();

    const unsubscribe = NetInfo.addEventListener(() => {
      checkKioskConnection();
    });

    return () => {
      unsubscribe();
    };
  }, [checkKioskConnection]);

  const filteredBooks = MOCK_BOOKS.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBookPress = (book: Book) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  const handleDownload = (bookId: string) => {
    setDownloadingBookId(bookId);

    // Simulate download
    setTimeout(() => {
      setDownloadedBooks((prev) => new Set([...prev, bookId]));
      setDownloadingBookId(null);
      setModalVisible(false);
    }, 2000);
  };

  const isBookDownloaded = (bookId: string) => downloadedBooks.has(bookId);

  const renderBookCard = ({ item: book }: { item: Book }) => {
    const downloaded = isBookDownloaded(book.id);
    const isGrayedOut = !isConnectedToKiosk && !downloaded;

    return (
      <TouchableOpacity
        style={[styles.bookCard, isGrayedOut && styles.bookCardGrayed]}
        activeOpacity={0.8}
        onPress={() => handleBookPress(book)}
      >
        <View style={[styles.bookCover, isGrayedOut && styles.bookCoverGrayed]}>
          <Text style={styles.bookCoverEmoji}>{book.thumbnail}</Text>
        </View>
        <Text style={[styles.bookTitle, isGrayedOut && styles.textGrayed]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[styles.bookAuthor, isGrayedOut && styles.textGrayed]} numberOfLines={1}>
          {book.author}
        </Text>
        {downloaded && (
          <View style={styles.downloadedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderModal = () => {
    if (!selectedBook) return null;

    const downloaded = isBookDownloaded(selectedBook.id);
    const canDownload = isConnectedToKiosk && !downloaded;
    const cannotDownloadOffline = !isConnectedToKiosk && !downloaded;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
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

            {canDownload && (
              <TouchableOpacity
                style={styles.modalDownloadButton}
                onPress={() => handleDownload(selectedBook.id)}
                disabled={downloadingBookId === selectedBook.id}
                activeOpacity={0.8}
              >
                {downloadingBookId === selectedBook.id ? (
                  <>
                    <Text style={styles.modalDownloadButtonText}>Téléchargement...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="download" size={20} color="#1E3A5F" />
                    <Text style={styles.modalDownloadButtonText}>Télécharger</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {downloaded && (
              <View style={styles.modalDownloadedBadge}>
                <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
                <Text style={styles.modalDownloadedText}>Livre téléchargé</Text>
              </View>
            )}

            {cannotDownloadOffline && (
              <View style={styles.modalOfflineContainer}>
                <Text style={styles.modalOfflineTitle}>Ce livre n&apos;est pas encore téléchargé.</Text>
                <TouchableOpacity
                  style={styles.modalGoToDownloadsButton}
                  onPress={() => {
                    setModalVisible(false);
                    router.push("/(tabs)/downloads");
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="download" size={20} color="#1E3A5F" />
                  <Text style={styles.modalGoToDownloadsButtonText}>
                    Voir mes livres téléchargés
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bibliothèque</Text>
          <ConnectionStatus isConnected={isConnectedToKiosk} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#5A5A5A" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un livre ou un auteur…"
            placeholderTextColor="#A0A0A0"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={20} color="#A0A0A0" />
            </TouchableOpacity>
          )}
        </View>

        {/* Books Grid */}
        <FlatList
          data={filteredBooks}
          renderItem={renderBookCard}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.booksGrid}
          showsVerticalScrollIndicator={false}
          columnWrapperStyle={styles.bookRow}
        />

        {/* Modal */}
        {renderModal()}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 24,
    marginVertical: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#2C2C2C",
  },
  booksGrid: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  bookRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  bookCard: {
    width: BOOK_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  bookCardGrayed: {
    opacity: 0.5,
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
  bookCoverGrayed: {
    backgroundColor: "#A0A0A0",
  },
  bookCoverEmoji: {
    fontSize: 40,
  },
  bookTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 4,
    lineHeight: 16,
  },
  bookAuthor: {
    fontSize: 11,
    color: "#5A5A5A",
    fontStyle: "italic",
  },
  textGrayed: {
    color: "#A0A0A0",
  },
  downloadedBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
  },

  // Modal Styles
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
  modalDownloadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    gap: 8,
  },
  modalDownloadedText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4CAF50",
  },
  modalOfflineContainer: {
    alignItems: "center",
  },
  modalOfflineTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#DC3545",
    textAlign: "center",
    marginBottom: 16,
  },
  modalGoToDownloadsButton: {
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
  modalGoToDownloadsButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E3A5F",
  },
});
