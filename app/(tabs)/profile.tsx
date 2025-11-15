import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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

export default function Profile() {
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
              console.error("Logout error:", error);
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
