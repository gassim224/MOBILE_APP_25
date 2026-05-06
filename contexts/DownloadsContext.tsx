import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DownloadedCourse, DownloadedBook, Lesson } from '@/types';
import { deleteFile, clearAllDownloads as clearAllDownloadedFiles } from '@/utils/fileDownloader';
import logger from '@/utils/Logger';

const DOWNLOADS_STORAGE_KEY = '@downloads';

interface DownloadsContextType {
  downloadedCourses: DownloadedCourse[];
  downloadedBooks: DownloadedBook[];
  addDownloadedCourse: (course: DownloadedCourse) => Promise<void>;
  addDownloadedBook: (book: DownloadedBook) => Promise<void>;
  removeCourse: (courseId: string) => Promise<void>;
  removeBook: (bookId: string) => Promise<void>;
  removeLesson: (courseId: string, lessonId: string) => Promise<void>;
  updateCourseProgress: (courseId: string, lessonId: string, isCompleted: boolean) => Promise<void>;
  /** Convenience: mark a lesson complete without needing the parent courseId.
   *  Used by player screens (video/audio/pdf) which only know the lessonId. */
  markLessonCompleteByLessonId: (lessonId: string) => Promise<void>;
  clearAllDownloads: () => Promise<void>;
  isLoading: boolean;
}

const DownloadsContext = createContext<DownloadsContextType | undefined>(undefined);

interface DownloadsData {
  courses: DownloadedCourse[];
  books: DownloadedBook[];
}

export const DownloadsProvider = ({ children }: { children: ReactNode }) => {
  const [downloadedCourses, setDownloadedCourses] = useState<DownloadedCourse[]>([]);
  const [downloadedBooks, setDownloadedBooks] = useState<DownloadedBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load downloads from AsyncStorage on mount
  useEffect(() => {
    loadDownloads();
  }, []);

  const loadDownloads = async () => {
    try {
      const data = await AsyncStorage.getItem(DOWNLOADS_STORAGE_KEY);
      if (data) {
        const parsed: DownloadsData = JSON.parse(data);
        setDownloadedCourses(parsed.courses || []);
        setDownloadedBooks(parsed.books || []);
      }
    } catch (error) {
      logger.error('Error loading downloads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDownloads = async (courses: DownloadedCourse[], books: DownloadedBook[]) => {
    try {
      const data: DownloadsData = { courses, books };
      await AsyncStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      logger.error('Error saving downloads:', error);
    }
  };

  const addDownloadedCourse = async (course: DownloadedCourse) => {
    try {
      // Log course details for debugging
      logger.info(`Adding course: ${course.title}`);
      logger.info(`Course lessons count: ${course.lessons.length}`);
      course.lessons.forEach((lesson, index) => {
        logger.info(`Lesson ${index + 1}: ${lesson.title}, type: ${lesson.type}, mediaUrl: ${lesson.mediaUrl}`);
      });

      // Check if course already exists
      const existingIndex = downloadedCourses.findIndex(c => c.id === course.id);
      let updatedCourses: DownloadedCourse[];

      if (existingIndex >= 0) {
        // Update existing course
        updatedCourses = [...downloadedCourses];
        updatedCourses[existingIndex] = course;
      } else {
        // Add new course
        updatedCourses = [...downloadedCourses, course];
      }

      setDownloadedCourses(updatedCourses);
      await saveDownloads(updatedCourses, downloadedBooks);
      logger.info(`Course downloaded: ${course.title}`);
    } catch (error) {
      logger.error('Error adding downloaded course:', error);
      throw error;
    }
  };

  const addDownloadedBook = async (book: DownloadedBook) => {
    try {
      // Check if book already exists
      const existingIndex = downloadedBooks.findIndex(b => b.id === book.id);
      let updatedBooks: DownloadedBook[];

      if (existingIndex >= 0) {
        // Update existing book
        updatedBooks = [...downloadedBooks];
        updatedBooks[existingIndex] = book;
      } else {
        // Add new book
        updatedBooks = [...downloadedBooks, book];
      }

      setDownloadedBooks(updatedBooks);
      await saveDownloads(downloadedCourses, updatedBooks);
      logger.info(`Book downloaded: ${book.title}`);
    } catch (error) {
      logger.error('Error adding downloaded book:', error);
      throw error;
    }
  };

  const removeCourse = async (courseId: string) => {
    try {
      // Find the course to delete its files
      const course = downloadedCourses.find(c => c.id === courseId);
      if (course) {
        // Delete all lesson files
        for (const lesson of course.lessons) {
          if (lesson.mediaUrl && !lesson.mediaUrl.startsWith('http')) {
            try {
              await deleteFile(lesson.mediaUrl);
            } catch (error) {
              logger.error(`Failed to delete file: ${lesson.mediaUrl}`, error);
            }
          }
        }
      }

      const updatedCourses = downloadedCourses.filter(c => c.id !== courseId);
      setDownloadedCourses(updatedCourses);
      await saveDownloads(updatedCourses, downloadedBooks);
      logger.info(`Course removed: ${courseId}`);
    } catch (error) {
      logger.error('Error removing course:', error);
      throw error;
    }
  };

  const removeBook = async (bookId: string) => {
    try {
      const updatedBooks = downloadedBooks.filter(b => b.id !== bookId);
      setDownloadedBooks(updatedBooks);
      await saveDownloads(downloadedCourses, updatedBooks);
      logger.info(`Book removed: ${bookId}`);
    } catch (error) {
      logger.error('Error removing book:', error);
      throw error;
    }
  };

  const removeLesson = async (courseId: string, lessonId: string) => {
    try {
      // Find the lesson to delete its file
      const course = downloadedCourses.find(c => c.id === courseId);
      if (course) {
        const lesson = course.lessons.find(l => l.id === lessonId);
        if (lesson && lesson.mediaUrl && !lesson.mediaUrl.startsWith('http')) {
          try {
            await deleteFile(lesson.mediaUrl);
          } catch (error) {
            logger.error(`Failed to delete file: ${lesson.mediaUrl}`, error);
          }
        }
      }

      const updatedCourses = downloadedCourses.map(course => {
        if (course.id === courseId) {
          const updatedLessons = course.lessons.filter(l => l.id !== lessonId);
          return { ...course, lessons: updatedLessons };
        }
        return course;
      }).filter(course => course.lessons.length > 0); // Remove courses with no lessons

      setDownloadedCourses(updatedCourses);
      await saveDownloads(updatedCourses, downloadedBooks);
      logger.info(`Lesson removed: ${lessonId} from course ${courseId}`);
    } catch (error) {
      logger.error('Error removing lesson:', error);
      throw error;
    }
  };

  const updateCourseProgress = async (courseId: string, lessonId: string, isCompleted: boolean) => {
    try {
      const updatedCourses = downloadedCourses.map(course => {
        if (course.id === courseId) {
          const updatedLessons = course.lessons.map(lesson => {
            if (lesson.id === lessonId) {
              return { ...lesson, isCompleted };
            }
            return lesson;
          });
          return { ...course, lessons: updatedLessons };
        }
        return course;
      });

      setDownloadedCourses(updatedCourses);
      await saveDownloads(updatedCourses, downloadedBooks);
    } catch (error) {
      logger.error('Error updating course progress:', error);
      throw error;
    }
  };

  /**
   * Find the parent course of a lesson and mark it complete. The progress bar
   * on the downloads screen reads `lesson.isCompleted` per lesson, so without
   * this call it stays at 0% even after a student finishes a video.
   */
  const markLessonCompleteByLessonId = async (lessonId: string) => {
    const parent = downloadedCourses.find(c => c.lessons.some(l => l.id === lessonId));
    if (!parent) return;
    const lesson = parent.lessons.find(l => l.id === lessonId);
    if (lesson?.isCompleted) return; // already done — no churn
    await updateCourseProgress(parent.id, lessonId, true);
  };

  const clearAllDownloads = async () => {
    try {
      // Delete all downloaded files from storage
      await clearAllDownloadedFiles();

      // Clear from context and AsyncStorage
      setDownloadedCourses([]);
      setDownloadedBooks([]);
      await AsyncStorage.removeItem(DOWNLOADS_STORAGE_KEY);
      logger.info('All downloads cleared');
    } catch (error) {
      logger.error('Error clearing downloads:', error);
      throw error;
    }
  };

  return (
    <DownloadsContext.Provider
      value={{
        downloadedCourses,
        downloadedBooks,
        addDownloadedCourse,
        addDownloadedBook,
        removeCourse,
        removeBook,
        removeLesson,
        updateCourseProgress,
        markLessonCompleteByLessonId,
        clearAllDownloads,
        isLoading,
      }}
    >
      {children}
    </DownloadsContext.Provider>
  );
};

export const useDownloads = () => {
  const context = useContext(DownloadsContext);
  if (context === undefined) {
    throw new Error('useDownloads must be used within a DownloadsProvider');
  }
  return context;
};
