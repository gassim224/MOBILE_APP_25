// Central type definitions for the application

export interface UserProfile {
  studentName: string;
  schoolName: string;
  grade: string;
  studentId: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  gradeLevel: string; // e.g., "10ème Année", "11ème Année", "12ème Année"
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'audio';
  size: string;
  duration?: string;
  isDownloaded: boolean;
  isCompleted?: boolean;
  mediaUrl?: string;
}

export interface DownloadedCourse {
  id: string;
  title: string;
  thumbnail: string;
  lessons: Lesson[];
  downloadedAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  thumbnail: string;
  isDownloaded?: boolean;
}

export interface DownloadedBook {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  downloadedAt: string;
  pdfUrl?: string;
}

export interface MediaProgress {
  lessonId: string;
  position: number; // in milliseconds for audio/video, page number for PDF
  duration?: number; // total duration in milliseconds (for media only)
  lastUpdated: string;
  type: 'video' | 'audio' | 'pdf';
}

export interface CourseProgress {
  courseId: string;
  courseName: string;
  totalLessons: number;
  completedLessons: string[]; // Array of completed lesson IDs
  lastUpdated: string;
  notificationSent: boolean; // Track if completion notification was already sent
}

export type FilterTab = 'cours' | 'bibliotheque';

export type MediaType = 'video' | 'audio' | 'pdf';

// Route params types
export interface CourseDetailParams {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
}

export interface VideoPlayerParams {
  lessonId: string;
  lessonTitle: string;
  videoUrl: string;
}

export interface AudioPlayerParams {
  lessonId: string;
  lessonTitle: string;
  audioUrl: string;
}

export interface PdfReaderParams {
  itemId: string;
  itemTitle: string;
  pdfUrl: string;
  itemType: 'lesson' | 'book';
}
