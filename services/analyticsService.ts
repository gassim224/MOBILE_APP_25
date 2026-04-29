/**
 * Analytics service — emits Bonecole pilot events to the cloud backend.
 *
 * Events are queued in AsyncStorage so events created while offline survive
 * app restart and get flushed when the device next has internet. The cloud
 * endpoint (admin-api.bonecole.com) is reached over real internet, NOT through
 * the kiosk relay — the kiosk only mirrors course content, not analytics.
 *
 * The `offline` field on each event reflects the device's connection to the
 * school kiosk at the moment of the event (per gassim's clarification:
 * "offline" = not connected to the Raspberry Pi). This is independent of
 * whether the device has internet to flush the queue.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { ANALYTICS, STORAGE_KEYS } from '@/constants/AppConstants';
import logger from '@/utils/Logger';
import type { UserProfile } from '@/types';

export type EventName =
  | 'first_login'
  | 'content_downloaded'
  | 'content_accessed_offline'
  | 'content_consumed'
  | 'exercises_completed'
  | 'ebook_downloaded';

const CONTENT_EVENTS: ReadonlySet<EventName> = new Set<EventName>([
  'content_downloaded',
  'content_accessed_offline',
  'content_consumed',
  'exercises_completed',
  'ebook_downloaded',
]);

export type ContentType = 'course' | 'ebook' | 'exercise';

export interface ContentEventInput {
  content_id: string;
  content_type: ContentType;
  subject?: string;
  content_title: string;
  grade_level?: string;
}

export interface AnalyticsEvent {
  event_name: EventName;
  user_id: string;
  school_id: string;
  role: 'student' | 'teacher' | 'admin';
  timestamp: string; // ISO, the original event time (NOT the sync time)
  offline: boolean;
  // Content fields, present only on content_* / exercises_completed / ebook_downloaded
  content_id?: string;
  content_type?: ContentType;
  subject?: string;
  content_title?: string;
  grade_level?: string;
}

let initialized = false;
let flushPromise: Promise<void> | null = null;

// ---------- Queue I/O ----------

async function readQueue(): Promise<AnalyticsEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS_EVENT_QUEUE);
    return raw ? (JSON.parse(raw) as AnalyticsEvent[]) : [];
  } catch (err) {
    logger.error('[analytics] failed to read event queue', err);
    return [];
  }
}

async function writeQueue(events: AnalyticsEvent[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.ANALYTICS_EVENT_QUEUE, JSON.stringify(events));
}

async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

// ---------- Core API ----------

/**
 * Enqueue an event. Called from trigger sites (download buttons, login, etc.).
 * Caller passes `offline` = !isConnectedToKiosk at the moment of the event.
 */
export async function enqueueEvent(args: {
  event_name: EventName;
  offline: boolean;
  content?: ContentEventInput;
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !user.id || !user.schoolId) {
    logger.error('[analytics] cannot enqueue event — user not loaded', { event: args.event_name });
    return;
  }

  if (CONTENT_EVENTS.has(args.event_name) && !args.content) {
    logger.error('[analytics] content event missing content payload', { event: args.event_name });
    return;
  }

  const event: AnalyticsEvent = {
    event_name: args.event_name,
    user_id: user.id,
    school_id: user.schoolId,
    role: user.role || 'student',
    timestamp: new Date().toISOString(),
    offline: !!args.offline,
    ...(args.content
      ? {
          content_id: args.content.content_id,
          content_type: args.content.content_type,
          subject: args.content.subject,
          content_title: args.content.content_title,
          // Default grade_level to user's grade if not provided
          grade_level: args.content.grade_level || user.grade || undefined,
        }
      : {}),
  };

  const queue = await readQueue();
  queue.push(event);
  await writeQueue(queue);
  logger.info(`[analytics] enqueued ${args.event_name}; queue size: ${queue.length}`);

  // Try to flush in the background — don't await, don't fail caller
  flushQueue().catch((e) => logger.error('[analytics] background flush failed', e));
}

/**
 * Flush the queue to the cloud. Safe to call concurrently — only one flush
 * runs at a time. Removes successfully-stored events from the queue.
 */
export async function flushQueue(): Promise<void> {
  if (flushPromise) return flushPromise;
  flushPromise = (async () => {
    try {
      const queue = await readQueue();
      if (queue.length === 0) return;

      const net = await NetInfo.fetch();
      if (!net.isConnected) {
        logger.info('[analytics] flush skipped — no internet');
        return;
      }

      // Send up to 100 events per batch to keep payloads small
      const batch = queue.slice(0, 100);
      const body = JSON.stringify({
        synced_at: new Date().toISOString(),
        events: batch,
      });

      const res = await fetch(ANALYTICS.EVENTS_BATCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!res.ok && res.status !== 207) {
        logger.error(`[analytics] flush HTTP ${res.status} — keeping events queued`);
        return;
      }

      const data = (await res.json().catch(() => null)) as
        | { stored_events?: number; rejected_events?: number; errors?: { index: number }[] }
        | null;

      // If backend rejected specific events, keep only those still problematic
      // and the events beyond the batch we attempted.
      const rejectedIdxs = new Set((data?.errors || []).map((e) => e.index));
      const remaining = batch.filter((_, i) => rejectedIdxs.has(i)).concat(queue.slice(batch.length));
      await writeQueue(remaining);
      logger.info(
        `[analytics] flushed: stored=${data?.stored_events ?? batch.length - rejectedIdxs.size}, ` +
          `rejected=${rejectedIdxs.size}, remaining=${remaining.length}`,
      );
    } catch (err) {
      logger.error('[analytics] flush failed', err);
    } finally {
      flushPromise = null;
    }
  })();
  return flushPromise;
}

// ---------- Lifecycle ----------

/**
 * Wire NetInfo so the queue flushes whenever internet becomes available.
 * Call once at app startup (in app/_layout.tsx).
 */
export function initAnalytics(): void {
  if (initialized) return;
  initialized = true;

  // Flush on boot if we already have internet
  flushQueue().catch(() => undefined);

  NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      flushQueue().catch(() => undefined);
    }
  });
}

// ---------- Convenience helpers (one per trigger site) ----------

/**
 * Emit first_login exactly once per user (gated by an AsyncStorage flag).
 */
export async function emitFirstLoginIfNew(): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !user.id) return;

  const flagKey = `${STORAGE_KEYS.ANALYTICS_FIRST_LOGIN_EMITTED_PREFIX}${user.id}`;
  const already = await AsyncStorage.getItem(flagKey);
  if (already) return;

  // We're explicitly not gating on isConnectedToKiosk here because login itself
  // requires kiosk connectivity in this app — so offline=false is accurate.
  await enqueueEvent({ event_name: 'first_login', offline: false });
  await AsyncStorage.setItem(flagKey, '1');
}

/**
 * Look up the parent course of a downloaded lesson so we can populate `subject`
 * (= course.title) on content events. Returns null if not found.
 */
async function findParentCourse(lessonId: string): Promise<{ title: string } | null> {
  try {
    const raw = await AsyncStorage.getItem('@downloads');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      courses?: { title: string; lessons: { id: string }[] }[];
    };
    for (const c of parsed.courses || []) {
      if (c.lessons.some((l) => l.id === lessonId)) return { title: c.title };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Emit content_accessed_offline when a downloaded lesson is opened. Looks up
 * subject (= parent course title) and grade_level (= user's grade) from storage.
 * `offline` is the kiosk-disconnect state at the moment of opening.
 */
export async function emitContentAccessed(args: {
  lessonId: string;
  lessonTitle: string;
  contentType: ContentType;
  offline: boolean;
}): Promise<void> {
  const parent = await findParentCourse(args.lessonId);
  await enqueueEvent({
    event_name: 'content_accessed_offline',
    offline: args.offline,
    content: {
      content_id: args.lessonId,
      content_type: args.contentType,
      content_title: args.lessonTitle,
      subject: parent?.title,
    },
  });
}

/**
 * Emit content_consumed at most once per (user, content) — gassim wants the
 * "lesson 50% completed" signal, not a noisy stream of progress events.
 */
export async function emitContentConsumedOnce(args: {
  offline: boolean;
  content: ContentEventInput;
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !user.id) return;

  const flagKey = `${STORAGE_KEYS.ANALYTICS_CONSUMED_EMITTED_PREFIX}${user.id}_${args.content.content_id}`;
  const already = await AsyncStorage.getItem(flagKey);
  if (already) return;

  await enqueueEvent({ event_name: 'content_consumed', offline: args.offline, content: args.content });
  await AsyncStorage.setItem(flagKey, '1');
}

/**
 * Emit exercises_completed at most once per (user, exercise). Triggered when
 * the user reaches the last page of an exercise PDF.
 */
export async function emitExerciseCompletedOnce(args: {
  offline: boolean;
  content: ContentEventInput;
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !user.id) return;

  const flagKey = `@analytics_exercise_completed_${user.id}_${args.content.content_id}`;
  const already = await AsyncStorage.getItem(flagKey);
  if (already) return;

  await enqueueEvent({
    event_name: 'exercises_completed',
    offline: args.offline,
    content: { ...args.content, content_type: 'exercise' },
  });
  await AsyncStorage.setItem(flagKey, '1');
}
