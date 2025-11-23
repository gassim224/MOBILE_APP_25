import { useEffect, useCallback, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS, TIME_INTERVALS } from "@/constants/AppConstants";

export default function Index() {
  const router = useRouter();
  const hasNavigated = useRef(false);

  const checkAuth = useCallback(async () => {
    // Prevent multiple navigation attempts
    if (hasNavigated.current) {
      return;
    }

    try {
      const sessionToken = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);

      // Add a small delay for smoother transition
      setTimeout(() => {
        if (!hasNavigated.current) {
          hasNavigated.current = true;
          if (sessionToken) {
            router.replace("/(tabs)");
          } else {
            router.replace("/login");
          }
        }
      }, TIME_INTERVALS.AUTH_CHECK_DELAY);
    } catch (error) {
      console.error("Error checking auth:", error);
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        router.replace("/login");
      }
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
