/**
 * Study-time accumulator — total time actually spent consuming content
 * (video/audio playback, PDF/ebook reading). Powers the profile page's
 * "Temps d'étude" statistic. Persists per user and survives content deletion.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/AppConstants';

const STUDY_TIME_KEY_PREFIX = '@study_time_';

async function currentUserId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) return null;
    const profile = JSON.parse(raw) as { id?: string };
    return profile.id ?? null;
  } catch {
    return null;
  }
}

export async function addStudyTime(ms: number): Promise<void> {
  if (!Number.isFinite(ms) || ms <= 0) return;
  const userId = await currentUserId();
  if (!userId) return;
  try {
    const key = STUDY_TIME_KEY_PREFIX + userId;
    const raw = await AsyncStorage.getItem(key);
    const total = (raw ? Number(raw) || 0 : 0) + ms;
    await AsyncStorage.setItem(key, String(total));
  } catch {
    // best-effort accumulator — never break the player over it
  }
}

export async function getStudyTimeMs(): Promise<number> {
  const userId = await currentUserId();
  if (!userId) return 0;
  try {
    const raw = await AsyncStorage.getItem(STUDY_TIME_KEY_PREFIX + userId);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export function formatStudyTime(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return minutes > 0 ? `${hours}h${minutes}min` : `${hours}h`;
  return `${minutes}min`;
}
