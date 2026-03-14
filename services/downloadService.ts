/**
 * Download Service
 * Manages local storage of downloaded courses and books
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '@/utils/Logger';
import { DownloadedCourse, DownloadedBook, Lesson } from '@/types';

// Storage keys
export const DOWNLOADS_COURSES_KEY = "downloaded_courses";
export const DOWNLOADS_BOOKS_KEY = "downloaded_books";

/**
 * Get all downloaded courses
 */
export async function getDownloadedCourses(): Promise<DownloadedCourse[]> {
  try {
    const data = await AsyncStorage.getItem(DOWNLOADS_COURSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    logger.error("Error getting downloaded courses:", error);
    return [];
  }
}

/**
 * Get all downloaded books
 */
export async function getDownloadedBooks(): Promise<DownloadedBook[]> {
  try {
    const data = await AsyncStorage.getItem(DOWNLOADS_BOOKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    logger.error("Error getting downloaded books:", error);
    return [];
  }
}

/**
 * Save a downloaded course (or update existing)
 */
export async function saveDownloadedCourse(course: DownloadedCourse): Promise<void> {
  try {
    const courses = await getDownloadedCourses();
    const existingIndex = courses.findIndex(c => c.id === course.id);
    
    if (existingIndex >= 0) {
      // Update existing course
      courses[existingIndex] = course;
    } else {
      // Add new course
      courses.push(course);
    }
    
    await AsyncStorage.setItem(DOWNLOADS_COURSES_KEY, JSON.stringify(courses));
    logger.info(`Course saved: ${course.title}`);
  } catch (error) {
    logger.error("Error saving downloaded course:", error);
    throw error;
  }
}

/**
 * Add a lesson to an existing downloaded course
 */
export async function addLessonToCourse(courseId: string, lesson: Lesson): Promise<void> {
  try {
    const courses = await getDownloadedCourses();
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex >= 0) {
      const existingLessonIndex = courses[courseIndex].lessons.findIndex(l => l.id === lesson.id);
      
      if (existingLessonIndex >= 0) {
        // Update existing lesson
        courses[courseIndex].lessons[existingLessonIndex] = lesson;
      } else {
        // Add new lesson
        courses[courseIndex].lessons.push(lesson);
      }
      
      await AsyncStorage.setItem(DOWNLOADS_COURSES_KEY, JSON.stringify(courses));
      logger.info(`Lesson added to course ${courseId}: ${lesson.title}`);
    } else {
      logger.warn(`Course ${courseId} not found for adding lesson`);
    }
  } catch (error) {
    logger.error("Error adding lesson to course:", error);
    throw error;
  }
}

/**
 * Save a downloaded book (or update existing)
 */
export async function saveDownloadedBook(book: DownloadedBook): Promise<void> {
  try {
    const books = await getDownloadedBooks();
    const existingIndex = books.findIndex(b => b.id === book.id);
    
    if (existingIndex >= 0) {
      // Update existing book
      books[existingIndex] = book;
    } else {
      // Add new book
      books.push(book);
    }
    
    await AsyncStorage.setItem(DOWNLOADS_BOOKS_KEY, JSON.stringify(books));
    logger.info(`Book saved: ${book.title}`);
  } catch (error) {
    logger.error("Error saving downloaded book:", error);
    throw error;
  }
}

/**
 * Remove a downloaded course
 */
export async function removeDownloadedCourse(courseId: string): Promise<void> {
  try {
    const courses = await getDownloadedCourses();
    const filteredCourses = courses.filter(c => c.id !== courseId);
    await AsyncStorage.setItem(DOWNLOADS_COURSES_KEY, JSON.stringify(filteredCourses));
    logger.info(`Course removed: ${courseId}`);
  } catch (error) {
    logger.error("Error removing downloaded course:", error);
    throw error;
  }
}

/**
 * Remove a downloaded book
 */
export async function removeDownloadedBook(bookId: string): Promise<void> {
  try {
    const books = await getDownloadedBooks();
    const filteredBooks = books.filter(b => b.id !== bookId);
    await AsyncStorage.setItem(DOWNLOADS_BOOKS_KEY, JSON.stringify(filteredBooks));
    logger.info(`Book removed: ${bookId}`);
  } catch (error) {
    logger.error("Error removing downloaded book:", error);
    throw error;
  }
}

/**
 * Check if a course is downloaded
 */
export async function isCourseDownloaded(courseId: string): Promise<boolean> {
  const courses = await getDownloadedCourses();
  return courses.some(c => c.id === courseId);
}

/**
 * Check if a book is downloaded
 */
export async function isBookDownloaded(bookId: string): Promise<boolean> {
  const books = await getDownloadedBooks();
  return books.some(b => b.id === bookId);
}

/**
 * Mark a lesson as completed
 */
export async function markLessonCompleted(courseId: string, lessonId: string, completed: boolean = true): Promise<void> {
  try {
    const courses = await getDownloadedCourses();
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex >= 0) {
      const lessonIndex = courses[courseIndex].lessons.findIndex(l => l.id === lessonId);
      
      if (lessonIndex >= 0) {
        courses[courseIndex].lessons[lessonIndex].isCompleted = completed;
        await AsyncStorage.setItem(DOWNLOADS_COURSES_KEY, JSON.stringify(courses));
        logger.info(`Lesson ${lessonId} marked as ${completed ? 'completed' : 'incomplete'}`);
      }
    }
  } catch (error) {
    logger.error("Error marking lesson completed:", error);
    throw error;
  }
}

/**
 * Get download statistics
 */
export async function getDownloadStats(): Promise<{
  totalCourses: number;
  totalBooks: number;
  totalLessons: number;
  completedLessons: number;
}> {
  const courses = await getDownloadedCourses();
  const books = await getDownloadedBooks();
  
  let totalLessons = 0;
  let completedLessons = 0;
  
  courses.forEach(course => {
    totalLessons += course.lessons.length;
    completedLessons += course.lessons.filter(l => l.isCompleted).length;
  });
  
  return {
    totalCourses: courses.length,
    totalBooks: books.length,
    totalLessons,
    completedLessons,
  };
}

/**
 * Format current date/time for download timestamp
 */
export function getDownloadTimestamp(): string {
  return "Aujourd'hui";
}

export default {
  getDownloadedCourses,
  getDownloadedBooks,
  saveDownloadedCourse,
  saveDownloadedBook,
  addLessonToCourse,
  removeDownloadedCourse,
  removeDownloadedBook,
  isCourseDownloaded,
  isBookDownloaded,
  markLessonCompleted,
  getDownloadStats,
  getDownloadTimestamp,
};
