import { useState } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

export default function Login() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // Validate non-empty inputs
    if (!studentId.trim() || !password.trim()) {
      return;
    }

    setLoading(true);

    try {
      // Mock authentication - assume any non-empty input is valid
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock session token
      const sessionToken = `mock_token_${Date.now()}`;

      // Mock user profile data
      const userProfile = {
        studentName: "Amara",
        schoolName: "Le Grand Lycée",
        grade: "10",
        studentId: studentId,
      };

      // Store session token and user profile
      await AsyncStorage.setItem("sessionToken", sessionToken);
      await AsyncStorage.setItem("userProfile", JSON.stringify(userProfile));

      // Navigate to tabs with smooth transition
      setTimeout(() => {
        router.replace("/(tabs)/contenu");
      }, 200);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

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
                source={require("@/assets/images/login-header.png")}
                style={styles.headerImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <Text style={styles.illustrationSubtext}>
                  Black kids in Learning
                </Text>
              </View>
            </View>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Bonecole - votre école au bout du doigt</Text>
            <Text style={styles.welcomeSubtitle}>
              Connectez-vous pour commencer votre voyage d&apos;apprentissage
            </Text>
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
                (!studentId.trim() || !password.trim() || loading) &&
                  styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={!studentId.trim() || !password.trim() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
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
    width: 200,
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(30, 58, 95, 0.85)",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  illustrationSubtext: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  welcomeContainer: {
    marginBottom: 32,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E3A5F", // Academic Blue
    marginBottom: 8,
    textAlign: "center",
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#5A5A5A",
    textAlign: "center",
    lineHeight: 22,
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
