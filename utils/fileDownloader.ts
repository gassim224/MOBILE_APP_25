/**
 * File download utility for downloading media files to local storage
 */

import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/AppConstants';
import logger from './Logger';

export interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progress: number; // 0-100
}

/**
 * Download a file from URL to local storage
 */
export async function downloadFile(
  url: string,
  fileName: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<string> {
  try {
    // Create downloads directory if it doesn't exist
    const downloadDir = `${FileSystem.documentDirectory}downloads/`;
    const dirInfo = await FileSystem.getInfoAsync(downloadDir);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
      logger.info('Created downloads directory');
    }

    // Sanitize filename
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const localUri = `${downloadDir}${sanitizedFileName}`;

    // Check if file already exists
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      logger.info(`File already exists: ${localUri}`);
      return localUri;
    }

    // Download the file
    logger.info(`Downloading file from: ${url}`);
    logger.info(`Saving to: ${localUri}`);

    // Get auth token for the request
    const token = await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // First, verify the file is accessible (HEAD request)
    try {
      const checkResponse = await fetch(url, { method: 'HEAD', headers });
      logger.info(`File check response: ${checkResponse.status} for ${url}`);
      if (!checkResponse.ok) {
        throw new Error(`File not available: server returned ${checkResponse.status} for ${url}`);
      }
    } catch (headError: any) {
      // If HEAD fails, try GET to check — some servers don't support HEAD
      if (headError.message?.includes('File not available')) {
        throw headError;
      }
      logger.warn(`HEAD request failed, will attempt download directly: ${headError.message}`);
    }

    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      localUri,
      { headers },
      (downloadProgress) => {
        const progress = {
          totalBytesWritten: downloadProgress.totalBytesWritten,
          totalBytesExpectedToWrite: downloadProgress.totalBytesExpectedToWrite,
          progress: (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100,
        };
        onProgress?.(progress);
      }
    );

    const result = await downloadResumable.downloadAsync();

    if (!result) {
      throw new Error('Download failed - no result returned');
    }

    // Verify downloaded file is valid (not a 404 HTML page saved as media)
    if (result.status && result.status >= 400) {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
      throw new Error(`Download failed with status ${result.status} for ${url}`);
    }

    const downloadedFileInfo = await FileSystem.getInfoAsync(localUri);
    if (!downloadedFileInfo.exists || (downloadedFileInfo.size && downloadedFileInfo.size < 1000)) {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
      throw new Error(`Downloaded file is too small or missing — likely a server error for ${url}`);
    }

    logger.info(`File downloaded successfully: ${result.uri} (${downloadedFileInfo.size} bytes)`);
    return result.uri;
  } catch (error) {
    logger.error('Error downloading file:', error);
    throw error;
  }
}

/**
 * Delete a downloaded file
 */
export async function deleteFile(localUri: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(localUri);
      logger.info(`File deleted: ${localUri}`);
    }
  } catch (error) {
    logger.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Get file info (size, exists, etc.)
 */
export async function getFileInfo(localUri: string): Promise<FileSystem.FileInfo> {
  return await FileSystem.getInfoAsync(localUri);
}

/**
 * Calculate total size of downloaded files
 */
export async function getDownloadedFilesSize(): Promise<number> {
  try {
    const downloadDir = `${FileSystem.documentDirectory}downloads/`;
    const dirInfo = await FileSystem.getInfoAsync(downloadDir);

    if (!dirInfo.exists) {
      return 0;
    }

    const files = await FileSystem.readDirectoryAsync(downloadDir);
    let totalSize = 0;

    for (const file of files) {
      const fileUri = `${downloadDir}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists && !fileInfo.isDirectory) {
        totalSize += fileInfo.size || 0;
      }
    }

    return totalSize;
  } catch (error) {
    logger.error('Error calculating downloaded files size:', error);
    return 0;
  }
}

/**
 * Clear all downloaded files
 */
export async function clearAllDownloads(): Promise<void> {
  try {
    const downloadDir = `${FileSystem.documentDirectory}downloads/`;
    const dirInfo = await FileSystem.getInfoAsync(downloadDir);

    if (dirInfo.exists) {
      await FileSystem.deleteAsync(downloadDir, { idempotent: true });
      logger.info('All downloads cleared');
    }
  } catch (error) {
    logger.error('Error clearing downloads:', error);
    throw error;
  }
}

/**
 * Generate a unique filename based on lesson ID and type
 */
export function generateFileName(lessonId: string, lessonTitle: string, type: 'video' | 'audio' | 'pdf', originalFilename?: string): string {
  // Preserve original extension when available (e.g. .m4a, .wav instead of forcing .mp3)
  let extension: string;
  if (originalFilename) {
    const lastDot = originalFilename.lastIndexOf('.');
    if (lastDot >= 0) {
      extension = originalFilename.substring(lastDot + 1).toLowerCase();
    } else {
      extension = type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'pdf';
    }
  } else {
    extension = type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'pdf';
  }
  const sanitizedTitle = lessonTitle.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
  return `${lessonId}_${sanitizedTitle}.${extension}`;
}
