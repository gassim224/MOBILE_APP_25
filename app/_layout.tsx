import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const checkAuthStatus = useCallback(async () => {
    try {
      const sessionToken = await AsyncStorage.getItem("sessionToken");

      // If we're on the login screen and have a token, navigate to tabs
      if (sessionToken && segments[0] !== "(tabs)") {
        router.replace("/(tabs)/contenu");
      } else if (!sessionToken && segments[0] === "(tabs)") {
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
