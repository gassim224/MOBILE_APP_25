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
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { useConnectionSimulator } from "@/contexts/ConnectionSimulatorContext";
import { useDownloads } from "@/contexts/DownloadsContext";
import { seedLearningHistoryIfNeeded } from "@/utils/learningHistory";
import { getStudyTimeMs, formatStudyTime } from "@/utils/studyTime";
import logger from "@/utils/Logger";
// Use the central UserProfile type — it includes the role + teacher metadata
// (subjects, gradeLevels) needed for teacher-aware profile rendering.
import type { UserProfile } from "@/types";

export default function Profile() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { isConnectedToKiosk } = useConnectionSimulator();
  const { downloadedCourses, downloadedBooks } = useDownloads();
  const [isSyncing, setIsSyncing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const previousConnectionState = useRef(isConnectedToKiosk);

  // Lifetime statistics from the learning-history store — unlike the old
  // downloads-derived numbers, these survive content deletion. Study time is
  // the real accumulated player/reader time, not an estimate.
  const [stats, setStats] = useState({
    coursesStarted: 0,
    completedLessons: 0,
    studyTimeLabel: '0min',
    booksRead: 0,
  });

  const refreshStats = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const history = await seedLearningHistoryIfNeeded(userProfile.id, {
        courses: downloadedCourses.map((c) => ({ title: c.title, lessons: c.lessons })),
        books: downloadedBooks.map((b) => ({ id: b.id })),
      });
      const studyMs = await getStudyTimeMs();
      setStats({
        coursesStarted: history.courseTitles.length,
        completedLessons: history.lessonsCompleted,
        booksRead: history.booksRead,
        studyTimeLabel: formatStudyTime(studyMs),
      });
    } catch (error) {
      logger.error("Error loading learning history:", error);
    }
  }, [userProfile, downloadedCourses, downloadedBooks]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  // Refresh when the tab regains focus so time spent in a player just now
  // shows up immediately.
  useFocusEffect(
    useCallback(() => {
      refreshStats();
    }, [refreshStats])
  );

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
                  <Text style={styles.infoLabel}>
                    {userProfile.role === 'teacher' ? 'Classes attribuées' : 'Niveau'}
                  </Text>
                  {userProfile.role === 'teacher' && Array.isArray(userProfile.gradeLevels) && userProfile.gradeLevels.length > 0 ? (
                    <Text style={styles.infoValue}>{userProfile.gradeLevels.join(', ')}</Text>
                  ) : (
                    <Text style={styles.infoValue}>Classe {userProfile.grade}</Text>
                  )}
                </View>
              </View>

              {/* Teachers also see their subjects. Hidden for students. */}
              {userProfile.role === 'teacher' && Array.isArray(userProfile.subjects) && userProfile.subjects.length > 0 && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.infoRow}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="book" size={20} color="#1E3A5F" />
                    </View>
                    <View style={styles.infoTextContainer}>
                      <Text style={styles.infoLabel}>Matières enseignées</Text>
                      <Text style={styles.infoValue}>{userProfile.subjects.join(', ')}</Text>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <Ionicons name="card" size={20} color="#5A5A5A" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>
                    {userProfile.role === 'teacher' ? 'ID Enseignant' : 'ID Élève'}
                  </Text>
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
                <Text style={styles.statValue}>{stats.coursesStarted}</Text>
                <Text style={styles.statLabel}>Cours suivis</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-circle" size={28} color="#17A2B8" />
                </View>
                <Text style={styles.statValue}>{stats.completedLessons}</Text>
                <Text style={styles.statLabel}>Leçons complétées</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="time" size={28} color="#FFD700" />
                </View>
                <Text style={styles.statValue}>{stats.studyTimeLabel}</Text>
                <Text style={styles.statLabel}>Temps d&apos;étude</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="book-outline" size={28} color="#28A745" />
                </View>
                <Text style={styles.statValue}>{stats.booksRead}</Text>
                <Text style={styles.statLabel}>Livres lus</Text>
              </View>
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
});
