import { useEffect, useCallback } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const sessionToken = await AsyncStorage.getItem("sessionToken");

      // Add a small delay for smoother transition
      setTimeout(() => {
        if (sessionToken) {
          router.replace("/(tabs)/contenu");
        } else {
          router.replace("/login");
        }
      }, 500);
    } catch (error) {
      console.error("Error checking auth:", error);
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#1E3A5F", // Academic Blue
      }}
    >
      <ActivityIndicator size="large" color="#FFD700" />
    </View>
  );
}
