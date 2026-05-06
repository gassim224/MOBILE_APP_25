// Central type definitions for the application

export interface UserProfile {
  // Required for analytics event payloads (Bonecole metrics PDF):
  id: string;          // backend StId — used as event.user_id
  schoolId: string;    // event.school_id
  role: 'student' | 'teacher' | 'admin'; // event.role
  // Display fields used across the app
  studentName: string;
  schoolName: string;
  grade: string;       // current view's grade — for teachers this is the active selection
  studentId: string;   // human-readable code (e.g., SCH017-0001)
  // Teacher metadata. Students get subjects=[] and gradeLevels=[grade].
  subjects?: string[];
  gradeLevels?: string[];
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
  sizeBytes?: number;
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
