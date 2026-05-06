import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { STORAGE_KEYS, MESSAGES } from "@/constants/AppConstants";
import { UserProfile } from "@/types";
import logger from "@/utils/Logger";
import { AuthAPI, ApiError } from "@/services/api";
import { emitFirstLoginIfNew } from "@/services/analyticsService";
import { useActiveGrade } from "@/contexts/ActiveGradeContext";

// Persisted across logouts so a user who logged out while offline can sign
// back in to their downloads. Cleared by an explicit "forget device" action
// (which we don't expose yet) or by a fresh successful login as a different
// user (handled below).
const OFFLINE_PROFILE_KEY = '@offline_profile';

export default function Login() {
  const router = useRouter();
  const { refresh: refreshActiveGrade } = useActiveGrade();
  const [studentId, setStudentId] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleLogin = useCallback(async () => {
    // Validate non-empty inputs
    if (!studentId.trim() || !password.trim()) {
      return;
    }

    // Prevent multiple login attempts
    if (loading || isNavigating) {
      return;
    }

    setLoading(true);
    setIsNavigating(true);

    // Offline relogin: if kiosk is unreachable but we have a cached profile +
    // saved password for this email, let the user back in to their downloads.
    // Networked auth still wins when available.
    const tryOfflineLogin = async (): Promise<boolean> => {
      try {
        const raw = await AsyncStorage.getItem(OFFLINE_PROFILE_KEY);
        if (!raw) return false;
        const cached = JSON.parse(raw) as { email: string; password: string; profile: UserProfile; token?: string };
        if (!cached?.email || cached.email.trim().toLowerCase() !== studentId.trim().toLowerCase()) return false;
        if (cached.password !== password.trim()) return false;
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(cached.profile));
        if (cached.token) await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, cached.token);
        await refreshActiveGrade();
        return true;
      } catch (e) {
        logger.warn('offline login fallback failed', e);
        return false;
      }
    };

    try {
      logger.info("Attempting login...");
      const response = await AuthAPI.login(studentId.trim(), password.trim());

      if (!response.success || !response.token) {
        setLoading(false);
        setIsNavigating(false);
        Alert.alert(
          "Identifiants incorrects",
          response.message || "L'identifiant ou le mot de passe est incorrect. Veuillez réessayer.",
          [{ text: MESSAGES.OK }]
        );
        return;
      }

      // Create user profile from API response. Role + subjects + gradeLevels
      // come from the kiosk now (Phase A backend change). Default to student
      // so this still works against a kiosk that hasn't been upgraded yet.
      const userProfile: UserProfile = {
        id: response.user?.id || "",
        schoolId: response.user?.schoolId || "",
        role: response.user?.role || 'student',
        studentName: response.user?.fullName || response.user?.email || studentId,
        schoolName: response.user?.schoolName || "École",
        grade: response.user?.grade || "",
        studentId: response.user?.studentId || studentId,
        subjects: response.user?.subjects || [],
        gradeLevels: response.user?.gradeLevels || (response.user?.grade ? [response.user.grade] : []),
      };

      // Store user profile (token already stored by AuthAPI.login)
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
        // Persist credentials + profile + token for offline relogin. Stored
        // under a separate key so logout (which wipes USER_PROFILE) doesn't
        // erase it; allows the user to sign back in to their downloads when
        // the kiosk is unreachable.
        await AsyncStorage.setItem(OFFLINE_PROFILE_KEY, JSON.stringify({
          email: studentId.trim(),
          password: password.trim(),
          profile: userProfile,
          token: response.token,
        }));
        // Refresh the active-grade context so it picks up the new profile
        // (and resets the stored grade selection if the user changed roles).
        await refreshActiveGrade();
        // Emit first_login analytics event (no-op if already fired for this user).
        await emitFirstLoginIfNew();
      } catch (storageError) {
        logger.error("AsyncStorage error:", storageError);
        Alert.alert(
          "Erreur",
          "Impossible de sauvegarder les informations de connexion. Veuillez réessayer.",
          [{ text: MESSAGES.OK }]
        );
        setLoading(false);
        setIsNavigating(false);
        return;
      }

      setTimeout(() => {
        router.replace("/(tabs)");
      }, 100);
    } catch (error) {
      logger.error("Login error:", error);

      const looksLikeOffline =
        (error instanceof ApiError) ||
        (error instanceof Error && (error.message.includes('Network') || error.message.includes('fetch') || error.message.includes('timeout')));

      // Offline fallback — only if cached creds match. Keeps the user out of
      // their downloads if it's actually a wrong-password situation.
      if (looksLikeOffline) {
        const ok = await tryOfflineLogin();
        if (ok) {
          logger.info("Offline relogin succeeded — using cached profile");
          setTimeout(() => router.replace("/(tabs)"), 100);
          return;
        }
        Alert.alert(
          "Hors ligne",
          "Impossible de joindre le serveur de l'école. Connectez-vous au WiFi Bonecole, ou réessayez avec un identifiant déjà utilisé sur cet appareil.",
          [{ text: MESSAGES.OK }]
        );
      } else {
        Alert.alert("Erreur", "Une erreur s'est produite. Veuillez réessayer.", [{ text: MESSAGES.OK }]);
      }
      setIsNavigating(false);
    } finally {
      setLoading(false);
    }
  }, [studentId, password, loading, isNavigating, router]);

  const handleSkipToDownloads = useCallback(() => {
    // Prevent navigation if already navigating
    if (isNavigating) {
      return;
    }

    setIsNavigating(true);

    // Navigate directly to downloads tab
    setTimeout(() => {
      router.replace("/(tabs)/downloads");
    }, 300);
  }, [isNavigating, router]);

  return (
    <>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Image */}
          <View style={styles.illustrationContainer}>
            <View style={styles.illustrationPlaceholder}>
              <Image
                source={require("@/assets/images/login-header-new.jpg")}
                style={styles.headerImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Bonecole - votre école au bout du doigt</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Identifiant Élève</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez votre ID étudiant"
                placeholderTextColor="#A0A0A0"
                value={studentId}
                onChangeText={setStudentId}
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Mot de passe / PIN</Text>
              <TextInput
                style={styles.input}
                placeholder="Entrez votre mot de passe"
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                (!studentId.trim() || !password.trim() || loading || isNavigating) &&
                  styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!studentId.trim() || !password.trim() || loading || isNavigating}
              activeOpacity={0.8}
            >
              {loading || isNavigating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            {/* Skip to Downloads Button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkipToDownloads}
              disabled={isNavigating}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>Accéder à mes téléchargements</Text>
            </TouchableOpacity>
          </View>

          {/* Encouraging Message */}
          <View style={styles.encouragementContainer}>
            <Text style={styles.encouragementText}>
              ✨ Votre aventure commence ici ✨
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
  },
  illustrationContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  illustrationPlaceholder: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    position: "relative",
    borderWidth: 4,
    borderColor: "#FFD700",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  welcomeContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E3A5F", // Academic Blue
    textAlign: "center",
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C2C2C",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#2C2C2C",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButton: {
    backgroundColor: "#FFD700", // Sunshine Yellow
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: "#D0D0D0",
    shadowOpacity: 0.1,
  },
  loginButtonText: {
    color: "#1E3A5F", // Academic Blue text on yellow button
    fontSize: 18,
    fontWeight: "700",
  },
  skipButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#1E3A5F", // Academic Blue border
  },
  skipButtonText: {
    color: "#1E3A5F", // Academic Blue text
    fontSize: 16,
    fontWeight: "600",
  },
  encouragementContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  encouragementText: {
    fontSize: 16,
    color: "#17A2B8", // Teal
    fontWeight: "600",
    textAlign: "center",
  },
});
