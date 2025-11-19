import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage keys
const NOTIFICATION_PERMISSION_KEY = 'notificationPermissionRequested';
const LAST_APP_OPEN_KEY = 'lastAppOpenTimestamp';
const INACTIVITY_NOTIFICATION_ID_KEY = 'inactivityNotificationId';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions denied');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD700',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Check if this is the first app launch and request permissions if needed
 */
export async function checkAndRequestNotificationPermissionsOnFirstLaunch(): Promise<void> {
  try {
    const hasRequested = await AsyncStorage.getItem(NOTIFICATION_PERMISSION_KEY);

    if (!hasRequested) {
      // First launch - request permissions
      const granted = await requestNotificationPermissions();

      // Mark as requested
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');

      if (granted) {
        console.log('Notification permissions granted on first launch');
        // Schedule inactivity reminder for 48 hours from now
        await scheduleInactivityReminder();
      }
    }
  } catch (error) {
    console.error('Error checking notification permissions on first launch:', error);
  }
}

/**
 * Update the last app open timestamp
 * Call this when the app comes to foreground
 */
export async function updateLastAppOpenTimestamp(): Promise<void> {
  try {
    const now = new Date().getTime();
    await AsyncStorage.setItem(LAST_APP_OPEN_KEY, now.toString());

    // Cancel existing inactivity reminder and schedule a new one
    await cancelInactivityReminder();
    await scheduleInactivityReminder();
  } catch (error) {
    console.error('Error updating last app open timestamp:', error);
  }
}

/**
 * Schedule inactivity reminder notification (48 hours from now)
 */
async function scheduleInactivityReminder(): Promise<void> {
  try {
    // Check if permissions are granted
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    // Cancel existing notification if any
    await cancelInactivityReminder();

    // Schedule notification for 48 hours from now
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "On dirait que vous nous avez manqué ! 🎓",
        body: "Revenez continuer votre apprentissage.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 48 * 60 * 60, // 48 hours
        repeats: false,
      },
    });

    // Save notification ID for later cancellation
    await AsyncStorage.setItem(INACTIVITY_NOTIFICATION_ID_KEY, notificationId);

    console.log('Inactivity reminder scheduled:', notificationId);
  } catch (error) {
    console.error('Error scheduling inactivity reminder:', error);
  }
}

/**
 * Cancel the inactivity reminder notification
 */
async function cancelInactivityReminder(): Promise<void> {
  try {
    const notificationId = await AsyncStorage.getItem(INACTIVITY_NOTIFICATION_ID_KEY);

    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(INACTIVITY_NOTIFICATION_ID_KEY);
      console.log('Inactivity reminder cancelled:', notificationId);
    }
  } catch (error) {
    console.error('Error cancelling inactivity reminder:', error);
  }
}

/**
 * Send immediate notification for course completion
 */
export async function sendCourseCompletionNotification(courseName: string): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Félicitations ! 🎉",
        body: `Vous avez terminé le cours de ${courseName}. Excellent travail !`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Send immediately
    });

    console.log('Course completion notification sent for:', courseName);
  } catch (error) {
    console.error('Error sending course completion notification:', error);
  }
}

/**
 * Schedule lesson continuation reminder for the next day
 */
export async function scheduleLessonContinuationReminder(
  lessonId: string,
  lessonName: string
): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    // Cancel existing reminder for this lesson if any
    await cancelLessonContinuationReminder(lessonId);

    // Schedule notification for next day (24 hours from now)
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "N'oubliez pas votre leçon ! 📚",
        body: `N'oubliez pas de finir votre leçon de ${lessonName}. Vous y étiez presque !`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { lessonId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 24 * 60 * 60, // 24 hours
        repeats: false,
      },
    });

    // Save notification ID for this lesson
    await AsyncStorage.setItem(`lesson_reminder_${lessonId}`, notificationId);

    console.log('Lesson continuation reminder scheduled:', lessonId, notificationId);
  } catch (error) {
    console.error('Error scheduling lesson continuation reminder:', error);
  }
}

/**
 * Cancel lesson continuation reminder for a specific lesson
 */
export async function cancelLessonContinuationReminder(lessonId: string): Promise<void> {
  try {
    const notificationId = await AsyncStorage.getItem(`lesson_reminder_${lessonId}`);

    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await AsyncStorage.removeItem(`lesson_reminder_${lessonId}`);
      console.log('Lesson continuation reminder cancelled:', lessonId);
    }
  } catch (error) {
    console.error('Error cancelling lesson continuation reminder:', error);
  }
}

/**
 * Initialize notification service
 * Call this when the app starts
 */
export async function initializeNotificationService(): Promise<void> {
  try {
    // Check and request permissions on first launch
    await checkAndRequestNotificationPermissionsOnFirstLaunch();

    // Update last app open timestamp
    await updateLastAppOpenTimestamp();
  } catch (error) {
    console.error('Error initializing notification service:', error);
  }
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

// ============================================================================
// TESTING & DEBUGGING FUNCTIONS
// ============================================================================

/**
 * Test function: Schedule inactivity notification with 5-second delay
 */
export async function testInactivityNotification(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "On dirait que vous nous avez manqué ! 🎓",
        body: "Revenez continuer votre apprentissage.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5, // 5 seconds for testing
        repeats: false,
      },
    });

    console.log('Test inactivity notification scheduled for 5 seconds');
  } catch (error) {
    console.error('Error scheduling test inactivity notification:', error);
    throw error;
  }
}

/**
 * Test function: Schedule course completion notification with 5-second delay
 */
export async function testCourseCompletionNotification(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Félicitations ! 🎉",
        body: "Vous avez terminé le cours de Mathématiques Avancées. Excellent travail !",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5, // 5 seconds for testing
        repeats: false,
      },
    });

    console.log('Test course completion notification scheduled for 5 seconds');
  } catch (error) {
    console.error('Error scheduling test course completion notification:', error);
    throw error;
  }
}

/**
 * Test function: Schedule lesson continuation notification with 5-second delay
 */
export async function testLessonContinuationNotification(): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "N'oubliez pas votre leçon ! 📚",
        body: "N'oubliez pas de finir votre leçon de Introduction à l'algèbre. Vous y étiez presque !",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5, // 5 seconds for testing
        repeats: false,
      },
    });

    console.log('Test lesson continuation notification scheduled for 5 seconds');
  } catch (error) {
    console.error('Error scheduling test lesson continuation notification:', error);
    throw error;
  }
}
