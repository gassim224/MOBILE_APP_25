import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/AppConstants';

// Playback speed for the audio and video players. The chosen speed is
// remembered on the device, so a student who listens at 1.5× keeps that for
// the next lesson. Completion tracking is based on the position reached,
// not on wall-clock time, so a faster speed never changes what counts as
// "consumed".

export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;
export type PlaybackRate = (typeof PLAYBACK_RATES)[number];
export const DEFAULT_PLAYBACK_RATE: PlaybackRate = 1;

export async function loadSavedPlaybackRate(): Promise<PlaybackRate> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.PLAYBACK_RATE);
    const n = Number(raw);
    return (PLAYBACK_RATES as readonly number[]).includes(n) ? (n as PlaybackRate) : DEFAULT_PLAYBACK_RATE;
  } catch {
    return DEFAULT_PLAYBACK_RATE;
  }
}

export async function savePlaybackRate(rate: PlaybackRate): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYBACK_RATE, String(rate));
  } catch {
    // Remembering the speed is a convenience; playback already changed.
  }
}

export const formatRate = (rate: number) => `${String(rate).replace('.', ',')}×`;

interface PlaybackSpeedControlProps {
  value: PlaybackRate;
  onChange: (rate: PlaybackRate) => void;
  disabled?: boolean;
  // 'dark' for the video overlay (black background), 'light' for the audio page.
  variant?: 'dark' | 'light';
}

export default function PlaybackSpeedControl({ value, onChange, disabled, variant = 'dark' }: PlaybackSpeedControlProps) {
  return (
    // All five options must stay on one line on a phone: on the audio page
    // the label is dropped and chips are tighter, so 2× never wraps off-screen.
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Vitesse de lecture">
      {variant === 'dark' && <Text style={styles.label}>Vitesse</Text>}
      {PLAYBACK_RATES.map((rate) => {
        const active = rate === value;
        return (
          <TouchableOpacity
            key={rate}
            onPress={() => onChange(rate)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ selected: active, disabled: !!disabled }}
            accessibilityLabel={`Vitesse ${formatRate(rate)}`}
            style={[styles.chip, variant === 'light' && styles.chipCompact, active && styles.chipActive, disabled && styles.chipDisabled]}
            activeOpacity={0.8}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{formatRate(rate)}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    gap: 6,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  chip: {
    minWidth: 52,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
  },
  chipCompact: {
    minWidth: 46,
    paddingHorizontal: 6,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#1E3A5F',
  },
});
