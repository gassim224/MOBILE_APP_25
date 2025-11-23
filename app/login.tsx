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
import { TEST_CREDENTIALS, STORAGE_KEYS, TIME_INTERVALS, MESSAGES } from "@/constants/AppConstants";
import { UserProfile } from "@/types";
import logger from "@/utils/Logger";

export default function Login() {
  const router = useRouter();
  const [studentId, setStudentId] = useState<string>(TEST_CREDENTIALS.USERNAME);
  const [password, setPassword] = useState<string>(TEST_CREDENTIALS.PASSWORD);
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

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Test credentials validation
      const isTestUser =
        studentId.trim() === TEST_CREDENTIALS.USERNAME &&
        password.trim() === TEST_CREDENTIALS.PASSWORD;

      // Mock session token
      const sessionToken = `mock_token_${Date.now()}`;

      // Mock user profile data - use specific data for test user
      const userProfile: UserProfile = isTestUser
        ? {
            studentName: "Élève Test",
            schoolName: "École Démonstration",
            grade: "10",
            studentId: studentId,
          }
        : {
            studentName: "Amara",
            schoolName: "Le Grand Lycée",
            grade: "10",
            studentId: studentId,
          };

      // Store session token and user profile with proper error handling
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, sessionToken);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(userProfile));
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

      // Navigate to tabs with smooth transition
      setTimeout(() => {
        router.replace("/(tabs)");
      }, TIME_INTERVALS.LOGIN_TRANSITION_DELAY);
    } catch (error) {
      logger.error("Login error:", error);
      Alert.alert(
        "Erreur",
        MESSAGES.LOGIN_ERROR_GENERIC,
        [{ text: MESSAGES.OK }]
      );
      setIsNavigating(false);
    } finally {
      setLoading(false);
    }
  }, [studentId, password, loading, isNavigating, router]);

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
