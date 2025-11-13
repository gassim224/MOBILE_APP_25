import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConnectionSimulatorProvider } from "@/contexts/ConnectionSimulatorContext";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const checkAuthStatus = useCallback(async () => {
    try {
      const sessionToken = await AsyncStorage.getItem("sessionToken");

      // If we're on the login screen and have a token, navigate to main Home Screen
      if (sessionToken && segments[0] !== "(tabs)" && segments[0] !== "home") {
        router.replace("/home");
      } else if (!sessionToken && (segments[0] === "(tabs)" || segments[0] === "home")) {
        router.replace("/login");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
  }, [segments, router]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <ConnectionSimulatorProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="home" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="course-detail" options={{ presentation: "card" }} />
        <Stack.Screen name="all-courses" options={{ presentation: "card" }} />
      </Stack>
    </ConnectionSimulatorProvider>
  );
}
