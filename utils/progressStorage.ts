import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MediaProgress } from '@/types';
import { STORAGE_KEYS } from '@/constants/AppConstants';
import logger from '@/utils/Logger';

// Re-export MediaProgress for backward compatibility
export type { MediaProgress } from '@/types';

const PROGRESS_KEY_PREFIX = STORAGE_KEYS.MEDIA_PROGRESS_PREFIX;

export const progressStorage = {
  /**
   * Save progress for a lesson
   */
  async saveProgress(progress: MediaProgress): Promise<void> {
    try {
      const key = `${PROGRESS_KEY_PREFIX}${progress.lessonId}`;
      await AsyncStorage.setItem(key, JSON.stringify(progress));
    } catch (error) {
      logger.error('Error saving progress:', error);
      throw error;
    }
  },

  /**
   * Get progress for a lesson
   */
  async getProgress(lessonId: string): Promise<MediaProgress | null> {
    try {
      const key = `${PROGRESS_KEY_PREFIX}${lessonId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting progress:', error);
      return null;
    }
  },

  /**
   * Delete progress for a lesson
   */
  async deleteProgress(lessonId: string): Promise<void> {
    try {
      const key = `${PROGRESS_KEY_PREFIX}${lessonId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.error('Error deleting progress:', error);
      throw error;
    }
  },

  /**
   * Get all progress entries
   */
  async getAllProgress(): Promise<MediaProgress[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(key => key.startsWith(PROGRESS_KEY_PREFIX));
      const progressData = await AsyncStorage.multiGet(progressKeys);
      return progressData
        .map(([, value]) => (value ? JSON.parse(value) : null))
        .filter((item): item is MediaProgress => item !== null);
    } catch (error) {
      logger.error('Error getting all progress:', error);
      return [];
    }
  },

  /**
   * Clear all progress
   */
  async clearAllProgress(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const progressKeys = keys.filter(key => key.startsWith(PROGRESS_KEY_PREFIX));
      await AsyncStorage.multiRemove(progressKeys);
    } catch (error) {
      logger.error('Error clearing all progress:', error);
      throw error;
    }
  },
};
