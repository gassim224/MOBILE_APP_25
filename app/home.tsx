import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

interface UserProfile {
  studentName: string;
  schoolName: string;
  grade: string;
  studentId: string;
}

export default function Home() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = useCallback(async () => {
    try {
      const profileData = await AsyncStorage.getItem("userProfile");
      if (profileData) {
        setUserProfile(JSON.parse(profileData));
      } else {
        // If no profile, redirect to login
        router.replace("/login");
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("sessionToken");
      await AsyncStorage.removeItem("userProfile");
      router.replace("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
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
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Student Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userProfile?.studentName.charAt(0)}
              </Text>
            </View>
            <View style={styles.infoDetails}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nom:</Text>
                <Text style={styles.infoValue}>{userProfile?.studentName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>École:</Text>
                <Text style={styles.infoValue}>{userProfile?.schoolName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Classe:</Text>
                <Text style={styles.infoValue}>Classe {userProfile?.grade}</Text>
              </View>
            </View>
          </View>

          {/* Course Catalog Placeholder */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Catalogue des cours</Text>
            <Text style={styles.sectionSubtitle}>
              Explorez vos cours et commencez à apprendre
            </Text>
          </View>

          {/* Placeholder Cards */}
          <View style={styles.coursesContainer}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.coursePlaceholder}>
                <View style={styles.coursePlaceholderIcon}>
                  <Text style={styles.coursePlaceholderIconText}>📚</Text>
                </View>
                <View style={styles.coursePlaceholderContent}>
                  <Text style={styles.coursePlaceholderTitle}>
                    Cours à venir
                  </Text>
                  <Text style={styles.coursePlaceholderText}>
                    Votre catalogue de cours apparaîtra ici bientôt
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Encouraging Message */}
          <View style={styles.encouragementBox}>
            <Text style={styles.encouragementTitle}>
              🌟 Continuez votre excellent travail! 🌟
            </Text>
            <Text style={styles.encouragementText}>
              Chaque jour est une nouvelle opportunité d&apos;apprendre et de grandir.
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  header: {
    backgroundColor: "#1E3A5F", // Academic Blue
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
    marginBottom: 16,
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
    color: "#FFD700", // Sunshine Yellow
  },
  logoutButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#17A2B8", // Teal
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  infoDetails: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5A5A5A",
    width: 60,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2C2C2C",
    flex: 1,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E3A5F", // Academic Blue
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#5A5A5A",
  },
  coursesContainer: {
    marginBottom: 24,
  },
  coursePlaceholder: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  coursePlaceholderIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  coursePlaceholderIconText: {
    fontSize: 24,
  },
  coursePlaceholderContent: {
    flex: 1,
  },
  coursePlaceholderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5A5A5A",
    marginBottom: 4,
  },
  coursePlaceholderText: {
    fontSize: 13,
    color: "#A0A0A0",
  },
  encouragementBox: {
    backgroundColor: "#17A2B8", // Teal
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  encouragementTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  encouragementText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 20,
  },
});
