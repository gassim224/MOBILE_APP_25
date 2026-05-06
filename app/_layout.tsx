import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ScreenOrientation from "expo-screen-orientation";
import { ConnectionSimulatorProvider } from "@/contexts/ConnectionSimulatorContext";
import { DownloadsProvider } from "@/contexts/DownloadsContext";
import { ActiveGradeProvider } from "@/contexts/ActiveGradeContext";
import { initializeNotificationService, updateLastAppOpenTimestamp } from "@/utils/notificationService";
import { initAnalytics, flushQueue as flushAnalyticsQueue } from "@/services/analyticsService";
import { AppState } from "react-native";
import { STORAGE_KEYS } from "@/constants/AppConstants";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const isCheckingAuth = useRef(false);

  const checkAuthStatus = useCallback(async () => {
    // Prevent concurrent auth checks to avoid race conditions
    if (isCheckingAuth.current) {
      return;
    }

    isCheckingAuth.current = true;

    try {
      const sessionToken = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);

      const inAuthGroup = segments[0] === "(tabs)" || segments[0] === "course-detail" || segments[0] === "all-courses";

      // If we're on the login/index screen and have a token, navigate to tabs
      if (sessionToken && segments[0] === "login") {
        router.replace("/(tabs)");
      } else if (!sessionToken && inAuthGroup) {
        // If no token and trying to access protected routes, go to login
        router.replace("/login");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      // On error, safely navigate to login
      const currentSegment = segments[0];
      if (currentSegment !== "login") {
        router.replace("/login");
      }
    } finally {
      isCheckingAuth.current = false;
    }
  }, [segments, router]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  }, []);

  // Initialize notification service on app launch
  useEffect(() => {
    initializeNotificationService();
    // Wire analytics queue flush — sends pending events when internet is available
    initAnalytics();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground
        updateLastAppOpenTimestamp();
        // Try flushing the analytics queue when the user reopens the app
        flushAnalyticsQueue().catch(() => undefined);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <DownloadsProvider>
      <ConnectionSimulatorProvider>
        <ActiveGradeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="course-detail" options={{ presentation: "card" }} />
          <Stack.Screen name="all-courses" options={{ presentation: "card" }} />
          <Stack.Screen
            name="(modals)/video-player"
            options={{
              presentation: "fullScreenModal",
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="(modals)/audio-player"
            options={{
              presentation: "fullScreenModal",
              animation: "fade",
            }}
          />
          <Stack.Screen
            name="(modals)/pdf-reader"
            options={{
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
        </Stack>
        </ActiveGradeProvider>
      </ConnectionSimulatorProvider>
    </DownloadsProvider>
  );
}
