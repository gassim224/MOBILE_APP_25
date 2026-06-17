/**
 * API Service Layer
 * Handles all HTTP requests to the Raspberry Pi backend
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/AppConstants';
import logger from '@/utils/Logger';

// API Configuration - Hardcoded for production builds
// Note: Expo env variables are embedded at build time, but we hardcode for reliability
const API_BASE_URL = 'http://10.42.0.1:8001/user';
const CLOUD_BASE_URL = 'http://10.42.0.1:8001/cloud';

// API Response Types
// Actual Login API response format. Role / Subjects / GradeLevels are present
// when the kiosk authenticates a teacher; absent for students (the kiosk omits
// them rather than sending nulls). Mobile treats absent === student.
export interface LoginApiResponse {
  status: boolean;
  message: string;
  token?: string;
  data?: {
    StId: string;
    fullName: string;
    StudentEmail: string;
    SchoolId: string;
    StudentStatus: boolean;
    Grade: string;
    StudentId: string;
    SchoolName: string;
    Role?: 'student' | 'teacher';
    Subjects?: string[];
    GradeLevels?: string[];
  };
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    studentStatus: boolean;
    grade: string;
    studentId: string;
    schoolName: string;
    schoolId: string;
    role: 'student' | 'teacher';
    subjects: string[];      // teacher: list of taught subjects; student: []
    gradeLevels: string[];   // teacher: list of assigned classes; student: [grade]
  };
  message?: string;
}

export interface HomeResponse {
  success: boolean;
  data?: {
    studentName: string;
    grade: string;
    school: string;
    recentCourses?: ApiCourse[];
    announcements?: string[];
  };
  message?: string;
}

export interface ApiSubject {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  grade?: string;
}

// Actual API response format for subjects
export interface SubjectsApiResponse {
  status: boolean;
  message: string;
  data: {
    Section: string;
    Grade: string;
    Subjects: string[];
  };
}

export interface SubjectsResponse {
  success: boolean;
  subjects?: ApiSubject[];
  section?: string;
  grade?: string;
  message?: string;
}

// Raw video item from API (within chapters)
export interface ApiVideoRaw {
  name: string;
  path: string;
  duration?: number; // in seconds
  size?: number; // in bytes
}

// Videos API response - grouped by chapters
export interface SubjectVideosApiResponse {
  status: boolean;
  message: string;
  data: {
    [chapter: string]: ApiVideoRaw[];
  };
}

export interface ApiVideo {
  id: string;
  title: string;
  filename: string;
  duration?: string;
  durationSeconds?: number;
  sizeBytes?: number;
  chapter?: string;
}

export interface SubjectVideosResponse {
  success: boolean;
  videos?: ApiVideo[];
  message?: string;
}

// Raw PDF item from API
export interface ApiPdfRaw {
  name: string;
  path: string;
  size?: number; // in bytes
}

// PDFs API response
export interface SubjectPdfsApiResponse {
  status: boolean;
  message: string;
  data: ApiPdfRaw[];
}

export interface ApiPdf {
  id: string;
  title: string;
  filename: string;
  sizeBytes?: number;
}

export interface SubjectPdfsResponse {
  success: boolean;
  pdfs?: ApiPdf[];
  message?: string;
}

// Past Papers API response
export interface SubjectPastPapersApiResponse {
  status: boolean;
  message: string;
  data: ApiPdfRaw[];
}

export interface ApiPastPaper {
  id: string;
  title: string;
  filename: string;
  sizeBytes?: number;
}

export interface SubjectPastPapersResponse {
  success: boolean;
  pastPapers?: ApiPastPaper[];
  message?: string;
}

// Raw book item from API
export interface ApiBookRaw {
  name: string;
  author: string;
  path: string;
  size?: number; // in bytes
}

// Library API response
export interface LibraryApiResponse {
  status: boolean;
  message: string;
  data: {
    totalBooks: number;
    page: number;
    totalPages: number;
    books: ApiBookRaw[];
  };
}

export interface ApiBook {
  id: string;
  title: string;
  author: string;
  filename: string;
}

export interface LibraryResponse {
  success: boolean;
  books?: ApiBook[];
  totalBooks?: number;
  totalPages?: number;
  currentPage?: number;
  message?: string;
}

export interface ApiCourse {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  grade?: string;
}

// Error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseData?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper to get auth token
async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
  } catch (error) {
    logger.error('Error getting auth token:', error);
    return null;
  }
}

// Helper to make authenticated requests
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/x-www-form-urlencoded',
    ...options.headers,
  };

  if (requiresAuth) {
    const token = await getAuthToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    logger.info(`API Request: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle non-JSON responses (like file downloads)
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new ApiError(`HTTP error ${response.status}`, response.status);
      }
      return response as unknown as T;
    }

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || `HTTP error ${response.status}`,
        response.status,
        data
      );
    }

    logger.info(`API Response: ${response.status}`);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('API Request failed:', error);
    throw new ApiError(
      error instanceof Error ? error.message : 'Network request failed'
    );
  }
}

// Auth API
export const AuthAPI = {
  /**
   * Login with email and password
   * @param email User email
   * @param password User password
   * @param duration Session duration in minutes
   */
  async login(email: string, password: string, duration: number = 51): Promise<LoginResponse> {
    const body = new URLSearchParams({
      email,
      password,
      duration: duration.toString(),
    }).toString();

    const url = `${API_BASE_URL}/auth/login`;
    
    try {
      logger.info(`Login attempt for: ${email} to URL: ${url}`);
      
      // Use XMLHttpRequest for better Android local network compatibility
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.timeout = 30000; // 30 second timeout
        
        xhr.onload = () => {
          const responseData = xhr.responseText;
          resolve(new Response(responseData, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: { 'Content-Type': 'application/json' }
          }));
        };
        
        xhr.onerror = () => {
          reject(new Error('Network request failed'));
        };
        
        xhr.ontimeout = () => {
          reject(new Error('Request timeout'));
        };
        
        xhr.send(body);
      });

      // Check if response is OK first
      if (!response.ok) {
        // Try to get error message from response
        try {
          const errorData = await response.json();
          logger.info('Login failed response:', JSON.stringify(errorData));
          
          // Return user-friendly error for wrong credentials
          if (response.status === 401 || response.status === 400) {
            return {
              success: false,
              message: errorData.message || "Identifiant ou mot de passe incorrect",
            };
          }
          
          return {
            success: false,
            message: errorData.message || `Erreur serveur (${response.status})`,
          };
        } catch {
          return {
            success: false,
            message: `Erreur serveur (${response.status})`,
          };
        }
      }

      const data: LoginApiResponse = await response.json();
      logger.info('Login API raw response:', JSON.stringify(data));

      // API returns { status: true, message, token, data: {...} }
      if (data.status && data.token) {
        // Store token
        await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, data.token);
        logger.info('Token stored successfully');

        // Transform user data to our format. Role defaults to 'student' so
        // older kiosks (that don't yet emit Role) keep working unchanged.
        const role: 'student' | 'teacher' = data.data?.Role === 'teacher' ? 'teacher' : 'student';
        const user: LoginResponse['user'] = data.data ? {
          id: data.data.StId,
          fullName: data.data.fullName,
          email: data.data.StudentEmail,
          studentStatus: data.data.StudentStatus,
          grade: data.data.Grade,
          studentId: data.data.StudentId,
          schoolName: data.data.SchoolName,
          schoolId: data.data.SchoolId,
          role,
          subjects: Array.isArray(data.data.Subjects) ? data.data.Subjects : [],
          // Teachers carry their full assigned-class list. Students get a
          // single-element array containing their one grade so consumers can
          // treat both roles uniformly.
          gradeLevels: Array.isArray(data.data.GradeLevels) && data.data.GradeLevels.length > 0
            ? data.data.GradeLevels
            : data.data.Grade ? [data.data.Grade] : [],
        } : undefined;

        return {
          success: true,
          token: data.token,
          user,
          message: data.message,
        };
      }

      // Login failed - wrong credentials or other issue
      return {
        success: false,
        message: data.message || "Identifiant ou mot de passe incorrect",
      };
    } catch (error) {
      logger.error('Login API error:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.message === 'Request timeout' || error.name === 'AbortError') {
          throw new ApiError('La connexion a expiré. Vérifiez votre connexion WiFi Bonecole.');
        }
        if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
          throw new ApiError('Impossible de se connecter au serveur. Vérifiez que vous êtes connecté au WiFi Bonecole.');
        }
        if (error.message.includes('timeout')) {
          throw new ApiError('La connexion a expiré. Le serveur ne répond pas.');
        }
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Erreur de connexion'
      );
    }
  },

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
  },
};

// Helper: append ?grade= to a path. Used so teachers can override their default
// grade on every content endpoint. Students pass undefined; the kiosk ignores
// query overrides for non-teacher tokens anyway.
function withGrade(path: string, grade?: string | null): string {
  if (!grade) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}grade=${encodeURIComponent(grade)}`;
}

/**
 * Natural-sort comparator for lesson identifiers whose leading prefix is a
 * dotted number sequence (e.g. "0", "1.1", "1.2", "1.10", "2.1"). Designed
 * to be fed the kiosk filename (e.g. "_1.2 Introduction.mp4") so chapter
 * order survives editorial title changes — falls back gracefully for plain
 * titles like "1.2 Introduction".
 *
 * - Strips any directory prefix (takes the basename only).
 * - Tolerates a single leading underscore before the number ("_1.2 …").
 * - Splits the dotted prefix on '.' and compares each segment numerically,
 *   so "1.10" sorts AFTER "1.2" instead of between "1.1" and "1.2".
 * - Numbered items sort before unnumbered ones; ties fall back to
 *   French-locale string compare on the original input.
 */
export function compareLessonsByPrefix(a: string, b: string): number {
  const re = /^_?(\d+(?:\.\d+)*)/;
  const baseA = a.split(/[\\/]/).pop() ?? a;
  const baseB = b.split(/[\\/]/).pop() ?? b;
  const ma = baseA.match(re)?.[1];
  const mb = baseB.match(re)?.[1];
  if (ma && mb) {
    const partsA = ma.split('.').map(p => parseInt(p, 10) || 0);
    const partsB = mb.split('.').map(p => parseInt(p, 10) || 0);
    const len = Math.max(partsA.length, partsB.length);
    for (let i = 0; i < len; i++) {
      const da = partsA[i] ?? 0;
      const db = partsB[i] ?? 0;
      if (da !== db) return da - db;
    }
  } else if (ma && !mb) {
    return -1;  // numbered items come before unnumbered
  } else if (!ma && mb) {
    return 1;
  }
  return a.localeCompare(b, 'fr');
}

// Student API. The `grade` parameter is optional; supply it for teachers who
// have multiple assigned grades. The mobile screens read this from
// ActiveGradeContext (or getActiveGradeForApi).
// Stable content id derived from grade + subject + file path. Positional
// indexes (paper_0, paper_1…) collide across subjects and shift whenever the
// kiosk adds or removes a file, which corrupts per-content analytics
// (distinct user/content pairs), the consumed-once dedup flags, and saved
// reading/playback progress. The path is the kiosk's unique key; hash it so
// the id stays short enough for the events table's 64-char content_id column.
function stableContentId(prefix: string, subjectName: string, grade: string | null | undefined, path: string): string {
  const input = `${grade || ''}|${subjectName}|${path}`;
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return `${prefix}_${h.toString(36)}`;
}

export const StudentAPI = {
  /**
   * Get home screen data
   */
  async getHome(grade?: string | null): Promise<HomeResponse> {
    return makeRequest<HomeResponse>(withGrade('/student/home', grade));
  },

  /**
   * Get all subjects for the student's class (or teacher's selected grade)
   */
  async getSubjects(grade?: string | null): Promise<SubjectsResponse> {
    const rawResponse = await makeRequest<SubjectsApiResponse>(withGrade('/student/subjects', grade));
    
    logger.info('Subjects API raw response:', JSON.stringify(rawResponse));
    
    // Transform the actual API response to our expected format
    if (rawResponse.status && rawResponse.data?.Subjects) {
      const subjects: ApiSubject[] = rawResponse.data.Subjects.map((subjectName, index) => ({
        id: `subject_${index}_${subjectName.toLowerCase().replace(/\s+/g, '_')}`,
        name: subjectName,
        description: '',
        grade: rawResponse.data.Grade,
      }));
      
      return {
        success: true,
        subjects,
        section: rawResponse.data.Section,
        grade: rawResponse.data.Grade,
        message: rawResponse.message,
      };
    }
    
    return {
      success: false,
      message: rawResponse.message || 'Failed to fetch subjects',
    };
  },

  /**
   * Get videos for a specific subject
   * @param subjectName Name of the subject (e.g., "Français")
   */
  async getSubjectVideos(subjectName: string, grade?: string | null): Promise<SubjectVideosResponse> {
    const encodedSubject = encodeURIComponent(subjectName);
    const rawResponse = await makeRequest<SubjectVideosApiResponse>(withGrade(`/student/subject-videos/${encodedSubject}`, grade));
    
    logger.info('Videos API raw response:', JSON.stringify(rawResponse));
    
    if (rawResponse.status && rawResponse.data) {
      // Flatten the chapter-grouped videos into a single array
      const videos: ApiVideo[] = [];

      for (const [chapter, chapterVideos] of Object.entries(rawResponse.data)) {
        if (Array.isArray(chapterVideos)) {
          for (const video of chapterVideos) {
            // Convert duration from seconds to readable format
            let durationStr: string | undefined;
            if (typeof video.duration === 'number' && !isNaN(video.duration) && video.duration > 0) {
              const minutes = Math.floor(video.duration / 60);
              const seconds = video.duration % 60;
              durationStr = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes} min`;
            }
            
            videos.push({
              id: stableContentId('video', subjectName, grade, video.path),
              title: video.name,
              filename: video.path,
              duration: durationStr,
              durationSeconds: video.duration,
              sizeBytes: video.size,
              chapter,
            });
          }
        }
      }
      
      // Sort by filename so the kiosk's "_1.2 Foo.mp4" prefix drives ordering;
      // titles can be edited or omit the chapter number, filenames cannot.
      videos.sort((a, b) => compareLessonsByPrefix(a.filename || a.title, b.filename || b.title));

      return {
        success: true,
        videos,
        message: rawResponse.message,
      };
    }
    
    return {
      success: false,
      message: rawResponse.message || 'Failed to fetch videos',
    };
  },

  /**
   * Get PDFs for a specific subject
   * @param subjectName Name of the subject (e.g., "Français")
   */
  async getSubjectPdfs(subjectName: string, grade?: string | null): Promise<SubjectPdfsResponse> {
    const encodedSubject = encodeURIComponent(subjectName);
    const rawResponse = await makeRequest<SubjectPdfsApiResponse>(withGrade(`/student/subject-pdf/${encodedSubject}`, grade));
    
    logger.info('PDFs API raw response:', JSON.stringify(rawResponse));
    
    if (rawResponse.status && rawResponse.data) {
      const pdfs: ApiPdf[] = rawResponse.data.map((pdf) => ({
        id: stableContentId('pdf', subjectName, grade, pdf.path),
        title: pdf.name,
        filename: pdf.path,
        sizeBytes: pdf.size,
      }));
      pdfs.sort((a, b) => compareLessonsByPrefix(a.filename || a.title, b.filename || b.title));

      return {
        success: true,
        pdfs,
        message: rawResponse.message,
      };
    }

    return {
      success: false,
      message: rawResponse.message || 'Failed to fetch PDFs',
    };
  },

  /**
   * Get past papers for a specific subject
   * @param subjectName Name of the subject (e.g., "Français")
   */
  async getSubjectPastPapers(subjectName: string, grade?: string | null): Promise<SubjectPastPapersResponse> {
    const encodedSubject = encodeURIComponent(subjectName);
    const rawResponse = await makeRequest<SubjectPastPapersApiResponse>(withGrade(`/student/subject-pastPaper/${encodedSubject}`, grade));
    
    logger.info('Past Papers API raw response:', JSON.stringify(rawResponse));
    
    if (rawResponse.status && rawResponse.data) {
      const pastPapers: ApiPastPaper[] = rawResponse.data.map((paper) => ({
        id: stableContentId('paper', subjectName, grade, paper.path),
        title: paper.name,
        filename: paper.path,
        sizeBytes: paper.size,
      }));
      pastPapers.sort((a, b) => compareLessonsByPrefix(a.filename || a.title, b.filename || b.title));

      return {
        success: true,
        pastPapers,
        message: rawResponse.message,
      };
    }
    
    return {
      success: false,
      message: rawResponse.message || 'Failed to fetch past papers',
    };
  },

  /**
   * Get library books
   * @param search Optional search query
   * @param page Optional page number for pagination
   */
  async getLibraryBooks(search?: string, page?: number): Promise<LibraryResponse> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (page) params.append('page', page.toString());
    
    const queryString = params.toString();
    const endpoint = `/student/library${queryString ? `?${queryString}` : ''}`;
    
    const rawResponse = await makeRequest<LibraryApiResponse>(endpoint);
    
    logger.info('Library API raw response:', JSON.stringify(rawResponse));
    
    if (rawResponse.status && rawResponse.data) {
      const currentPage = rawResponse.data.page || 1;
      const books: ApiBook[] = rawResponse.data.books.map((book, index) => ({
        id: `book_p${currentPage}_${index}`,
        title: book.name,
        author: book.author,
        filename: book.path,
      }));
      books.sort((a, b) => compareLessonsByPrefix(a.filename || a.title, b.filename || b.title));

      return {
        success: true,
        books,
        totalBooks: rawResponse.data.totalBooks,
        totalPages: rawResponse.data.totalPages,
        currentPage: rawResponse.data.page,
        message: rawResponse.message,
      };
    }
    
    return {
      success: false,
      message: rawResponse.message || 'Failed to fetch books',
    };
  },
};

// Download API
export const DownloadAPI = {
  /**
   * Get video download URL
   * @param subjectFolder Subject folder name
   * @param filename Video filename
   */
  getVideoUrl(subjectFolder: string, filePath: string): string {
    const encodedFolder = encodeURIComponent(subjectFolder);
    const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
    const url = `${API_BASE_URL}/student/download-video/${encodedFolder}/${encodedPath}`;
    logger.info(`[DownloadAPI] Video URL: ${url}`);
    return url;
  },

  /**
   * Get PDF download URL
   * @param subjectFolder Subject folder name
   * @param filePath PDF file path (may contain subdirectories)
   */
  getPdfUrl(subjectFolder: string, filePath: string): string {
    const encodedFolder = encodeURIComponent(subjectFolder);
    const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
    const url = `${API_BASE_URL}/student/download-pdf/${encodedFolder}/${encodedPath}`;
    logger.info(`[DownloadAPI] PDF URL: ${url}`);
    return url;
  },

  /**
   * Get library book download URL
   * @param filePath Book file path
   */
  getBookUrl(filePath: string): string {
    const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
    const url = `${API_BASE_URL}/student/download-libraryBook/${encodedPath}`;
    logger.info(`[DownloadAPI] Book URL: ${url}`);
    return url;
  },

  /**
   * Download a file with authentication
   * @param url Full URL to download
   */
  async downloadFile(url: string): Promise<Response> {
    const token = await getAuthToken();
    
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new ApiError(`Download failed: ${response.status}`, response.status);
    }

    return response;
  },
};

// Export base URLs for direct use if needed
export const API_URLS = {
  BASE: API_BASE_URL,
  CLOUD: CLOUD_BASE_URL,
};

export default {
  Auth: AuthAPI,
  Student: StudentAPI,
  Download: DownloadAPI,
  URLS: API_URLS,
};
