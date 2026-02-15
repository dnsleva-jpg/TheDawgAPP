import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Pressable,
  Modal,
} from 'react-native';
import type { ProtectionLevel } from './PrepareScreen';
import { StatusBar } from 'expo-status-bar';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera-face-detector';
import type { FrameFaceDetectionOptions } from 'react-native-vision-camera-face-detector';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { useTimer } from '../hooks/useTimer';
import { useFaceTracking } from '../hooks/useFaceTracking';
import { RecordingIndicator } from '../components/RecordingIndicator';
import { formatTimeDisplay } from '../utils/formatTime';
import { COLORS } from '../constants/colors';
import { COLORS as DS_COLORS, FONTS, BRAND } from '../constants/designSystem';
import { ScoringEngine } from '../scoring/scoringEngine';
import type { CalibrationFrame, FaceFrameInput, SessionResults } from '../scoring/scoringEngine';
import { SCORING_CONFIG } from '../scoring/scoringConfig';
import type { ScoringConfig } from '../scoring/scoringConfig';

interface TimerScreenProps {
  durationSeconds: number;
  onComplete: (
    completedSeconds: number,
    videoUri?: string,
    stillnessPercent?: number,
    blinksCount?: number,
    scoringResults?: SessionResults
  ) => void;
  onCancel: () => void;
  incognitoMode?: boolean;
  protectionLevel?: ProtectionLevel;
}

const STRICT_COOLDOWN_SECONDS = 10;
const QUIT_REASONS = ['Bored', 'Distracted', 'Emergency', 'Other'] as const;

export function TimerScreen({
  durationSeconds,
  onComplete,
  onCancel,
  incognitoMode = false,
  protectionLevel = 'easy',
}: TimerScreenProps) {
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [showControls, setShowControls] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isStoppingRecording, setIsStoppingRecording] = useState(false);

  // Strict mode quit modal
  const [showStrictModal, setShowStrictModal] = useState(false);
  const [strictCooldown, setStrictCooldown] = useState(STRICT_COOLDOWN_SECONDS);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [liveStats, setLiveStats] = useState({ stillness: 0, blinks: 0 });

  const cameraRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const recordingFinishedResolveRef = useRef<((uri: string | undefined) => void) | null>(null);
  const lastTempVideoPathRef = useRef<string | null>(null);

  // Scoring engine refs
  const scoringEngineRef = useRef<ScoringEngine | null>(null);
  const calibrationFramesRef = useRef<CalibrationFrame[]>([]);
  const isEngineCalibrated = useRef(false);
  const sessionStartTimeRef = useRef<number>(0);
  const lastStatsUpdateRef = useRef<number>(0);
  const [isCalibrating, setIsCalibrating] = useState(false);

  const { timeRemaining, status, progress, isRogueMode, start, pause, resume, finish } = useTimer(durationSeconds);
  const { handleFacesDetected, getResults, reset } = useFaceTracking();
  const faceDetectionOptions = useRef<FrameFaceDetectionOptions>({
    performanceMode: 'fast',
    classificationMode: 'all',
    landmarkMode: 'none',
    contourMode: 'none',
    trackingEnabled: false,
    minFaceSize: 0.2,
  }).current;

  // Refs for values needed in callbacks to avoid stale closures
  const timeRemainingRef = useRef(timeRemaining);
  timeRemainingRef.current = timeRemaining;
  const isRogueModeRef = useRef(isRogueMode);
  isRogueModeRef.current = isRogueMode;

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    (async () => {
      try {
        if (hasPermission) {
          await MediaLibrary.requestPermissionsAsync();
        }
      } catch (_) {
        // Permission request failed — video saving may not work
      }
    })();
  }, [hasPermission]);

  // Wrapper face detection callback that feeds both useFaceTracking and ScoringEngine
  const scoringFaceDetectionCallback = useCallback((faces: any[], frame: any) => {
    // 1. Feed the existing useFaceTracking hook
    handleFacesDetected(faces, frame);

    // 2. Feed the ScoringEngine
    const engine = scoringEngineRef.current;
    if (!engine) return;

    const now = Date.now();
    const elapsedMs = now - sessionStartTimeRef.current;

    // #region agent log — H-E: callback invoked + face count
    if (elapsedMs < 500 || (elapsedMs % 5000 < 200)) console.log(`[DBG-E] cb elapsed=${elapsedMs}ms faces=${faces.length} calibrated=${isEngineCalibrated.current} calFrames=${calibrationFramesRef.current.length}`);
    // #endregion

    if (faces.length > 0) {
      const face = faces[0];

      // #region agent log — H-B: raw face data from MLKit
      if (elapsedMs < 500) console.log(`[DBG-B] MLKit keys=${Object.keys(face).join(',')} yaw=${face.yawAngle} pitch=${face.pitchAngle} leftEye=${face.leftEyeOpenProbability} rightEye=${face.rightEyeOpenProbability}`);
      // #endregion

      const faceData: FaceFrameInput = {
        yaw: face.yawAngle ?? 0,
        pitch: face.pitchAngle ?? 0,
        roll: face.rollAngle ?? 0,
        faceX: face.bounds ? face.bounds.x + face.bounds.width / 2 : 0,
        faceY: face.bounds ? face.bounds.y + face.bounds.height / 2 : 0,
        leftEyeOpenProbability: face.leftEyeOpenProbability ?? -1,
        rightEyeOpenProbability: face.rightEyeOpenProbability ?? -1,
        timestamp: now,
      };

      if (!isEngineCalibrated.current) {
        // Collecting calibration frames during first 10 seconds
        calibrationFramesRef.current.push({
          timestamp: now,
          yaw: faceData.yaw,
          pitch: faceData.pitch,
          roll: faceData.roll,
          faceX: faceData.faceX,
          faceY: faceData.faceY,
        });

        if (elapsedMs >= 3000 && calibrationFramesRef.current.length > 0) {
          // #region agent log — H-A: calibration trigger
          console.log(`[DBG-A] CALIBRATION triggered frames=${calibrationFramesRef.current.length} elapsed=${elapsedMs}ms`);
          // #endregion
          engine.calibrate(calibrationFramesRef.current);
          isEngineCalibrated.current = true;
          setIsCalibrating(false);
        }
      } else {
        // Engine is calibrated — process frame
        const result = engine.processFrame(faceData);

        // #region agent log — H-C: processFrame output (sampled)
        if (elapsedMs % 5000 < 200) console.log(`[DBG-C] frame stillness=${result.currentStillness} blinks=${result.blinkCount} score=${result.frameScore.toFixed(3)}`);
        // #endregion

        // Throttle UI updates to every 500ms
        // liveStillness = fast EMA of per-frame score (real-time feedback)
        if (now - lastStatsUpdateRef.current >= 500) {
          lastStatsUpdateRef.current = now;
          setLiveStats({
            stillness: result.liveStillness,
            blinks: result.blinkCount,
          });
        }
      }
    } else {
      // No face detected
      if (isEngineCalibrated.current) {
        const result = engine.processFrame(null);

        if (now - lastStatsUpdateRef.current >= 500) {
          lastStatsUpdateRef.current = now;
          setLiveStats({
            stillness: result.liveStillness,
            blinks: result.blinkCount,
          });
        }
      } else if (elapsedMs >= 3000 && calibrationFramesRef.current.length > 0) {
        // Calibrate even if face is lost right at the boundary
        engine.calibrate(calibrationFramesRef.current);
        isEngineCalibrated.current = true;
        setIsCalibrating(false);
      }
    }
  }, [handleFacesDetected]);

  const cleanupPreviousTempVideo = useCallback(async () => {
    if (lastTempVideoPathRef.current) {
      try {
        const path = lastTempVideoPathRef.current.replace(/^file:\/\//, '');
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) {
          await FileSystem.deleteAsync(path, { idempotent: true });
        }
      } catch (_) {}
      lastTempVideoPathRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecordingRef.current) return;
    await cleanupPreviousTempVideo();
    try {
      cameraRef.current.startRecording({
        videoCodec: 'h265',
        videoBitRate: 'low',
        onRecordingFinished: (video: { path: string }) => {
          const uri = video.path.startsWith('file://') ? video.path : `file://${video.path}`;
          lastTempVideoPathRef.current = uri;
          isRecordingRef.current = false;
          setIsRecording(false);
          if (recordingFinishedResolveRef.current) {
            recordingFinishedResolveRef.current(uri);
            recordingFinishedResolveRef.current = null;
          }
        },
        onRecordingError: (e: any) => {
          isRecordingRef.current = false;
          setIsRecording(false);
          if (recordingFinishedResolveRef.current) {
            recordingFinishedResolveRef.current(undefined);
            recordingFinishedResolveRef.current = null;
          }
        },
      });
      isRecordingRef.current = true;
      setIsRecording(true);
    } catch (err: any) {
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [cleanupPreviousTempVideo]);

  useEffect(() => {
    if (hasPermission) {
      reset();
      start();
      // Instantiate scoring engine
      scoringEngineRef.current = new ScoringEngine(SCORING_CONFIG as unknown as ScoringConfig);
      calibrationFramesRef.current = [];
      isEngineCalibrated.current = false;
      sessionStartTimeRef.current = Date.now();
      setIsCalibrating(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setTimeout(() => startRecording(), 800);
    }
  }, [hasPermission, reset]);

  const handleComplete = useCallback(async () => {
    // Prevent double-calling (critical: re-render triggers useEffect again)
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setIsStoppingRecording(true);

    // Read from refs for current values (avoids stale closures)
    const tr = timeRemainingRef.current;
    const rogue = isRogueModeRef.current;
    let completedTime = rogue ? tr : (durationSeconds - tr);
    if (completedTime < 0 || isNaN(completedTime)) completedTime = 0;

    const faceResults = getResults();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    let finalVideoUri: string | undefined;
    if (isRecordingRef.current && cameraRef.current) {
      try {
        const videoPromise = new Promise<string | undefined>((r) => {
          recordingFinishedResolveRef.current = r;
        });
        await cameraRef.current.stopRecording();
        finalVideoUri = await videoPromise;
      } catch (err: any) {
        finalVideoUri = undefined;
      }
    }

    isRecordingRef.current = false;
    setIsRecording(false);
    setIsStoppingRecording(false);

    // Get scoring engine results
    const durationMinutes = completedTime / 60;
    // For Rogue Mode there's no committed time — pass undefined so the engine
    // falls back to the old formula without a completion ratio penalty.
    const committedSeconds = rogue ? undefined : durationSeconds;
    const scoringResults = scoringEngineRef.current?.getSessionResults(durationMinutes, committedSeconds);

    // #region agent log — H-D: session results at completion
    console.log(`[DBG-D] COMPLETE dur=${durationMinutes.toFixed(2)}min committed=${committedSeconds ?? 'N/A'}s rogue=${rogue} calibrated=${isEngineCalibrated.current} engineBlinks=${scoringResults?.blinksPerMinute ?? 'N/A'} hookBlinks=${faceResults.totalBlinks} stillness=${scoringResults?.stillnessPercent ?? 'N/A'} grade=${scoringResults?.grade ?? 'N/A'} score=${scoringResults?.dawgScore ?? 'N/A'} durScore=${scoringResults?.durationScore ?? 'N/A'}`);
    // #endregion

    onComplete(
      completedTime,
      finalVideoUri,
      scoringResults?.stillnessPercent ?? faceResults.stillnessScore,
      scoringResults ? Math.round(scoringResults.blinksPerMinute * durationMinutes) : faceResults.totalBlinks,
      scoringResults
    );
  }, [durationSeconds, getResults, onComplete]);

  useEffect(() => {
    if (status === 'completed') {
      setTimeout(() => handleComplete(), 500);
    }
  }, [status, handleComplete]);

  // Strict mode cooldown timer
  useEffect(() => {
    if (!showStrictModal || strictCooldown <= 0) return;
    const timer = setTimeout(() => setStrictCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [showStrictModal, strictCooldown]);

  const cancelRecording = useCallback(async () => {
    if (isRecordingRef.current && cameraRef.current) {
      try {
        await cameraRef.current.cancelRecording();
      } catch (_) {}
      isRecordingRef.current = false;
      setIsRecording(false);
      recordingFinishedResolveRef.current = null;
    }
  }, []);

  const handleCancel = () => {
    if (protectionLevel === 'ruthless') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('🔒 Ruthless Mode', 'No escape. You MUST finish.');
      return;
    }

    if (protectionLevel === 'strict') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStrictCooldown(STRICT_COOLDOWN_SECONDS);
      setSelectedReason(null);
      setShowStrictModal(true);
      return;
    }

    // Easy mode — original behavior
    Alert.alert(
      'End Session?',
      'Save your progress and see your stats?',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'End & Save',
          style: 'default',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            finish();
          },
        },
        {
          text: "End & Don't Save",
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            await cancelRecording();
            onCancel();
          },
        },
      ]
    );
  };

  const handleStrictConfirmQuit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowStrictModal(false);
    finish();
  };

  const handleStrictDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowStrictModal(false);
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

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    finish();
  };

  if (hasPermission === null || hasPermission === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!hasPermission || !device) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {!device ? 'No front camera available' : 'Camera access is required for sessions'}
        </Text>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Camera
        ref={cameraRef}
        device={device}
        isActive={true}
        style={StyleSheet.absoluteFill}
        video={true}
        faceDetectionCallback={scoringFaceDetectionCallback}
        faceDetectionOptions={faceDetectionOptions}
      />
      <View style={styles.overlay} pointerEvents="box-none">
        {incognitoMode ? (
          // Incognito Mode - Black screen with minimal UI
          <Pressable 
            style={styles.incognitoContainer}
            onPress={() => setShowControls(!showControls)}
          >
            <View style={styles.blackScreen} />
            
            {!showControls && (
              <View style={styles.incognitoIndicator}>
                <View style={styles.recordingDot} />
              </View>
            )}
            
            {showControls && (
              <SafeAreaView style={styles.incognitoControls}>
                <View style={styles.incognitoHeader}>
                  <Text style={styles.incognitoTitle}>🕶️ INCOGNITO MODE</Text>
                  <Text style={styles.incognitoTime}>{formatTimeDisplay(timeRemaining)}</Text>
                </View>
                
                <View style={styles.incognitoButtons}>
                  {isRogueMode ? (
                    <TouchableOpacity
                      style={styles.incognitoFinishButton}
                      onPress={handleFinish}
                    >
                      <Text style={styles.incognitoButtonText}>FINISH</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.incognitoPauseButton}
                      onPress={handlePauseResume}
                    >
                      <Text style={styles.incognitoButtonText}>
                        {status === 'running' ? 'PAUSE' : 'RESUME'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  {protectionLevel === 'ruthless' ? (
                    <View style={[styles.incognitoEndButton, { opacity: 0.3 }]}>
                      <Text style={styles.incognitoEndButtonText}>🔒 LOCKED</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.incognitoEndButton}
                      onPress={handleCancel}
                    >
                      <Text style={styles.incognitoEndButtonText}>END SESSION</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <Text style={styles.incognitoHint}>Tap screen to hide controls</Text>
              </SafeAreaView>
            )}
          </Pressable>
        ) : (
          // Normal Mode - Full UI
          <View style={styles.overlayContent}>
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
              
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>
                  {formatTimeDisplay(timeRemaining)}
                </Text>
              </View>
              
              {isCalibrating && (
                <Text style={styles.calibratingText}>Calibrating...</Text>
              )}

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

            {/* Stats Bar */}
            <View style={styles.statsBar}>
              <Text style={styles.sessionText}>
                I DAWG'd for {formatTimeDisplay(isRogueMode ? timeRemaining : durationSeconds - timeRemaining)}
              </Text>
              <View style={styles.statsRow}>
                <Text style={styles.statsText}>🐕 {liveStats.stillness}% still</Text>
                <Text style={styles.statsDivider}>•</Text>
                <Text style={styles.statsText}>{liveStats.blinks} blinks</Text>
              </View>
              <Text style={styles.handleText}>@TheDAWGApp</Text>
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
              
              {protectionLevel === 'ruthless' ? (
                <View style={styles.giveUpButtonDisabled}>
                  <Text style={styles.giveUpButtonTextDisabled}>🔒 LOCKED</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.giveUpButton}
                  onPress={handleCancel}
                >
                  <Text style={styles.giveUpButtonText}>GIVE UP</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </View>
        )}

        {/* Strict Mode Quit Modal */}
        <Modal
          visible={showStrictModal}
          animationType="fade"
          transparent={true}
          onRequestClose={handleStrictDismiss}
        >
          <View style={styles.strictOverlay}>
            <View style={styles.strictCard}>
              <Text style={styles.strictTitle}>Are you sure?</Text>

              {strictCooldown > 0 ? (
                <>
                  <Text style={styles.strictCooldownNumber}>{strictCooldown}</Text>
                  <Text style={styles.strictMessage}>Take a breath. You've got this.</Text>
                </>
              ) : !selectedReason ? (
                <>
                  <Text style={styles.strictMessage}>Why are you quitting?</Text>
                  <View style={styles.reasonContainer}>
                    {QUIT_REASONS.map((reason) => (
                      <TouchableOpacity
                        key={reason}
                        style={styles.reasonButton}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedReason(reason);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.reasonButtonText}>{reason}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.strictMessage}>Reason: {selectedReason}</Text>
                  <TouchableOpacity
                    style={styles.strictQuitButton}
                    onPress={handleStrictConfirmQuit}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.strictQuitButtonText}>Quit Session</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={styles.strictNevermindButton}
                onPress={handleStrictDismiss}
                activeOpacity={0.8}
              >
                <Text style={styles.strictNevermindText}>Never mind</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS_COLORS.bgDeep,
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  overlayContent: {
    flex: 1,
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
    fontFamily: FONTS.display,
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
  calibratingText: {
    fontSize: 12,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textMuted,
    letterSpacing: 1,
    marginTop: -16,
    marginBottom: 8,
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
  finishButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: DS_COLORS.amber,
    borderWidth: 0,
  },
  finishButtonText: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: DS_COLORS.bgDeep,
    letterSpacing: 1,
  },
  giveUpButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  giveUpButtonText: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: DS_COLORS.textDisabled,
    letterSpacing: 0,
  },
  incognitoContainer: {
    flex: 1,
  },
  blackScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  incognitoIndicator: {
    position: 'absolute',
    top: 60,
    right: 24,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: DS_COLORS.coral,
    shadowColor: DS_COLORS.coral,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  incognitoControls: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 40,
  },
  incognitoHeader: {
    alignItems: 'center',
    gap: 16,
  },
  incognitoTitle: {
    fontSize: 16,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textSecondary,
    letterSpacing: 2,
  },
  incognitoTime: {
    fontSize: 64,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 4,
  },
  incognitoButtons: {
    width: '100%',
    gap: 16,
  },
  incognitoFinishButton: {
    backgroundColor: DS_COLORS.amber,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  incognitoPauseButton: {
    backgroundColor: DS_COLORS.bgSurfaceLight,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: DS_COLORS.textSecondary,
  },
  incognitoButtonText: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
  },
  incognitoEndButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  incognitoEndButtonText: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: DS_COLORS.textDisabled,
  },
  incognitoHint: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
    textAlign: 'center',
  },

  // Give Up disabled (Ruthless)
  giveUpButtonDisabled: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    opacity: 0.3,
  },
  giveUpButtonTextDisabled: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: DS_COLORS.textDisabled,
    letterSpacing: 1,
  },

  // Strict mode quit modal
  strictOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  strictCard: {
    width: '100%',
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  strictTitle: {
    fontSize: 24,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    textAlign: 'center',
  },
  strictCooldownNumber: {
    fontSize: 64,
    fontFamily: FONTS.display,
    color: '#F39C12',
    textAlign: 'center',
  },
  strictMessage: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  reasonContainer: {
    width: '100%',
    gap: 10,
  },
  reasonButton: {
    backgroundColor: DS_COLORS.bgSurfaceLight,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  reasonButtonText: {
    fontSize: 16,
    fontFamily: FONTS.headingMedium,
    color: DS_COLORS.textPrimary,
  },
  strictQuitButton: {
    width: '100%',
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  strictQuitButtonText: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 1,
  },
  strictNevermindButton: {
    paddingVertical: 8,
  },
  strictNevermindText: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textMuted,
  },
});
