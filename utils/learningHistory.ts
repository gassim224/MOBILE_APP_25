/**
 * Lifetime learning history — survives content deletion.
 *
 * The profile page used to derive its statistics from the downloads store,
 * which is destroyed when the user deletes content. This module keeps
 * per-user lifetime counters plus a small recent-activity list in
 * AsyncStorage, updated by analyticsService.enqueueEvent (the single funnel
 * every download/consumption event passes through). Deletion flows never
 * touch this store.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/AppConstants';
import logger from '@/utils/Logger';

const HISTORY_KEY_PREFIX = '@learning_history_';
const RECENT_LIMIT = 100;

export interface LearningActivity {
  content_id: string;
  title: string;
  type: string; // course | ebook | exercise | pdf
  action: 'downloaded' | 'completed';
  at: string; // ISO timestamp
}

export interface LearningHistory {
  downloads: number; // lifetime download count (lessons + books)
  lessonsCompleted: number; // content_consumed, non-ebook
  booksRead: number; // content_consumed, ebook
  courseTitles: string[]; // distinct courses/subjects ever downloaded from
  recent: LearningActivity[];
  seeded?: boolean; // one-time migration marker
}

const EMPTY: LearningHistory = {
  downloads: 0,
  lessonsCompleted: 0,
  booksRead: 0,
  courseTitles: [],
  recent: [],
};

export async function readLearningHistory(userId: string): Promise<LearningHistory> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY_PREFIX + userId);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as LearningHistory) } : { ...EMPTY };
  } catch {
    return { ...EMPTY };
  }
}

async function writeLearningHistory(userId: string, history: LearningHistory): Promise<void> {
  await AsyncStorage.setItem(HISTORY_KEY_PREFIX + userId, JSON.stringify(history));
}

export async function recordLearningActivity(
  userId: string,
  args: {
    action: 'downloaded' | 'completed';
    content_id: string;
    title: string;
    type: string;
    subject?: string;
  },
): Promise<void> {
  try {
    const history = await readLearningHistory(userId);
    if (args.action === 'downloaded') {
      history.downloads += 1;
      // "Cours suivis" = distinct courses the user ever pulled content from.
      // Ebooks carry the 'Bibliothèque' pseudo-subject — not a course.
      if (args.subject && args.type !== 'ebook' && !history.courseTitles.includes(args.subject)) {
        history.courseTitles.push(args.subject);
      }
    } else if (args.type === 'ebook') {
      history.booksRead += 1;
    } else {
      history.lessonsCompleted += 1;
    }
    history.recent.unshift({
      content_id: args.content_id,
      title: args.title,
      type: args.type,
      action: args.action,
      at: new Date().toISOString(),
    });
    if (history.recent.length > RECENT_LIMIT) history.recent.length = RECENT_LIMIT;
    await writeLearningHistory(userId, history);
  } catch (err) {
    logger.error('[history] failed to record activity', err);
  }
}

/**
 * One-time migration so users who already had content before this feature
 * shipped don't restart at zero: seed the counters from what is currently
 * on the device plus the consumed once-flags (which survive deletion).
 */
export async function seedLearningHistoryIfNeeded(
  userId: string,
  current: {
    courses: { title: string; lessons: { id: string }[] }[];
    books: { id: string }[];
  },
): Promise<LearningHistory> {
  const history = await readLearningHistory(userId);
  if (history.seeded) return history;

  const lessonCount = current.courses.reduce((sum, c) => sum + c.lessons.length, 0);
  history.downloads = Math.max(history.downloads, lessonCount + current.books.length);
  for (const c of current.courses) {
    if (!history.courseTitles.includes(c.title)) history.courseTitles.push(c.title);
  }
  history.booksRead = Math.max(history.booksRead, current.books.length);
  try {
    const keys = await AsyncStorage.getAllKeys();
    const consumedPrefix = `${STORAGE_KEYS.ANALYTICS_CONSUMED_EMITTED_PREFIX}${userId}_`;
    const consumedCount = keys.filter((k) => k.startsWith(consumedPrefix)).length;
    history.lessonsCompleted = Math.max(history.lessonsCompleted, consumedCount);
  } catch {
    // getAllKeys failing just means we seed without the flag count
  }
  history.seeded = true;
  try {
    await writeLearningHistory(userId, history);
  } catch (err) {
    logger.error('[history] failed to persist seeded history', err);
  }
  return history;
}
