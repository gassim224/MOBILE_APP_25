/**
 * Storage utility functions for calculating download sizes and device storage
 */

import { DownloadedCourse, DownloadedBook, Lesson } from '@/types';
import logger from '@/utils/Logger';

// Mock total device storage (in GB)
export const TOTAL_DEVICE_STORAGE_GB = 32;

// Convert MB to GB
const MB_TO_GB = 1024;

/**
 * Parse size string (e.g., "25 MB", "1.5 GB") to MB
 */
export function parseSizeToMB(sizeString: string): number {
  try {
    const match = sizeString.match(/(\d+(?:\.\d+)?)\s*(MB|GB)/i);
    if (!match) {
      logger.warn(`Could not parse size string: ${sizeString}`);
      return 0;
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    if (unit === 'GB') {
      return value * MB_TO_GB;
    }
    return value; // Already in MB
  } catch (error) {
    logger.error('Error parsing size string:', error);
    return 0;
  }
}

/**
 * Calculate total size of lessons in a course (in MB)
 */
export function calculateCourseSizeMB(course: DownloadedCourse): number {
  return course.lessons.reduce((total, lesson) => {
    return total + parseSizeToMB(lesson.size);
  }, 0);
}

/**
 * Calculate total size of all downloaded courses (in MB)
 */
export function calculateTotalCoursesSizeMB(courses: DownloadedCourse[]): number {
  return courses.reduce((total, course) => {
    return total + calculateCourseSizeMB(course);
  }, 0);
}

/**
 * Estimate book size (mock - assume average book is 5 MB)
 */
const AVERAGE_BOOK_SIZE_MB = 5;

export function calculateTotalBooksSizeMB(books: DownloadedBook[]): number {
  return books.length * AVERAGE_BOOK_SIZE_MB;
}

/**
 * Calculate total downloaded content size (in MB)
 */
export function calculateTotalDownloadedSizeMB(
  courses: DownloadedCourse[],
  books: DownloadedBook[]
): number {
  const coursesSizeMB = calculateTotalCoursesSizeMB(courses);
  const booksSizeMB = calculateTotalBooksSizeMB(books);
  return coursesSizeMB + booksSizeMB;
}

/**
 * Format size from MB to human-readable string
 */
export function formatSize(sizeMB: number): string {
  if (sizeMB < 1) {
    return `${Math.round(sizeMB * 1024)} Ko`;
  } else if (sizeMB < MB_TO_GB) {
    return `${Math.round(sizeMB)} Mo`;
  } else {
    return `${(sizeMB / MB_TO_GB).toFixed(2)} Go`;
  }
}

/**
 * Calculate storage usage percentage
 */
export function calculateStorageUsagePercentage(usedMB: number): number {
  const totalMB = TOTAL_DEVICE_STORAGE_GB * MB_TO_GB;
  return Math.min((usedMB / totalMB) * 100, 100);
}

/**
 * Get storage status object
 */
export interface StorageStatus {
  usedMB: number;
  usedFormatted: string;
  totalGB: number;
  totalFormatted: string;
  usagePercentage: number;
  freeFormatted: string;
}

export function getStorageStatus(
  courses: DownloadedCourse[],
  books: DownloadedBook[]
): StorageStatus {
  const usedMB = calculateTotalDownloadedSizeMB(courses, books);
  const totalMB = TOTAL_DEVICE_STORAGE_GB * MB_TO_GB;
  const freeMB = Math.max(totalMB - usedMB, 0);

  return {
    usedMB,
    usedFormatted: formatSize(usedMB),
    totalGB: TOTAL_DEVICE_STORAGE_GB,
    totalFormatted: `${TOTAL_DEVICE_STORAGE_GB} Go`,
    usagePercentage: calculateStorageUsagePercentage(usedMB),
    freeFormatted: formatSize(freeMB),
  };
}
