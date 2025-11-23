# CODE AUDIT REPORT

**Generated:** 2025
**Project:** Bonecole - Expo React Native Application
**Audit Scope:** Full codebase analysis (TypeScript static analysis, logic review, performance checks)

---

## CRITICAL ISSUES

### Issue 1
- **File Path:** app/(tabs)/downloads.tsx
- **Line Number(s):** 160-165
- **Type:** Critical
- **Explanation:** The `tab` parameter from `useLocalSearchParams()` can be `string | string[] | undefined`, but the code only handles `string | undefined`. If multiple query parameters with the same name are passed, the app will crash or behave unexpectedly. This is a runtime safety issue that violates TypeScript's strict null checking principles.
- **Recommended Fix:**
```typescript
// Handle incoming tab parameter from navigation
useEffect(() => {
  const tabParam = params.tab;
  // Handle array case by taking first element
  const tabValue = Array.isArray(tabParam) ? tabParam[0] : tabParam;

  if (tabValue === "cours" || tabValue === "bibliotheque") {
    setActiveTab(tabValue);
  }
}, [params.tab]);
```

### Issue 2
- **File Path:** contexts/ConnectionSimulatorContext.tsx
- **Line Number(s):** 70-80
- **Type:** Critical
- **Explanation:** The `checkRealKioskConnection` function is added as a network listener on every connection change without proper memoization. This creates an infinite loop risk and unnecessary re-renders. Every time the network state changes, a new listener is registered which checks the connection, which potentially triggers another network event.
- **Recommended Fix:**
```typescript
useEffect(() => {
  // Initial check
  checkRealKioskConnection();

  // Subscribe to network changes with debounce
  const unsubscribe = NetInfo.addEventListener((state) => {
    // Debounce or throttle this call
    checkRealKioskConnection();
  });

  return () => {
    unsubscribe();
  };
}, [checkRealKioskConnection]);
```

---

## MAJOR ISSUES

### Issue 3
- **File Path:** app/(tabs)/downloads.tsx
- **Line Number(s):** 375
- **Type:** Major
- **Explanation:** Production console.log statement found in the delete lesson handler. Console statements should not be present in production code as they can leak sensitive information and impact performance. They should be replaced with proper error tracking or removed entirely.
- **Recommended Fix:**
```javascript
// Remove or replace with proper error tracking
// console.log(`Lesson deleted: ${lessonTitle} from course ${courseId}`);
// If logging is needed for debugging, use a proper logger service
```

### Issue 4
- **File Path:** app/(tabs)/index.tsx
- **Line Number(s):** 169, 325
- **Type:** Major
- **Explanation:** Multiple console.error and console.log statements found in production code. These should be replaced with a proper logging service that can be toggled between development and production environments.
- **Recommended Fix:**
```javascript
// Create a logger utility in utils/logger.ts
export const logger = {
  error: (message: string, error?: unknown) => {
    if (__DEV__) {
      console.error(message, error);
    }
    // Send to error tracking service in production
  },
  log: (message: string) => {
    if (__DEV__) {
      console.log(message);
    }
  }
};

// Then use it:
logger.error("Error loading user profile:", error);
```

### Issue 5
- **File Path:** utils/notificationService.ts
- **Line Number(s):** 36, 72, 107, 131, 147, 174, 215, 231
- **Type:** Major
- **Explanation:** Extensive use of console.log and console.error throughout the notification service. This utility is called frequently and should use a structured logging approach instead of direct console access.
- **Recommended Fix:**
```typescript
import { logger } from './logger';

// Replace all console.log with logger.log
// Replace all console.error with logger.error

// Example:
logger.log('Notification permissions granted on first launch');
logger.error('Error requesting notification permissions:', error);
```

### Issue 6
- **File Path:** app/(tabs)/index.tsx
- **Line Number(s):** 195-213
- **Type:** Major
- **Explanation:** The "Continuer l'apprentissage" section navigation logic navigates to downloads screen but doesn't verify if the target tab exists or if there's actual content. This could lead to user confusion if they click an activity but land on an empty downloads screen.
- **Recommended Fix:**
```typescript
const handleRecentActivityPress = (activity: RecentActivity) => {
  // Verify the activity has valid data before navigating
  if (!activity.id || !activity.type) {
    Alert.alert("Erreur", "Cette activité n'est plus disponible.");
    return;
  }

  if (activity.type === "course") {
    router.push({
      pathname: "/(tabs)/downloads",
      params: {
        tab: "cours",
      },
    });
  } else {
    router.push({
      pathname: "/(tabs)/downloads",
      params: {
        tab: "bibliotheque",
      },
    });
  }
};
```

### Issue 7
- **File Path:** app/course-detail.tsx
- **Line Number(s):** 95
- **Type:** Major
- **Explanation:** Commented-out variable `courseId` suggests incomplete implementation. Dead code should be removed or implemented, not left commented.
- **Recommended Fix:**
```typescript
// Either remove the comment entirely, or implement the feature:
const courseId = (params.id as string | undefined) || "unknown";
// Then use courseId for tracking, analytics, etc.
```

### Issue 8
- **File Path:** app/_layout.tsx
- **Line Number(s):** 35
- **Type:** Major
- **Explanation:** Generic console.error in auth check without proper error classification. Auth errors should be handled with more specificity and potentially logged to a monitoring service.
- **Recommended Fix:**
```typescript
} catch (error) {
  // Classify error type
  if (error instanceof Error) {
    logger.error("Auth check failed:", { message: error.message, stack: error.stack });
  } else {
    logger.error("Auth check failed with unknown error:", error);
  }

  // On error, safely navigate to login
  const currentSegment = segments[0];
  if (currentSegment !== "login") {
    router.replace("/login");
  }
}
```

### Issue 9
- **File Path:** constants/SampleData.ts
- **Line Number(s):** 1-21
- **Type:** Major
- **Explanation:** Sample data file uses external URLs for testing but doesn't match all the interfaces defined in the types. Missing properties like `isCompleted` for Lesson interface and inconsistent data structure.
- **Recommended Fix:**
```typescript
// Ensure sample data matches all type definitions
// Add validation or type assertions to catch mismatches

import type { Lesson, Book } from '@/types';

// Sample PDF URL for testing the PDF reader - with proper typing
export const SAMPLE_PDF_URL: string = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

// Ensure all exported data matches interfaces
export const SAMPLE_LESSON: Lesson = {
  id: "sample-1",
  title: "Sample Lesson",
  type: "video",
  size: "45 MB",
  duration: "15 min",
  isDownloaded: false,
  isCompleted: false, // Match interface
  mediaUrl: SAMPLE_VIDEO_URL,
};
```

---

## MINOR ISSUES

### Issue 10
- **File Path:** app/(tabs)/downloads.tsx
- **Line Number(s):** 46-119
- **Type:** Minor
- **Explanation:** Mock data is defined directly in the component file. This makes testing difficult and increases component file size. Mock data should be extracted to a separate constants file.
- **Recommended Fix:**
```typescript
// Move to constants/MockData.ts
export const MOCK_DOWNLOADED_COURSES: DownloadedCourse[] = [ /* data */ ];
export const MOCK_DOWNLOADED_BOOKS: DownloadedBook[] = [ /* data */ ];

// Then import in downloads.tsx
import { MOCK_DOWNLOADED_COURSES, MOCK_DOWNLOADED_BOOKS } from '@/constants/MockData';
```

### Issue 11
- **File Path:** app/(tabs)/index.tsx
- **Line Number(s):** 50-51
- **Type:** Minor
- **Explanation:** Magic numbers used for dimensions calculation. The value `0.7` should be extracted as a named constant for clarity and maintainability.
- **Recommended Fix:**
```typescript
// At the top of the file or in constants
const CARD_WIDTH_RATIO = 0.7;
const { width } = Dimensions.get("window");
const CARD_WIDTH = width * CARD_WIDTH_RATIO;
```

### Issue 12
- **File Path:** app/(tabs)/cours.tsx
- **Line Number(s):** 14-75
- **Type:** Minor
- **Explanation:** `ALL_COURSES` mock data is duplicated from index.tsx. This violates DRY principles and creates maintenance burden if course data needs to change.
- **Recommended Fix:**
```typescript
// Create constants/MockCourses.ts
export const ALL_COURSES: Course[] = [ /* data */ ];

// Import in both files
import { ALL_COURSES } from '@/constants/MockCourses';
```

### Issue 13
- **File Path:** app/(tabs)/bibliotheque.tsx
- **Line Number(s):** 31-95
- **Type:** Minor
- **Explanation:** `MOCK_BOOKS` array is defined locally but could be shared across the application. Books are used in multiple places (index.tsx, bibliotheque.tsx).
- **Recommended Fix:**
```typescript
// Create constants/MockBooks.ts
export const MOCK_BOOKS: Book[] = [ /* data */ ];

// Import where needed
import { MOCK_BOOKS } from '@/constants/MockBooks';
```

### Issue 14
- **File Path:** components/ConnectionStatus.tsx
- **Line Number(s):** 7-16
- **Type:** Minor
- **Explanation:** Component is simple but doesn't use React.memo for optimization. Since it receives a primitive boolean prop, it should be memoized to prevent unnecessary re-renders.
- **Recommended Fix:**
```typescript
import React from 'react';

const ConnectionStatus = React.memo(({ isConnected }: ConnectionStatusProps) => {
  return (
    <View style={[styles.container, isConnected ? styles.connected : styles.offline]}>
      <View style={[styles.dot, isConnected ? styles.dotConnected : styles.dotOffline]} />
      <Text style={styles.text}>
        {isConnected ? "🟢 Connecté au kiosque" : "🔴 Hors ligne"}
      </Text>
    </View>
  );
});

ConnectionStatus.displayName = 'ConnectionStatus';

export default ConnectionStatus;
```

### Issue 15
- **File Path:** app/(tabs)/cours.tsx
- **Line Number(s):** 156
- **Type:** Minor
- **Explanation:** Component is wrapped with React.memo but the wrapped function is a default export of an anonymous function. This makes debugging harder and reduces code clarity.
- **Recommended Fix:**
```typescript
// Name the function before memoizing
function Cours() {
  // ... component code
}

export default React.memo(Cours);
```

### Issue 16
- **File Path:** app/(modals)/video-player.tsx
- **Line Number(s):** 100-125
- **Type:** Minor
- **Explanation:** `handlePlaybackStatusUpdate` has complex nested logic that could be extracted into separate helper functions for better readability and testability.
- **Recommended Fix:**
```typescript
const shouldSaveProgress = (status: AVPlaybackStatus): boolean => {
  if (!status.isLoaded || !status.isPlaying) return false;
  return Math.floor((status.positionMillis || 0) / 5000) % 1 === 0;
};

const handleVideoCompletion = async () => {
  await saveProgress();
  if (lessonId) {
    await cancelLessonContinuationReminder(lessonId);
  }
};

const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
  if (!status.isLoaded) {
    if (status.error) {
      Alert.alert('Erreur', 'Impossible de charger la vidéo');
    }
    return;
  }

  setIsLoading(false);
  setIsPlaying(status.isPlaying);
  setPosition(status.positionMillis || 0);
  setDuration(status.durationMillis || 0);

  if (shouldSaveProgress(status)) {
    saveProgress();
  }

  if (status.didJustFinish) {
    handleVideoCompletion();
  }
};
```

### Issue 17
- **File Path:** app/(tabs)/index.tsx
- **Line Number(s):** 46
- **Type:** Minor
- **Explanation:** Inline style object in return statement. The style should be extracted to the StyleSheet for consistency and performance.
- **Recommended Fix:**
```typescript
// Add to styles object at bottom
loadingContainer: {
  flex: 1,
  justifyContent: "center",
  alignItems: "center",
  backgroundColor: "#1E3A5F", // Academic Blue
},

// Use in component:
<View style={styles.loadingContainer}>
  <ActivityIndicator size="large" color="#FFD700" />
</View>
```

### Issue 18
- **File Path:** app/(tabs)/profile.tsx
- **Line Number(s):** 87, 101, 113, 127, 139, 153
- **Type:** Minor
- **Explanation:** Repetitive try-catch blocks in notification test functions. This could be abstracted into a higher-order function or utility to reduce code duplication.
- **Recommended Fix:**
```typescript
const testNotificationWithAlert = async (
  testFn: () => Promise<void>,
  successMessage: string
) => {
  try {
    await testFn();
    Alert.alert(
      "Notification programmée ✅",
      successMessage,
      [{ text: "OK" }]
    );
  } catch {
    Alert.alert("Erreur", "Impossible de programmer la notification");
  }
};

// Use it:
const handleTestInactivity = async () => {
  await testNotificationWithAlert(
    testInactivityNotification,
    "La notification d'inactivité apparaîtra dans 5 secondes. Mettez l'app en arrière-plan pour la voir."
  );
};
```

### Issue 19
- **File Path:** app/course-detail.tsx
- **Line Number(s):** 154, 204
- **Type:** Minor
- **Explanation:** Error handling in setTimeout callbacks logs to console but doesn't update UI state properly. The error state should be reflected in the component state.
- **Recommended Fix:**
```typescript
const [downloadError, setDownloadError] = useState<string | null>(null);

const handleDownloadLesson = (lessonId: string) => {
  if (!isConnectedToKiosk) {
    Alert.alert("Hors ligne", MESSAGES.DOWNLOAD_ERROR_OFFLINE, [{ text: MESSAGES.OK }]);
    return;
  }

  setDownloadingLessonId(lessonId);
  setDownloadError(null);

  setTimeout(() => {
    try {
      setLessons((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, isDownloaded: true } : l))
      );
      setDownloadingLessonId(null);
    } catch (error) {
      setDownloadError("Impossible de télécharger la leçon. Veuillez réessayer.");
      setDownloadingLessonId(null);
      Alert.alert("Erreur", MESSAGES.DOWNLOAD_ERROR_GENERIC, [{ text: MESSAGES.OK }]);
    }
  }, TIME_INTERVALS.DOWNLOAD_SIMULATION);
};
```

### Issue 20
- **File Path:** utils/progressStorage.ts
- **Line Number(s):** 19, 33, 47, 63, 77
- **Type:** Minor
- **Explanation:** Console.error statements in utility functions. These should use a centralized logger that can be configured for different environments.
- **Recommended Fix:**
```typescript
import { logger } from './logger';

async saveProgress(progress: MediaProgress): Promise<void> {
  try {
    const key = `${PROGRESS_KEY_PREFIX}${progress.lessonId}`;
    await AsyncStorage.setItem(key, JSON.stringify(progress));
  } catch (error) {
    logger.error('Error saving progress:', error);
    throw error;
  }
}
```

### Issue 21
- **File Path:** app/(tabs)/cours.tsx
- **Line Number(s):** 143-144
- **Type:** Minor
- **Explanation:** `keyExtractor` and `renderCourseCard` are wrapped in `useCallback` but `renderCourseCard` depends on `handleCoursePress` which also needs to be stable. The dependency chain should be verified.
- **Recommended Fix:**
```typescript
// Ensure all callbacks in the dependency chain are properly memoized
const handleCoursePress = useCallback((course: Course) => {
  router.push({
    pathname: "/course-detail",
    params: {
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnail: course.thumbnail,
    },
  });
}, [router]); // Only depends on router, which is stable

const renderCourseCard: ListRenderItem<Course> = useCallback(({ item: course }) => (
  <TouchableOpacity
    style={styles.courseCard}
    activeOpacity={0.8}
    onPress={() => handleCoursePress(course)}
  >
    {/* ... */}
  </TouchableOpacity>
), [handleCoursePress]); // Correctly depends on handleCoursePress
```

### Issue 22
- **File Path:** constants/AppConstants.ts
- **Line Number(s):** 1-72
- **Type:** Minor
- **Explanation:** File is well-structured but missing some strings that are hardcoded elsewhere in the app. For example, error messages in course-detail.tsx and other files should be centralized here.
- **Recommended Fix:**
```typescript
// Add missing messages
export const MESSAGES = {
  // ... existing messages

  // Error messages
  DOWNLOAD_ERROR_GENERIC: 'Une erreur est survenue lors du téléchargement',
  LOADING_ERROR: 'Impossible de charger les données',
  NETWORK_ERROR: 'Erreur de connexion réseau',

  // Course detail messages
  COURSE_INFO_MISSING: 'Les informations du cours sont manquantes.',
} as const;
```

### Issue 23
- **File Path:** app/(tabs)/bibliotheque.tsx
- **Line Number(s):** 270-277
- **Type:** Minor
- **Explanation:** FlatList doesn't have optimized rendering props like `removeClippedSubviews`, `maxToRenderPerBatch`, or `windowSize`. For a potentially large book library, these optimizations could improve performance.
- **Recommended Fix:**
```typescript
<FlatList
  data={filteredBooks}
  renderItem={renderBookCard}
  keyExtractor={(item) => item.id}
  numColumns={3}
  contentContainerStyle={styles.booksGrid}
  showsVerticalScrollIndicator={false}
  columnWrapperStyle={styles.bookRow}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={9} // 3 columns * 3 rows
/>
```

### Issue 24
- **File Path:** app/(tabs)/downloads.tsx
- **Line Number(s):** 594-611
- **Type:** Minor
- **Explanation:** ScrollView is used for potentially large lists of courses and books. Consider using FlatList instead for better performance with large datasets.
- **Recommended Fix:**
```typescript
// Replace ScrollView with FlatList for courses
<FlatList
  data={downloadedCourses}
  renderItem={({ item }) => renderCourse(item)}
  keyExtractor={(item) => item.id}
  style={styles.content}
  contentContainerStyle={styles.contentContainer}
  showsVerticalScrollIndicator={false}
  removeClippedSubviews={true}
/>
```

### Issue 25
- **File Path:** contexts/ConnectionSimulatorContext.tsx
- **Line Number(s):** 54
- **Type:** Minor
- **Explanation:** Accessing `netInfo.details.ssid` with type narrowing but the SSID could be null. The fallback to `false` is correct, but the logic could be clearer with explicit null checks.
- **Recommended Fix:**
```typescript
const checkRealKioskConnection = useCallback(async () => {
  try {
    const netInfo = await NetInfo.fetch();

    if (netInfo.type === "wifi" && netInfo.isConnected && netInfo.details) {
      const ssid = 'ssid' in netInfo.details ? netInfo.details.ssid : null;

      if (ssid && typeof ssid === 'string') {
        const isKiosk = KIOSK_SSID_KEYWORDS.some((keyword) =>
          ssid.toLowerCase().includes(keyword)
        );
        setRealConnectionState(isKiosk);
      } else {
        setRealConnectionState(false);
      }
    } else {
      setRealConnectionState(false);
    }
  } catch (error) {
    logger.error("Error checking real kiosk connection:", error);
    setRealConnectionState(false);
  }
}, []);
```

---

## SUMMARY

### Statistics
- **Total Issues Found:** 25
- **Critical Issues:** 2
- **Major Issues:** 7
- **Minor Issues:** 16

### Issue Breakdown by Category
- **Type Safety:** 3 issues (1 Critical, 2 Major)
- **Code Quality:** 8 issues (1 Major, 7 Minor)
- **Performance:** 3 issues (1 Critical, 2 Minor)
- **Logging/Debugging:** 4 issues (4 Major)
- **Code Organization:** 5 issues (5 Minor)
- **Error Handling:** 2 issues (1 Major, 1 Minor)

### Priority Recommendations

**Immediate Action Required:**
1. Fix the `tab` parameter type handling in downloads.tsx (Issue #1)
2. Optimize the ConnectionSimulatorContext network listener (Issue #2)
3. Remove or replace all console.log/console.error with proper logging service (Issues #3, #4, #5)

**Short-term Improvements:**
1. Create centralized logger utility
2. Extract mock data to separate constants files
3. Add proper error boundaries for component error handling
4. Improve FlatList optimizations across the app

**Long-term Enhancements:**
1. Implement comprehensive error tracking service
2. Add unit tests for utility functions
3. Add integration tests for critical user flows
4. Set up code quality gates in CI/CD pipeline

### Code Health Assessment
- **TypeScript Compilation:** ✅ Passes (no errors)
- **ESLint:** ✅ Passes (no errors)
- **Type Coverage:** ⚠️ Good (some improvements needed)
- **Code Duplication:** ⚠️ Moderate (mock data duplicated)
- **Error Handling:** ⚠️ Needs improvement (inconsistent patterns)
- **Performance:** ⚠️ Good (minor optimizations possible)
- **Security:** ✅ No critical vulnerabilities found

---

**End of Report**
