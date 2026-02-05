import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import { useTimer } from '../hooks/useTimer';
import { RecordingIndicator } from '../components/RecordingIndicator';
import { formatTimeDisplay } from '../utils/formatTime';
import { COLORS } from '../constants/colors';
import { COLORS as DS_COLORS, FONTS, BRAND } from '../constants/designSystem';

interface TimerScreenProps {
  durationSeconds: number;
  onComplete: (
    completedSeconds: number,
    videoUri?: string,
    stillnessPercent?: number,
    blinksCount?: number
  ) => void;
  onCancel: () => void;
}

export function TimerScreen({
  durationSeconds,
  onComplete,
  onCancel,
}: TimerScreenProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const recordingPromiseRef = useRef<Promise<any> | null>(null);
  const { timeRemaining, status, progress, isRogueMode, start, pause, resume, finish } = useTimer(durationSeconds);
  
  // Placeholder stats (will be real later)
  const [stillnessPercent] = useState(Math.floor(Math.random() * (99 - 85 + 1)) + 85);
  const [blinksCount] = useState(Math.floor(Math.random() * (25 - 5 + 1)) + 5);

  useEffect(() => {
    (async () => {
      console.log('📹 Requesting permissions...');
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const micPermission = await Camera.requestMicrophonePermissionsAsync();
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      
      console.log('📹 Camera:', cameraPermission.status);
      console.log('📹 Microphone:', micPermission.status);
      console.log('📹 Media Library:', mediaLibraryPermission.status);
      
      const allGranted = cameraPermission.status === 'granted' && 
        micPermission.status === 'granted' &&
        mediaLibraryPermission.status === 'granted';
      
      console.log('📹 All permissions granted:', allGranted);
      setHasPermission(allGranted);
    })();
  }, []);

  useEffect(() => {
    if (hasPermission) {
      console.log('📹 Timer starting, will begin recording...');
      start();
      
      // Give camera a moment to mount before starting recording
      setTimeout(() => {
        startRecording();
      }, 500);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [hasPermission]);

  useEffect(() => {
    if (status === 'completed') {
      // Wait 500ms to capture final stats frame before stopping
      setTimeout(() => {
        stopRecording(true).then(() => {
          console.log('✅ Timer completed, recording stopped, results screen should show');
        });
      }, 500);
    }
  }, [status]);

  const startRecording = async () => {
    console.log('📹 startRecording() called');
    
    if (!cameraRef.current) {
      console.log('📹 ERROR: No camera ref available');
      return;
    }
    
    try {
      console.log('📹 Attempting to start video recording...');
      
      const options = isRogueMode ? {} : { maxDuration: durationSeconds };
      console.log('📹 Recording options:', options);
      
      recordingPromiseRef.current = cameraRef.current.recordAsync(options);
      setIsRecording(true);
      console.log('📹 ✅ Recording started!');
      
    } catch (error) {
      console.log('📹 ❌ Recording failed:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async (completed: boolean = false) => {
    console.log('📹 stopRecording() called, completed:', completed);
    console.log('📹 isRecording:', isRecording);
    
    if (!completed) {
      if (cameraRef.current && isRecording && recordingPromiseRef.current) {
        try {
          setIsRecording(false);
          cameraRef.current.stopRecording();
          recordingPromiseRef.current = null;
        } catch (error) {
          console.log('📹 Error stopping recording:', error);
        }
      }
      return;
    }

    // Calculate the actual completed time
    // Rogue mode: timeRemaining counts UP from 0
    // Normal mode: timeRemaining counts DOWN, so elapsed = durationSeconds - timeRemaining
    let completedTime = isRogueMode ? timeRemaining : (durationSeconds - timeRemaining);
    
    if (completedTime < 0 || isNaN(completedTime)) {
      console.warn('⚠️ Invalid completedTime detected, using 0');
      completedTime = 0;
    }
    
    console.log('🐕 TimerScreen - stopRecording debug:');
    console.log('  isRogueMode:', isRogueMode);
    console.log('  durationSeconds:', durationSeconds);
    console.log('  timeRemaining:', timeRemaining);
    console.log('  completedTime (final):', completedTime);
    
    if (!cameraRef.current || !isRecording || !recordingPromiseRef.current) {
      console.log('📹 No recording to stop');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(completedTime, undefined, stillnessPercent, blinksCount);
      return;
    }

    try {
      console.log('📹 Stopping recording...');
      setIsRecording(false);
      cameraRef.current.stopRecording();
      
      const video = await recordingPromiseRef.current;
      console.log('📹 ✅ Recording stopped! Video URI:', video?.uri);
      
      if (video?.uri) {
        console.log('📹 Video recorded, passing stats to selfie screen');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete(completedTime, video.uri, stillnessPercent, blinksCount);
      } else {
        console.log('📹 ❌ No video URI');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete(completedTime, undefined, stillnessPercent, blinksCount);
      }
    } catch (error) {
      console.log('📹 ❌ Error during recording stop:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(completedTime, undefined, stillnessPercent, blinksCount);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'End Session?',
      'Save your progress and see your stats?',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'End & Save',
          style: 'default',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            // Complete with current time (even if session not finished)
            await stopRecording(true);
          },
        },
      ]
    );
  };

  const handlePauseResume = () => {
    if (status === 'running') {
      pause();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (status === 'paused') {
      resume();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleFinish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    finish();
    // Wait 500ms for finish() to update the timer state and capture final stats frame
    setTimeout(async () => {
      await stopRecording(true);
    }, 500);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No access to camera, microphone, or media library</Text>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing="front"
        mode="video"
      >
          <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            {/* Top Section */}
            <View style={styles.topSection}>
              <RecordingIndicator />
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Center Section - Timer Only */}
            <View style={styles.centerSection}>
              {isRogueMode && (
                <Text style={styles.rogueModeLabel}>∞ ROGUE MODE</Text>
              )}
              
              {/* Main Timer Display */}
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>
                  {formatTimeDisplay(timeRemaining)}
                </Text>
              </View>
              
              {/* Progress bar for timed modes */}
              {!isRogueMode && (
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${progress * 100}%` },
                    ]}
                  />
                </View>
              )}
            </View>

            {/* Stats Bar - Above bottom controls */}
            <View style={styles.statsBar}>
              <Text style={styles.sessionText}>
                I Raw Dawg'd for {formatTimeDisplay(isRogueMode ? timeRemaining : durationSeconds - timeRemaining)}
              </Text>
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>🐕 {stillnessPercent}% still</Text>
                <Text style={styles.statsDivider}>•</Text>
                <Text style={styles.statsText}>{blinksCount} blinks</Text>
              </View>
              <Text style={styles.handleText}>@TheRAWDAWGapp</Text>
            </View>

            {/* Bottom Section - Controls */}
            <View style={styles.bottomSection}>
              {isRogueMode ? (
                <TouchableOpacity
                  style={styles.finishButton}
                  onPress={handleFinish}
                >
                  <Text style={styles.finishButtonText}>FINISH</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.pauseButton}
                  onPress={handlePauseResume}
                >
                  <Text style={styles.pauseButtonText}>
                    {status === 'running' ? 'PAUSE' : 'RESUME'}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.giveUpButton}
                onPress={handleCancel}
              >
                <Text style={styles.giveUpButtonText}>GIVE UP</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Brand Kit - Timer Screen
  container: {
    flex: 1,
    backgroundColor: DS_COLORS.bgDeep, // Brand kit background
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: DS_COLORS.bgDeep,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: DS_COLORS.textPrimary,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 24,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    position: 'relative',
    width: '100%',
  },
  rogueModeLabel: {
    fontSize: 18,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.amber,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  timerContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  timerText: {
    fontSize: 80,
    fontFamily: FONTS.display, // Bebas Neue for countdown
    color: DS_COLORS.textPrimary,
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  captionContainer: {
    marginTop: 60,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    alignItems: 'center',
  },
  captionText: {
    fontSize: 22,
    fontFamily: FONTS.headingBold,
    color: DS_COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  handleContainer: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
  },
  handleText: {
    fontSize: 20,
    fontFamily: FONTS.headingBold,
    color: DS_COLORS.coral,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.darkGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.coral,
  },
  statsBar: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    gap: 8,
  },
  sessionText: {
    fontSize: 16,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsText: {
    fontSize: 14,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  statsDivider: {
    fontSize: 14,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textSecondary,
    paddingHorizontal: 4,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 40,
    gap: 16,
  },
  pauseButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: DS_COLORS.bgSurfaceLight,
    borderWidth: 2,
    borderColor: DS_COLORS.textSecondary,
  },
  pauseButtonText: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
  },
  // Brand Kit - Finish Button
  finishButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: DS_COLORS.amber, // Brand kit amber for finish
    borderWidth: 0,
  },
  finishButtonText: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: DS_COLORS.bgDeep, // Dark text on amber background
    letterSpacing: 1,
  },
  // Brand Kit - Give Up Button (subtle, afterthought)
  giveUpButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  giveUpButtonText: {
    fontSize: 13, // 0.8rem - small per brand kit
    fontFamily: FONTS.body,
    color: DS_COLORS.textDisabled, // Very subtle per brand kit
    letterSpacing: 0,
  },
});
