/**
 * Store-review demo mode.
 *
 * Google Play / App Store reviewers cannot reach a school kiosk, so the
 * credentials published in the consoles must work fully offline. Logging in
 * with them builds a local demo profile and seeds bundled sample content
 * (a video lesson, a PDF lesson and an ebook) into the downloads store, so
 * every core feature — browsing, players, PDF reader, completion, profile
 * stats — is exercisable with no network at all.
 *
 * Demo activity must never pollute the pilot analytics: enqueueEvent drops
 * every event whose profile carries DEMO_SCHOOL_ID.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { STORAGE_KEYS } from '@/constants/AppConstants';
import type { UserProfile, DownloadedCourse, DownloadedBook } from '@/types';
import logger from '@/utils/Logger';

// Must match the sign-in details published in Play Console / App Store
// Connect ("App access" declarations).
export const DEMO_CREDENTIALS = { id: 'eleve1', password: '123456' } as const;
export const DEMO_SCHOOL_ID = 'DEMO';
// The root layout's auth guard (app/_layout.tsx) bounces any route in the
// (tabs) group back to /login when SESSION_TOKEN is missing — the demo
// session needs a token like any other login.
export const DEMO_SESSION_TOKEN = 'demo-session-token';

// Same key DownloadsContext persists under.
const DOWNLOADS_STORAGE_KEY = '@downloads';
const DEMO_COURSE_ID = 'demo-course-fractions';

export function isDemoLogin(studentId: string, password: string): boolean {
  return (
    studentId.trim().toLowerCase() === DEMO_CREDENTIALS.id &&
    password.trim() === DEMO_CREDENTIALS.password
  );
}

export function buildDemoProfile(): UserProfile {
  return {
    id: 'demo-reviewer',
    schoolId: DEMO_SCHOOL_ID,
    role: 'student',
    studentName: 'Élève Démo',
    schoolName: 'École Démo Bonecole',
    grade: '10 ème Année',
    studentId: 'DEMO-0001',
    subjects: [],
    gradeLevels: ['10 ème Année'],
  };
}

// Copy a bundled asset into the documents directory so it behaves exactly
// like content downloaded from the kiosk (players expect a file:// URI that
// survives app restarts).
async function materializeAsset(moduleRef: number, filename: string): Promise<string> {
  const asset = Asset.fromModule(moduleRef);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error(`demo asset ${filename} has no localUri`);
  const dir = `${FileSystem.documentDirectory}demo`;
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => undefined);
  const dest = `${dir}/${filename}`;
  const info = await FileSystem.getInfoAsync(dest);
  if (!info.exists) {
    await FileSystem.copyAsync({ from: asset.localUri, to: dest });
  }
  return dest;
}

/**
 * Set up the demo profile and seed the sample content. Idempotent — a second
 * demo login keeps whatever state the reviewer already produced.
 */
export async function seedDemoAccount(): Promise<UserProfile> {
  const profile = buildDemoProfile();
  await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  await AsyncStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, DEMO_SESSION_TOKEN);

  const raw = await AsyncStorage.getItem(DOWNLOADS_STORAGE_KEY);
  const existing = raw
    ? (JSON.parse(raw) as { courses: DownloadedCourse[]; books: DownloadedBook[] })
    : { courses: [], books: [] };
  if ((existing.courses || []).some((c) => c.id === DEMO_COURSE_ID)) {
    return profile;
  }

  try {
    const videoUri = await materializeAsset(
      require('@/assets/demo/demo-lecon-video.mp4'),
      'demo-lecon-video.mp4',
    );
    const pdfUri = await materializeAsset(
      require('@/assets/demo/demo-lecon-fractions.pdf'),
      'demo-lecon-fractions.pdf',
    );
    const bookUri = await materializeAsset(
      require('@/assets/demo/demo-livre-contes.pdf'),
      'demo-livre-contes.pdf',
    );

    const today = new Date().toLocaleDateString('fr-FR');
    const course: DownloadedCourse = {
      id: DEMO_COURSE_ID,
      title: 'Mathématiques',
      thumbnail: '',
      downloadedAt: today,
      lessons: [
        {
          id: 'video_demo_fractions_1',
          title: '1. Introduction aux fractions (vidéo)',
          type: 'video',
          size: '154 Ko',
          sizeBytes: 158000,
          duration: '24s',
          isDownloaded: true,
          mediaUrl: videoUri,
          filename: '_1.1 Introduction aux fractions.mp4',
        },
        {
          id: 'pdf_demo_fractions_2',
          title: '2. Les fractions — cours',
          type: 'pdf',
          size: '79 Ko',
          sizeBytes: 81000,
          isDownloaded: true,
          mediaUrl: pdfUri,
          filename: '_1.2 Les fractions.pdf',
        },
      ],
    };
    const book: DownloadedBook = {
      id: 'demo-book-contes',
      title: 'Le Lièvre et la Tortue du fleuve Niger',
      author: 'Bibliothèque Bonecole',
      thumbnail: '',
      downloadedAt: today,
      pdfUrl: bookUri,
    };

    await AsyncStorage.setItem(
      DOWNLOADS_STORAGE_KEY,
      JSON.stringify({
        courses: [...(existing.courses || []), course],
        books: [...(existing.books || []), book],
      }),
    );
  } catch (err) {
    // Content seeding is best-effort — the reviewer can still explore the
    // app shell if an asset copy fails.
    logger.error('[demo] failed to seed sample content', err);
  }
  return profile;
}
