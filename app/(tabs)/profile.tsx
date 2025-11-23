import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  testInactivityNotification,
  testCourseCompletionNotification,
  testLessonContinuationNotification,
  testNewContentNotification,
  testNextSessionNotification,
  testLowStorageNotification,
} from "@/utils/notificationService";
import { useConnectionSimulator } from "@/contexts/ConnectionSimulatorContext";
import logger from "@/utils/Logger";

interface UserProfile {
  studentName: string;
  schoolName: string;
  grade: string;
  studentId: string;
}

export default function Profile() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { isConnectedToKiosk } = useConnectionSimulator();
  const [isSyncing, setIsSyncing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const previousConnectionState = useRef(isConnectedToKiosk);

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

  // Handle sync animation when connection changes from offline to online
  useEffect(() => {
    if (previousConnectionState.current === false && isConnectedToKiosk === true) {
      // Connection just came online - show syncing animation
      setIsSyncing(true);

      // Pulse animation
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Show "Synchronisation en cours..." for 2 seconds
      setTimeout(() => {
        setIsSyncing(false);
      }, 2000);
    }

    previousConnectionState.current = isConnectedToKiosk;
  }, [isConnectedToKiosk, fadeAnim]);

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Êtes-vous sûr de vouloir vous déconnecter?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("sessionToken");
              await AsyncStorage.removeItem("userProfile");
              router.replace("/login");
            } catch (error) {
              logger.error("Logout error:", error);
            }
          },
        },
      ]
    );
  };

  // Developer Tools: Test notification functions
  const handleTestInactivity = async () => {
    try {
      await testInactivityNotification();
      Alert.alert(
        "Notification programmée ✅",
        "La notification d'inactivité apparaîtra dans 5 secondes. Mettez l'app en arrière-plan pour la voir.",
        [{ text: "OK" }]
      );
    } catch {
      Alert.alert("Erreur", "Impossible de programmer la notification");
    }
  };

  const handleTestCourseCompletion = async () => {
    try {
      await testCourseCompletionNotification();
      Alert.alert(
        "Notification programmée ✅",
        "La notification de fin de cours apparaîtra dans 5 secondes. Mettez l'app en arrière-plan pour la voir.",
        [{ text: "OK" }]
      );
    } catch {
      Alert.alert("Erreur", "Impossible de programmer la notification");
    }
  };

  const handleTestLessonContinuation = async () => {
    try {
      await testLessonContinuationNotification();
      Alert.alert(
        "Notification programmée ✅",
        "La notification de continuation apparaîtra dans 5 secondes. Mettez l'app en arrière-plan pour la voir.",
        [{ text: "OK" }]
      );
    } catch {
      Alert.alert("Erreur", "Impossible de programmer la notification");
    }
  };

  const handleTestNewContent = async () => {
    try {
      await testNewContentNotification();
      Alert.alert(
        "Notification programmée ✅",
        "La notification de nouveau contenu apparaîtra dans 5 secondes. Mettez l'app en arrière-plan pour la voir.",
        [{ text: "OK" }]
      );
    } catch {
      Alert.alert("Erreur", "Impossible de programmer la notification");
    }
  };

  const handleTestNextSession = async () => {
    try {
      await testNextSessionNotification();
      Alert.alert(
        "Notification programmée ✅",
        "La notification de prochaine séance apparaîtra dans 5 secondes. Mettez l'app en arrière-plan pour la voir.",
        [{ text: "OK" }]
      );
    } catch {
      Alert.alert("Erreur", "Impossible de programmer la notification");
    }
  };

  const handleTestLowStorage = async () => {
    try {
      await testLowStorageNotification();
      Alert.alert(
        "Notification programmée ✅",
        "La notification d'espace faible apparaîtra dans 5 secondes. Mettez l'app en arrière-plan pour la voir.",
        [{ text: "OK" }]
      );
    } catch {
      Alert.alert("Erreur", "Impossible de programmer la notification");
    }
  };

  if (!userProfile) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={styles.container}>
        {/* Header with Avatar */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {userProfile.studentName.charAt(0)}
            </Text>
          </View>
          <Text style={styles.userName}>{userProfile.studentName}</Text>
          <Text style={styles.userSchool}>{userProfile.schoolName}</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations du profil</Text>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="person" size={20} color="#1E3A5F" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Nom de l&apos;élève</Text>
                  <Text style={styles.infoValue}>{userProfile.studentName}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="school" size={20} color="#17A2B8" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>École</Text>
                  <Text style={styles.infoValue}>{userProfile.schoolName}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="ribbon" size={20} color="#FFD700" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Niveau</Text>
                  <Text style={styles.infoValue}>Classe {userProfile.grade}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="card" size={20} color="#5A5A5A" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>ID Élève</Text>
                  <Text style={styles.infoValue}>{userProfile.studentId}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sync Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statut de Synchronisation</Text>
            <Animated.View
              style={[
                styles.syncCard,
                isConnectedToKiosk ? styles.syncCardOnline : styles.syncCardOffline,
                { opacity: fadeAnim },
              ]}
            >
              <View style={styles.syncIconContainer}>
                {isSyncing ? (
                  <Ionicons name="sync" size={32} color="#FFD700" />
                ) : isConnectedToKiosk ? (
                  <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                ) : (
                  <Ionicons name="time-outline" size={32} color="#FF9800" />
                )}
              </View>
              <View style={styles.syncTextContainer}>
                <Text style={styles.syncTitle}>
                  {isSyncing
                    ? "Synchronisation en cours..."
                    : isConnectedToKiosk
                    ? "Synchronisé"
                    : "Données en attente"}
                </Text>
                <Text style={styles.syncDescription}>
                  {isSyncing
                    ? "Mise à jour de vos données..."
                    : isConnectedToKiosk
                    ? "Toutes vos données sont à jour"
                    : "Connectez-vous pour synchroniser"}
                </Text>
              </View>
              <View
                style={[
                  styles.syncStatusBadge,
                  isConnectedToKiosk
                    ? styles.syncStatusOnline
                    : styles.syncStatusOffline,
                ]}
              >
                <Text style={styles.syncStatusText}>
                  {isConnectedToKiosk ? "🟢 En Ligne" : "🔴 Hors Ligne"}
                </Text>
              </View>
            </Animated.View>
          </View>

          {/* Statistics */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistiques</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="book" size={28} color="#1E3A5F" />
                </View>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Cours suivis</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-circle" size={28} color="#17A2B8" />
                </View>
                <Text style={styles.statValue}>45</Text>
                <Text style={styles.statLabel}>Leçons complétées</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="time" size={28} color="#FFD700" />
                </View>
                <Text style={styles.statValue}>28h</Text>
                <Text style={styles.statLabel}>Temps d&apos;étude</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="book-outline" size={28} color="#28A745" />
                </View>
                <Text style={styles.statValue}>4</Text>
                <Text style={styles.statLabel}>Livres lus</Text>
              </View>
            </View>
          </View>

          {/* Developer Tools Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Outils de développement</Text>
            <Text style={styles.devToolsDescription}>
              Testez les notifications en direct (délai de 5 secondes)
            </Text>

            <View style={styles.devToolsContainer}>
              {/* Test Inactivity Notification */}
              <TouchableOpacity
                style={styles.devToolButton}
                onPress={handleTestInactivity}
                activeOpacity={0.8}
              >
                <View style={styles.devToolIconContainer}>
                  <Ionicons name="time-outline" size={24} color="#1E3A5F" />
                </View>
                <View style={styles.devToolTextContainer}>
                  <Text style={styles.devToolTitle}>Tester la notification d&apos;inactivité</Text>
                  <Text style={styles.devToolSubtitle}>
                    &ldquo;On dirait que vous nous avez manqué !&rdquo;
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
              </TouchableOpacity>

              {/* Test Course Completion Notification */}
              <TouchableOpacity
                style={styles.devToolButton}
                onPress={handleTestCourseCompletion}
                activeOpacity={0.8}
              >
                <View style={[styles.devToolIconContainer, styles.devToolIconSuccess]}>
                  <Ionicons name="trophy-outline" size={24} color="#28A745" />
                </View>
                <View style={styles.devToolTextContainer}>
                  <Text style={styles.devToolTitle}>Tester la notification de fin de cours</Text>
                  <Text style={styles.devToolSubtitle}>
                    &ldquo;Félicitations ! Vous avez terminé...&rdquo;
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
              </TouchableOpacity>

              {/* Test Lesson Continuation Notification */}
              <TouchableOpacity
                style={styles.devToolButton}
                onPress={handleTestLessonContinuation}
                activeOpacity={0.8}
              >
                <View style={[styles.devToolIconContainer, styles.devToolIconWarning]}>
                  <Ionicons name="book-outline" size={24} color="#FF9800" />
                </View>
                <View style={styles.devToolTextContainer}>
                  <Text style={styles.devToolTitle}>Tester la notification de continuation</Text>
                  <Text style={styles.devToolSubtitle}>
                    &ldquo;N&apos;oubliez pas de finir votre leçon...&rdquo;
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
              </TouchableOpacity>

              {/* Test New Content Notification */}
              <TouchableOpacity
                style={styles.devToolButton}
                onPress={handleTestNewContent}
                activeOpacity={0.8}
              >
                <View style={[styles.devToolIconContainer, styles.devToolIconInfo]}>
                  <Ionicons name="download-outline" size={24} color="#17A2B8" />
                </View>
                <View style={styles.devToolTextContainer}>
                  <Text style={styles.devToolTitle}>Tester notif. nouveau contenu</Text>
                  <Text style={styles.devToolSubtitle}>
                    &ldquo;De nouvelles leçons et livres sont disponibles...&rdquo;
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
              </TouchableOpacity>

              {/* Test Next Session Notification */}
              <TouchableOpacity
                style={styles.devToolButton}
                onPress={handleTestNextSession}
                activeOpacity={0.8}
              >
                <View style={[styles.devToolIconContainer, styles.devToolIconPurple]}>
                  <Ionicons name="calendar-outline" size={24} color="#6F42C1" />
                </View>
                <View style={styles.devToolTextContainer}>
                  <Text style={styles.devToolTitle}>Tester notif. prochaine séance</Text>
                  <Text style={styles.devToolSubtitle}>
                    &ldquo;Ta prochaine révision n&apos;est pas encore enregistrée...&rdquo;
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
              </TouchableOpacity>

              {/* Test Low Storage Notification */}
              <TouchableOpacity
                style={styles.devToolButton}
                onPress={handleTestLowStorage}
                activeOpacity={0.8}
              >
                <View style={[styles.devToolIconContainer, styles.devToolIconDanger]}>
                  <Ionicons name="warning-outline" size={24} color="#DC3545" />
                </View>
                <View style={styles.devToolTextContainer}>
                  <Text style={styles.devToolTitle}>Tester notif. espace faible</Text>
                  <Text style={styles.devToolSubtitle}>
                    &ldquo;Tu n&apos;as presque plus d&apos;espace...&rdquo;
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#A0A0A0" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out" size={22} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </TouchableOpacity>

          {/* App Version */}
          <Text style={styles.versionText}>Version 1.0.0</Text>
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
    paddingBottom: 32,
    alignItems: "center",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 42,
    fontWeight: "700",
    color: "#1E3A5F",
  },
  userName: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  userSchool: {
    fontSize: 16,
    color: "#FFD700",
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A5F",
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#5A5A5A",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2C2C2C",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#5A5A5A",
    textAlign: "center",
  },
  // Sync Status Card
  syncCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  syncCardOnline: {
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  syncCardOffline: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  syncIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
  },
  syncTextContainer: {
    flex: 1,
  },
  syncTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2C2C2C",
    marginBottom: 4,
  },
  syncDescription: {
    fontSize: 13,
    color: "#5A5A5A",
  },
  syncStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  syncStatusOnline: {
    backgroundColor: "#E8F5E9",
  },
  syncStatusOffline: {
    backgroundColor: "#FFF3E0",
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC3545",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
    shadowColor: "#DC3545",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  versionText: {
    fontSize: 12,
    color: "#A0A0A0",
    textAlign: "center",
    marginTop: 20,
  },
  // Developer Tools
  devToolsDescription: {
    fontSize: 13,
    color: "#5A5A5A",
    marginBottom: 16,
    fontStyle: "italic",
  },
  devToolsContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  devToolButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  devToolIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#EBF0F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  devToolIconSuccess: {
    backgroundColor: "#E8F5E9",
  },
  devToolIconWarning: {
    backgroundColor: "#FFF3E0",
  },
  devToolIconInfo: {
    backgroundColor: "#E3F2FD",
  },
  devToolIconPurple: {
    backgroundColor: "#F3E5F5",
  },
  devToolIconDanger: {
    backgroundColor: "#FFEBEE",
  },
  devToolTextContainer: {
    flex: 1,
  },
  devToolTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C2C2C",
    marginBottom: 4,
  },
  devToolSubtitle: {
    fontSize: 12,
    color: "#5A5A5A",
    fontStyle: "italic",
  },
});
