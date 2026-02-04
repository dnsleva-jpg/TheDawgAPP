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

  // ─── THIS IS THE KEY NEW PIECE ───
  // When null = show live camera
  // When set = show the photo as a regular <Image> (so view-shot can capture it)
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);

  // ─── STEP 1: Take photo from camera (saves raw photo URI) ───
  const handleTakePhoto = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      console.log('📸 Step 1: Taking selfie from camera...');

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
      });

      if (!photo?.uri) {
        throw new Error('No photo URI returned');
      }

      console.log('📸 ✅ Photo captured, switching to preview mode:', photo.uri);

      // Switch from camera to preview mode
      // This replaces the native camera with a regular <Image>
      setCapturedPhotoUri(photo.uri);
      setIsProcessing(false);

      // The "SAVE WITH STATS" button now appears (see render below)
    } catch (error: any) {
      console.error('📸 ❌ Photo capture failed:', error);
      setIsProcessing(false);
      Alert.alert('Photo Failed', `Failed to capture photo: ${error.message}`);
    }
  };

  // ─── STEP 2: Capture the preview (photo + stats together) using view-shot ───
  const handleSaveWithStats = useCallback(async () => {
    if (!viewShotRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      console.log('📸 Step 2: Capturing photo + stats with view-shot...');

      // Small delay to make sure the Image is fully rendered
      await new Promise((resolve) => setTimeout(resolve, 300));

      // react-native-view-shot captures EVERYTHING inside the <ViewShot> wrapper
      // Since the photo is now a regular <Image> (not native camera), it works!
      const uri = await viewShotRef.current.capture!();

      if (!uri) {
        throw new Error('ViewShot capture returned no URI');
      }

      console.log('📸 ✅ Stats overlay captured:', uri);

      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission not granted');
      }

      // Save the combined image (photo + stats) to camera roll
      await MediaLibrary.createAssetAsync(uri);
      console.log('📸 ✅ Photo WITH stats saved to camera roll!');

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        '✅ Photo Saved!',
        'Your selfie with stats is saved to your camera roll! Share it on your story 🐕',
        [{ text: 'Done!', onPress: onComplete }]
      );
    } catch (error: any) {
      console.error('📸 ❌ Save with stats failed:', error);
      setIsProcessing(false);
      Alert.alert('Save Failed', `Failed to save photo: ${error.message}`);
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
  //  THE STATS OVERLAY (used in both camera & preview)
  // ═══════════════════════════════════════════════
  const StatsOverlay = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.statsTitle}>I Raw Dawg'd for</Text>
      <Text style={styles.statsTime}>{formatTimeDisplay(completedSeconds)}</Text>

      <View style={styles.statsRow}>
        <Text style={styles.statsText}>🐕 {stillnessPercent}% still</Text>
        <Text style={styles.statsDivider}>•</Text>
        <Text style={styles.statsText}>{blinksCount} blinks</Text>
      </View>

      <Text style={styles.handleText}>@TheRAWDAWGapp</Text>
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

      <CameraView ref={cameraRef} style={styles.camera} facing="front">
        <SafeAreaView style={styles.overlay}>
          {/* Stats Overlay (visible on screen but won't be in photo yet) */}
          <View style={styles.centerSection}>
            <StatsOverlay />
          </View>

          {/* Action Buttons */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.button, styles.takePhotoButton]}
              onPress={handleTakePhoto}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.takePhotoButtonText}>
                {isProcessing ? 'CAPTURING...' : '📸 TAKE PHOTO'}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  statsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: COLORS.coral,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 0.5,
  },
  statsTime: {
    fontSize: 64,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: -2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  statsText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 0.3,
  },
  statsDivider: {
    fontSize: 16,
    color: COLORS.gray,
    paddingHorizontal: 4,
  },
  handleText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.coral,
    letterSpacing: 0.5,
    marginTop: 12,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 12,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  takePhotoButton: {
    backgroundColor: COLORS.coral,
  },
  takePhotoButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  retakeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
});
