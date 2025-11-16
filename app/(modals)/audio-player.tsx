import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { progressStorage, MediaProgress } from '@/utils/progressStorage';

export default function AudioPlayer() {
  const router = useRouter();
  const { lessonId, lessonTitle, audioUrl } = useLocalSearchParams<{
    lessonId: string;
    lessonTitle: string;
    audioUrl: string;
  }>();

  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);

  // Animated soundwave bars
  const waveAnimation1 = useRef(new Animated.Value(0.3)).current;
  const waveAnimation2 = useRef(new Animated.Value(0.5)).current;
  const waveAnimation3 = useRef(new Animated.Value(0.7)).current;
  const waveAnimation4 = useRef(new Animated.Value(0.5)).current;
  const waveAnimation5 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    setupAudio();
    return () => {
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isPlaying) {
      startWaveAnimation();
    } else {
      stopWaveAnimation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      const demoAudioUrl = audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
      const { sound } = await Audio.Sound.createAsync(
        { uri: demoAudioUrl },
        { shouldPlay: false },
        handlePlaybackStatusUpdate
      );

      soundRef.current = sound;
      setIsLoading(false);

      // Load saved progress
      await loadProgress();
    } catch (error) {
      console.error('Error setting up audio:', error);
      Alert.alert('Erreur', 'Impossible de charger le fichier audio');
      setIsLoading(false);
    }
  };

  const cleanup = async () => {
    try {
      await saveProgress();
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (error) {
      console.error('Error cleaning up:', error);
    }
  };

  const loadProgress = async () => {
    if (!lessonId) return;

    try {
      const savedProgress = await progressStorage.getProgress(lessonId);
      if (savedProgress && savedProgress.type === 'audio' && savedProgress.position > 0) {
        if (soundRef.current) {
          await soundRef.current.setPositionAsync(savedProgress.position);
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const saveProgress = async () => {
    if (!lessonId || position === 0) return;

    try {
      const progress: MediaProgress = {
        lessonId,
        position,
        duration,
        lastUpdated: new Date().toISOString(),
        type: 'audio',
      };
      await progressStorage.saveProgress(progress);
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        Alert.alert('Erreur', 'Erreur de lecture audio');
      }
      return;
    }

    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis || 0);
    setDuration(status.durationMillis || 0);

    // Save progress periodically
    if (status.isPlaying && Math.floor((status.positionMillis || 0) / 5000) % 1 === 0) {
      saveProgress();
    }

    // Audio ended
    if (status.didJustFinish) {
      saveProgress();
    }
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) return;

    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  };

  const handleSeek = async (value: number) => {
    if (!soundRef.current) return;

    try {
      setIsSeeking(true);
      await soundRef.current.setPositionAsync(value);
      setIsSeeking(false);
    } catch (error) {
      console.error('Error seeking:', error);
      setIsSeeking(false);
    }
  };

  const handleClose = async () => {
    await saveProgress();
    router.back();
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const startWaveAnimation = () => {
    const createWaveAnimation = (animValue: Animated.Value) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 300 + Math.random() * 200,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.2,
            duration: 300 + Math.random() * 200,
            useNativeDriver: true,
          }),
        ])
      );
    };

    Animated.parallel([
      createWaveAnimation(waveAnimation1),
      createWaveAnimation(waveAnimation2),
      createWaveAnimation(waveAnimation3),
      createWaveAnimation(waveAnimation4),
      createWaveAnimation(waveAnimation5),
    ]).start();
  };

  const stopWaveAnimation = () => {
    waveAnimation1.setValue(0.3);
    waveAnimation2.setValue(0.5);
    waveAnimation3.setValue(0.7);
    waveAnimation4.setValue(0.5);
    waveAnimation5.setValue(0.3);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lecture Audio</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Lesson Title */}
        <Text style={styles.lessonTitle} numberOfLines={2}>
          {lessonTitle || 'Audio en cours'}
        </Text>

        {/* Animated Soundwave Visualization */}
        <View style={styles.visualizationContainer}>
          <View style={styles.soundwaveContainer}>
            {[waveAnimation1, waveAnimation2, waveAnimation3, waveAnimation4, waveAnimation5].map(
              (anim, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.soundwaveBar,
                    {
                      transform: [
                        {
                          scaleY: anim,
                        },
                      ],
                    },
                  ]}
                />
              )
            )}
          </View>

          {/* Music Note Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="musical-notes" size={80} color="#FFD700" />
          </View>
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>Chargement de l&apos;audio...</Text>
          </View>
        )}

        {/* Timeline */}
        {!isLoading && (
          <View style={styles.timelineContainer}>
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            <Slider
              style={styles.slider}
              value={position}
              minimumValue={0}
              maximumValue={duration || 1}
              minimumTrackTintColor="#FFD700"
              maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
              thumbTintColor="#FFD700"
              onValueChange={(value) => setPosition(value)}
              onSlidingComplete={handleSeek}
              disabled={isSeeking || isLoading}
            />
            <Text style={styles.timeText}>{formatTime(duration)}</Text>
          </View>
        )}

        {/* Playback Controls */}
        {!isLoading && (
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.playPauseButton}
              onPress={togglePlayPause}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={48}
                color="#1E3A5F"
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Progress Indicator */}
        {!isLoading && duration > 0 && (
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {Math.round((position / duration) * 100)}% écouté
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A5F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  lessonTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 60,
    lineHeight: 32,
  },
  visualizationContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  soundwaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    gap: 8,
    marginBottom: 40,
  },
  soundwaveBar: {
    width: 8,
    height: 120,
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'center',
  },
  controlsContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  playPauseButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
});
