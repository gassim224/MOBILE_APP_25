import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendCourseCompletionNotification } from './notificationService';
import { CourseProgress } from '@/types';
import { STORAGE_KEYS } from '@/constants/AppConstants';
import logger from '@/utils/Logger';

const COURSE_PROGRESS_KEY = STORAGE_KEYS.COURSE_PROGRESS_PREFIX;

/**
 * Get course progress from storage
 */
export async function getCourseProgress(courseId: string): Promise<CourseProgress | null> {
  try {
    const data = await AsyncStorage.getItem(`${COURSE_PROGRESS_KEY}${courseId}`);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    logger.error('Error getting course progress:', error);
    return null;
  }
}

/**
 * Initialize course progress
 */
export async function initializeCourseProgress(
  courseId: string,
  courseName: string,
  totalLessons: number
): Promise<void> {
  try {
    const existing = await getCourseProgress(courseId);
    if (!existing) {
      const progress: CourseProgress = {
        courseId,
        courseName,
        totalLessons,
        completedLessons: [],
        lastUpdated: new Date().toISOString(),
        notificationSent: false,
      };
      await AsyncStorage.setItem(`${COURSE_PROGRESS_KEY}${courseId}`, JSON.stringify(progress));
    }
  } catch (error) {
    logger.error('Error initializing course progress:', error);
  }
}

/**
 * Mark a lesson as completed and check if course is complete
 */
export async function markLessonCompleted(
  courseId: string,
  courseName: string,
  lessonId: string,
  totalLessons: number
): Promise<boolean> {
  try {
    let progress = await getCourseProgress(courseId);

    if (!progress) {
      // Initialize if doesn't exist
      progress = {
        courseId,
        courseName,
        totalLessons,
        completedLessons: [],
        lastUpdated: new Date().toISOString(),
        notificationSent: false,
      };
    }

    // Add lesson to completed list if not already there
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      progress.lastUpdated = new Date().toISOString();

      // Check if course is now complete
      const isCourseComplete = progress.completedLessons.length >= totalLessons;

      if (isCourseComplete && !progress.notificationSent) {
        // Send completion notification
        await sendCourseCompletionNotification(courseName);
        progress.notificationSent = true;
      }

      // Save updated progress
      await AsyncStorage.setItem(`${COURSE_PROGRESS_KEY}${courseId}`, JSON.stringify(progress));

      return isCourseComplete;
    }

    return progress.completedLessons.length >= totalLessons;
  } catch (error) {
    logger.error('Error marking lesson completed:', error);
    return false;
  }
}

/**
 * Check if a lesson is marked as completed
 */
export async function isLessonCompleted(
  courseId: string,
  lessonId: string
): Promise<boolean> {
  try {
    const progress = await getCourseProgress(courseId);
    return progress ? progress.completedLessons.includes(lessonId) : false;
  } catch (error) {
    logger.error('Error checking lesson completion:', error);
    return false;
  }
}

/**
 * Get course completion percentage
 */
export async function getCourseCompletionPercentage(courseId: string): Promise<number> {
  try {
    const progress = await getCourseProgress(courseId);
    if (!progress || progress.totalLessons === 0) {
      return 0;
    }
    return Math.round((progress.completedLessons.length / progress.totalLessons) * 100);
  } catch (error) {
    logger.error('Error getting course completion percentage:', error);
    return 0;
  }
}

/**
 * Reset course progress (useful for testing or retaking a course)
 */
export async function resetCourseProgress(courseId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${COURSE_PROGRESS_KEY}${courseId}`);
  } catch (error) {
    logger.error('Error resetting course progress:', error);
  }
}
