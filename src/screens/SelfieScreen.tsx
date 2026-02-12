// V2 CAMERA NOTE: SelfieScreen uses expo-camera (CameraView) for taking selfie photos.
// This is separate from TimerScreen's camera usage. When migrating TimerScreen to
// react-native-vision-camera for frame processing, leave SelfieScreen's expo-camera
// usage as-is — it only needs basic photo capture, not frame processing.
import React, { useState, useRef, useCallback } from 'react';
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
import ViewShot from 'react-native-view-shot';
import { formatTimeDisplay } from '../utils/formatTime';
import { COLORS } from '../constants/colors';
import { COLORS as DS_COLORS, FONTS, BRAND } from '../constants/designSystem';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SelfieScreenProps {
  completedSeconds: number;
  stillnessPercent: number;
  blinksCount: number;
  onComplete: () => void;
}

export function SelfieScreen({
  completedSeconds,
  stillnessPercent,
  blinksCount,
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

  // ─── STEP 2: Capture the preview (photo + stats together) using view-shot ───
  const handleSaveWithStats = useCallback(async () => {
    if (!viewShotRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      

      // Small delay to make sure the Image is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 300));

      // react-native-view-shot captures EVERYTHING inside the <ViewShot> wrapper
      // Since the photo is now a regular <Image> (not native camera), it works!
      if (!viewShotRef.current?.capture) {
        throw new Error('ViewShot ref not ready');
      }
      const uri = await viewShotRef.current.capture();

      if (!uri) {
        throw new Error('ViewShot capture returned no URI');
      }

      

      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission not granted');
      }

      // Save the combined image (photo + stats) to camera roll
      await MediaLibrary.createAssetAsync(uri);
      

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        '✅ Photo Saved!',
        'Your selfie with stats is saved to your camera roll! Share it on your story 🐕',
        [{ text: 'Done!', onPress: onComplete }]
      );
    } catch (error: any) {
      
      setIsProcessing(false);
      Alert.alert('Save Failed', `Failed to save photo: ${error?.message ?? 'Unknown error'}`);
    }
  }, [isProcessing, onComplete]);

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

  // ═══════════════════════════════════════════════
  //  THE STATS OVERLAY (brand kit share card design)
  // ═══════════════════════════════════════════════
  const StatsOverlay = () => (
    <View style={styles.statsContainer}>
      {/* CAMERA VERIFIED Badge */}
      <View style={styles.verifiedBadge}>
        <View style={styles.verifiedDot} />
        <Text style={styles.verifiedText}>CAMERA VERIFIED</Text>
      </View>

      {/* Header Text */}
      <Text style={styles.statsTitle}>I Raw Dawg'd for</Text>
      
      {/* Time Display */}
      <Text style={styles.statsTime}>{formatTimeDisplay(completedSeconds)}</Text>

      {/* Stat Chips */}
      <View style={styles.statsChipsRow}>
        <View style={styles.statChip}>
          <Text style={styles.statChipText}>🐕 {stillnessPercent}% still</Text>
        </View>
        <View style={styles.statChip}>
          <Text style={styles.statChipText}>{blinksCount} blinks</Text>
        </View>
      </View>

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
            <TouchableOpacity
              style={[styles.button, styles.takePhotoButton]}
              onPress={handleSaveWithStats}
              disabled={isProcessing}
              activeOpacity={0.8}
              accessibilityLabel="Save photo with stats"
              accessibilityRole="button"
            >
              <Text style={styles.takePhotoButtonText}>
                {isProcessing ? 'SAVING...' : '✅ SAVE WITH STATS'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.retakeButton]}
              onPress={handleRetake}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.retakeButtonText}>🔄 RETAKE</Text>
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
                  {!cameraReady ? 'LOADING CAMERA...' : isProcessing ? 'CAPTURING...' : '📸 TAKE PHOTO'}
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
    fontSize: 13, // 0.8rem = ~13px
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    marginBottom: 4,
  },
  
  // Time Display (Hero) - Fixed to fit on one line
  statsTime: {
    fontSize: 64, // Reduced from 80 to fit on one line
    fontFamily: FONTS.display, // Bebas Neue for hero time!
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
    lineHeight: 64, // Match font size for single line
    textShadowColor: 'rgba(255, 77, 106, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 20,
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
