import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  useWindowDimensions,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import ConnectionStatus from "@/components/ConnectionStatus";
import { useConnectionSimulator } from "@/contexts/ConnectionSimulatorContext";
import { useDownloads } from "@/contexts/DownloadsContext";
import { downloadFile, generateFileName } from "@/utils/fileDownloader";
import { StudentAPI, DownloadAPI, ApiBook } from "@/services/api";
import logger from "@/utils/Logger";
import { AcademicBadge } from "@/components/AcademicBadge";

interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  thumbnail: string;
  filename: string;
  isDownloaded?: boolean;
}

const mapApiBookToBook = (book: ApiBook): Book => ({
  id: book.id,
  title: book.title,
  author: book.author,
  description: "",
  thumbnail: "📚",
  filename: book.filename,
});

export default function Bibliotheque() {
  const router = useRouter();
  const { isConnectedToKiosk } = useConnectionSimulator();
  const { downloadedBooks, addDownloadedBook } = useDownloads();
  const { width } = useWindowDimensions();
  const numColumns = width >= 768 ? 4 : 3;
  const bookWidth = (width - 72) / numColumns;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [downloadingBookId, setDownloadingBookId] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search query — wait 500ms after user stops typing
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  const fetchBooks = useCallback(async (page: number = 1) => {
    if (!isConnectedToKiosk) return;

    if (page === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await StudentAPI.getLibraryBooks(debouncedSearch || undefined, page);
      if (response.success && response.books) {
        const newBooks = response.books.map(mapApiBookToBook);
        setBooks(prev => page === 1 ? newBooks : [...prev, ...newBooks]);
        setTotalPages(response.totalPages || 1);
        setCurrentPage(page);
      } else if (page === 1) {
        setBooks([]);
      }
    } catch (err) {
      logger.error("Failed to fetch library books:", err);
      if (page === 1) setBooks([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [isConnectedToKiosk, debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
    setTotalPages(1);
    fetchBooks(1);
  }, [fetchBooks]);

  useFocusEffect(
    useCallback(() => {
      if (isConnectedToKiosk) {
        setCurrentPage(1);
        setTotalPages(1);
        fetchBooks(1);
      }
    }, [isConnectedToKiosk, fetchBooks])
  );

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && currentPage < totalPages) {
      fetchBooks(currentPage + 1);
    }
  }, [loadingMore, currentPage, totalPages, fetchBooks]);

  const filteredBooks = books;

  const handleBookPress = (book: Book) => {
    setSelectedBook(book);
    setModalVisible(true);
  };

  const handleDownload = async (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    setDownloadingBookId(bookId);

    try {
      logger.info(`Starting book download: ${book.title}`);

      // Generate filename for the PDF
      const fileName = generateFileName(bookId, book.title, 'pdf');

      // Get remote URL from API
      const remoteUrl = DownloadAPI.getBookUrl(book.filename);

      // Actually download the PDF file to local storage
      const localUri = await downloadFile(remoteUrl, fileName, (progress) => {
        logger.info(`Download progress: ${progress.progress.toFixed(2)}%`);
      });

      logger.info(`Book downloaded to: ${localUri}`);

      // Add to downloads context with LOCAL file path
      await addDownloadedBook({
        id: book.id,
        title: book.title,
        author: book.author,
        thumbnail: book.thumbnail,
        downloadedAt: new Date().toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        pdfUrl: localUri, // Store LOCAL path
      });

      setDownloadingBookId(null);
      setModalVisible(false);
    } catch (error) {
      logger.error("Book download error:", error);
      setDownloadingBookId(null);
      Alert.alert(
        "Erreur de téléchargement",
        "Impossible de télécharger le livre. Vérifiez votre connexion.",
        [{ text: "OK" }]
      );
    }
  };

  const isBookDownloaded = (bookId: string) => downloadedBooks.some(b => b.id === bookId);

  const renderBookCard = ({ item: book }: { item: Book }) => {
    const downloaded = isBookDownloaded(book.id);
    const isGrayedOut = !isConnectedToKiosk && !downloaded;

    return (
      <TouchableOpacity
        style={[styles.bookCard, { width: bookWidth }, isGrayedOut && styles.bookCardGrayed]}
        activeOpacity={0.8}
        onPress={() => handleBookPress(book)}
      >
        <View style={styles.bookCoverContainer}>
          <AcademicBadge
            id={book.id}
            type="book"
            author={book.author}
            size={bookWidth * 0.85}
            style={isGrayedOut ? { opacity: 0.4 } : undefined}
          />
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
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1E3A5F" />
            <Text style={styles.loadingText}>Chargement des livres...</Text>
          </View>
        ) : !isConnectedToKiosk && downloadedBooks.length === 0 ? (
          <View style={styles.offlineContainer}>
            <Ionicons name="cloud-offline-outline" size={80} color="#1E3A5F" />
            <Text style={styles.offlineTitle}>Hors ligne</Text>
            <Text style={styles.offlineMessage}>
              Connectez-vous au Wi-Fi de l&apos;école pour accéder à la bibliothèque.
            </Text>
          </View>
        ) : (
          <FlatList
            key={numColumns}
            data={filteredBooks}
            renderItem={renderBookCard}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            contentContainerStyle={styles.booksGrid}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.bookRow}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#1E3A5F" />
                </View>
              ) : null
            }
          />
        )}

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
  offlineContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  offlineTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A5F",
    marginTop: 16,
    marginBottom: 8,
  },
  offlineMessage: {
    fontSize: 16,
    color: "#5A5A5A",
    textAlign: "center",
    lineHeight: 24,
  },
  booksGrid: {
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  bookRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  bookCard: {
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
  bookCoverContainer: {
    width: "100%",
    aspectRatio: 0.7,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
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
