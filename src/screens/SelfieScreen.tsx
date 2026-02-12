// V2 CAMERA NOTE: SelfieScreen uses expo-camera (CameraView) for taking selfie photos.
// This is separate from TimerScreen's camera usage. When migrating TimerScreen to
// react-native-vision-camera for frame processing, leave SelfieScreen's expo-camera
// usage as-is — it only needs basic photo capture, not frame processing.
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { CameraView } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';
import { formatTimeDisplay } from '../utils/formatTime';
import { COLORS } from '../constants/colors';
import { COLORS as DS_COLORS, FONTS, BRAND } from '../constants/designSystem';
import type { SessionResults } from '../scoring/scoringEngine';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Grade modifier (same logic as ResultsScreen/ShareCard) ──────────────────
function getGradeWithModifier(score: number, baseGrade: string): string {
  const bands: { grade: string; min: number; max: number }[] = [
    { grade: 'S', min: 90, max: 100 },
    { grade: 'A', min: 80, max: 89 },
    { grade: 'B', min: 65, max: 79 },
    { grade: 'C', min: 50, max: 64 },
    { grade: 'D', min: 30, max: 49 },
  ];
  const band = bands.find((b) => b.grade === baseGrade);
  if (!band) return baseGrade;
  const range = band.max - band.min + 1;
  const third = range / 3;
  if (score >= band.min + 2 * third) return `${baseGrade}+`;
  if (score < band.min + third) return `${baseGrade}-`;
  return baseGrade;
}

function gradeColor(grade: string): string {
  const colors: Record<string, string> = { S: '#8E44AD', A: '#27AE60', B: '#2980B9', C: '#F39C12', D: '#E67E22', F: '#E74C3C' };
  return colors[grade.charAt(0)] ?? '#F39C12';
}

interface SelfieScreenProps {
  completedSeconds: number;
  stillnessPercent: number;
  blinksCount: number;
  scoringResults?: SessionResults | null;
  onComplete: () => void;
}

export function SelfieScreen({
  completedSeconds,
  stillnessPercent,
  blinksCount,
  scoringResults,
  onComplete,
}: SelfieScreenProps) {
  const cameraRef = useRef<CameraView>(null);
  const viewShotRef = useRef<ViewShot>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraDelayDone, setCameraDelayDone] = useState(false);

  // Delay camera mount to let TimerScreen's camera fully release
  React.useEffect(() => {
    const timer = setTimeout(() => setCameraDelayDone(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // ─── THIS IS THE KEY NEW PIECE ───
  // When null = show live camera
  // When set = show the photo as a regular <Image> (so view-shot can capture it)
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);

  // ─── STEP 1: Take photo from camera (saves raw photo URI) ───
  const handleTakePhoto = async () => {
    if (!cameraRef.current || isProcessing || !cameraReady) return;

    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
      });

      if (!photo?.uri) {
        throw new Error('No photo URI returned');
      }

      // Switch from camera to preview mode
      // This replaces the native camera with a regular <Image>
      setCapturedPhotoUri(photo.uri);
      setIsProcessing(false);

      // The "SAVE WITH STATS" button now appears (see render below)
    } catch (error: any) {
      setIsProcessing(false);
      Alert.alert('Photo Failed', `Failed to capture photo: ${error?.message ?? 'Unknown error'}`);
    }
  };

  // ─── Capture helper ───
  const captureSelfie = useCallback(async (): Promise<string | null> => {
    if (!viewShotRef.current?.capture) return null;
    // Small delay to make sure the Image is fully rendered
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      return await viewShotRef.current.capture();
    } catch {
      return null;
    }
  }, []);

  // ─── SHARE selfie (opens native share sheet) ───
  const handleShareSelfie = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await captureSelfie();
      if (!uri) throw new Error('Could not capture selfie');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Share your detox selfie' });
      }
    } catch (error: any) {
      Alert.alert('Share Failed', error?.message ?? 'Could not share.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, captureSelfie]);

  // ─── SAVE selfie to camera roll ───
  const handleSaveSelfie = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uri = await captureSelfie();
      if (!uri) throw new Error('Could not capture selfie');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow photo library access to save.');
        return;
      }
      await MediaLibrary.createAssetAsync(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved!', 'Selfie saved to your camera roll.', [{ text: 'Done!', onPress: onComplete }]);
    } catch (error: any) {
      Alert.alert('Save Failed', error?.message ?? 'Could not save.');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, captureSelfie, onComplete]);

  // ─── Go back to camera to retake ───
  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCapturedPhotoUri(null);
    setIsProcessing(false);
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onComplete();
  };

  // Format duration as M:SS
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ═══════════════════════════════════════════════
  //  THE STATS OVERLAY (brand kit share card design)
  // ═══════════════════════════════════════════════
  const StatsOverlay = () => (
    <View style={styles.statsContainer}>
      {/* CAMERA VERIFIED DETOX Badge */}
      <View style={styles.verifiedBadge}>
        <View style={styles.verifiedDot} />
        <Text style={styles.verifiedText}>CAMERA VERIFIED DETOX</Text>
      </View>

      {scoringResults ? (
        <>
          {/* Score + Grade */}
          <View style={styles.scoreRow}>
            <Text style={styles.statsScore}>{Math.round(scoringResults.rawDawgScore)}</Text>
            <Text style={[styles.statsGrade, { color: gradeColor(scoringResults.grade) }]}>
              {getGradeWithModifier(scoringResults.rawDawgScore, scoringResults.grade)}
            </Text>
          </View>

          {/* Stat Chips */}
          <View style={styles.statsChipsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statChipText}>🐶 {Math.round(scoringResults.stillnessPercent)}% still</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipText}>👁 {scoringResults.blinksPerMinute.toFixed(0)}/min</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipText}>⏱ {formatDuration(completedSeconds)}</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          {/* Fallback: old overlay */}
          <Text style={styles.statsTime}>{formatTimeDisplay(completedSeconds)}</Text>
          <View style={styles.statsChipsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statChipText}>🐕 {stillnessPercent}% still</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statChipText}>{blinksCount} blinks</Text>
            </View>
          </View>
        </>
      )}

      {/* Coral Gradient Divider */}
      <View style={styles.coralDivider} />

      {/* Handle */}
      <Text style={styles.handleText}>@TheRAWDAWGapp</Text>
      
      {/* Tagline */}
      <Text style={styles.taglineText}>the art of doing absolutely nothing</Text>
    </View>
  );

  // ═══════════════════════════════════════════════
  //  MODE 2: PREVIEW MODE (photo taken, showing preview with stats)
  //  This is where the magic happens - everything is React Native
  //  so view-shot can capture it all
  // ═══════════════════════════════════════════════
  if (capturedPhotoUri) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* ViewShot wraps ONLY the photo + stats (not the buttons) */}
        <ViewShot
          ref={viewShotRef}
          style={styles.viewShotArea}
          options={{
            format: 'jpg',
            quality: 0.9,
            result: 'tmpfile',
          }}
        >
          {/* Photo as a regular <Image> — view-shot CAN capture this */}
          <Image
            source={{ uri: capturedPhotoUri }}
            style={styles.previewImage}
            resizeMode="cover"
          />

          {/* Stats overlay — same look, now gets captured too */}
          <View style={styles.previewOverlay}>
            <View style={styles.centerSection}>
              <StatsOverlay />
            </View>
          </View>
        </ViewShot>

        {/* Buttons sit OUTSIDE ViewShot so they don't appear in the saved image */}
        <SafeAreaView style={styles.previewButtonsContainer}>
          <View style={styles.previewButtons}>
            <View style={styles.shareSaveRow}>
              <TouchableOpacity
                style={[styles.button, styles.takePhotoButton, { flex: 1 }]}
                onPress={handleShareSelfie}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <Text style={styles.takePhotoButtonText}>SHARE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.retakeButton, { flex: 1 }]}
                onPress={handleSaveSelfie}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <Text style={styles.retakeButtonText}>SAVE</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.retakeButton]}
              onPress={handleRetake}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.retakeButtonText}>RETAKE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.skipButton]}
              onPress={handleSkip}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.skipButtonText}>SKIP</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ═══════════════════════════════════════════════
  //  MODE 1: CAMERA MODE (live feed, hasn't taken photo yet)
  //  This is basically your original code, unchanged
  // ═══════════════════════════════════════════════
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {cameraDelayDone ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          onCameraReady={() => setCameraReady(true)}
        >
          <SafeAreaView style={styles.overlay}>
            {/* Stats Overlay (visible on screen but won't be in photo yet) */}
            <View style={styles.centerSection}>
              <StatsOverlay />
            </View>

            {/* Action Buttons */}
            <View style={styles.bottomSection}>
              <TouchableOpacity
                style={[styles.button, styles.takePhotoButton, !cameraReady && styles.buttonDisabled]}
                onPress={handleTakePhoto}
                disabled={isProcessing || !cameraReady}
                activeOpacity={0.8}
              >
                <Text style={styles.takePhotoButtonText}>
                  {!cameraReady ? 'LOADING CAMERA...' : isProcessing ? 'CAPTURING...' : '📸 PROOF OF DETOX'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.skipButton]}
                onPress={handleSkip}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <Text style={styles.skipButtonText}>SKIP</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </CameraView>
      ) : (
        <View style={[styles.camera, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.skipButtonText}>Preparing camera...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS_COLORS.bgDeep, // Brand kit background
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // ─── Preview mode styles ───
  viewShotArea: {
    flex: 1,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  previewButtonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(13, 13, 18, 0.95)', // Brand kit background with transparency
  },
  previewButtons: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 12,
  },

  // ─── Shared styles ───
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  // Share Card - Brand Kit Design
  statsContainer: {
    backgroundColor: 'rgba(13, 13, 18, 0.78)', // Brand kit overlay color
    borderRadius: 22, // Brand kit share card radius
    paddingVertical: 24,
    paddingHorizontal: 24, // Increased from 20 for better spacing
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 77, 106, 0.45)', // Coral with opacity
    // Simulating glass morphism shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 8,
    width: '85%', // Increased from 80% to give time more space
    maxWidth: 340, // Max width to keep it looking good on larger screens
  },
  
  // Verified Badge
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  verifiedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: DS_COLORS.verified,
    // Pulse animation would go here (CSS keyframes in web)
  },
  verifiedText: {
    fontSize: 8, // 0.5rem = 8px
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.verified,
    letterSpacing: 3.2, // 0.2em of 8px = ~3.2px
    textTransform: 'uppercase',
  },
  
  // Header
  statsTitle: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  // Score + Grade row
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  statsScore: {
    fontSize: 48,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
  },
  statsGrade: {
    fontSize: 48,
    fontFamily: FONTS.display,
    letterSpacing: 2,
  },
  
  // Time Display (Hero) - Fallback when no scoring
  statsTime: {
    fontSize: 64,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 77, 106, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 20,
  },

  // Share + Save row
  shareSaveRow: {
    flexDirection: 'row',
    gap: 12,
  },
  
  // Stat Chips
  statsChipsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 14,
  },
  statChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 100, // Pill shape
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statChipText: {
    fontSize: 10, // 0.62rem = ~10px
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textPrimary,
  },
  
  // Coral Gradient Divider
  coralDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 77, 106, 0.25)',
    marginBottom: 12,
  },
  
  // Handle
  handleText: {
    fontSize: 16, // 1rem
    fontFamily: FONTS.headingBold,
    color: DS_COLORS.coral,
    letterSpacing: 0.16, // +0.01em
  },
  
  // Tagline
  taglineText: {
    fontSize: 8, // 0.5rem
    fontFamily: FONTS.body,
    color: 'rgba(255, 255, 255, 0.2)',
    marginTop: 4,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  // Buttons - Brand Kit Styles
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14, // Brand kit button radius
    alignItems: 'center',
  },
  
  // Primary CTA Button
  takePhotoButton: {
    backgroundColor: DS_COLORS.coral,
    shadowColor: DS_COLORS.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  takePhotoButtonText: {
    fontSize: 16, // 1rem
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 0,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  // Secondary Button (Outline)
  retakeButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 77, 106, 0.4)',
  },
  retakeButtonText: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: DS_COLORS.coral,
    letterSpacing: 0,
  },
  
  // Text Button
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14, // 0.9rem
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textMuted,
    letterSpacing: 0,
  },
});
