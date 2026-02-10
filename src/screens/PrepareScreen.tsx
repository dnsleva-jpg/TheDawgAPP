import React, { useState, useEffect } from 'react';
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
import { Audio } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';
import { COLORS as DS_COLORS, FONTS, RADIUS, SHADOWS } from '../constants/designSystem';

interface PrepareScreenProps {
  durationMinutes: number;
  onReady: (incognitoMode?: boolean) => void;
  onCancel: () => void;
}

export function PrepareScreen({ 
  durationMinutes, 
  onReady,
  onCancel,
}: PrepareScreenProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(true);
  const [incognitoMode, setIncognitoMode] = useState<boolean>(false);

  // Request camera permission when screen loads
  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    setIsRequestingPermission(true);
    
    // Request camera permission
    const cameraResult = await Camera.requestCameraPermissionsAsync();
    
    // Request microphone permission
    const audioResult = await Audio.requestPermissionsAsync();
    
    // Request media library permission (for saving photos/videos)
    const mediaResult = await MediaLibrary.requestPermissionsAsync();
    
    const allGranted = 
      cameraResult.status === 'granted' && 
      audioResult.status === 'granted' &&
      mediaResult.status === 'granted';
      
    setHasPermission(allGranted);
    setIsRequestingPermission(false);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log('[DEBUG-E] PrepareScreen calling onReady - incognito:', incognitoMode, 'durationMin:', durationMinutes);
      onReady(incognitoMode);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onReady, incognitoMode]);

  const handleReady = () => {
    if (incognitoMode) {
      // Show alert prompting user to enable Do Not Disturb
      Alert.alert(
        '🕶️ Incognito Mode',
        'For the best experience, enable Do Not Disturb mode to prevent notifications.\n\nSwipe down from top-right → Focus → Do Not Disturb',
        [
          { 
            text: 'Cancel', 
            style: 'cancel' 
          },
          {
            text: "I'm Ready",
            onPress: () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setCountdown(3);
            }
          }
        ]
      );
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCountdown(3);
    }
  };

  // Show loading while requesting permissions
  if (isRequestingPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.content}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>📸 Permissions Required</Text>
            <Text style={styles.permissionText}>
              The Raw Dawg App needs camera, microphone, and photo library access to record your session and save your results.
            </Text>
            <Text style={styles.permissionSubtext}>
              Requesting permissions...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if permission denied
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.content}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>❌ Permissions Denied</Text>
            <Text style={styles.permissionText}>
              To use The Raw Dawg App, please enable Camera, Microphone, and Photos access in:
            </Text>
            <Text style={styles.permissionText}>
              Settings → Privacy & Security → The Raw Dawg App
            </Text>
            <TouchableOpacity
              style={styles.readyButton}
              onPress={onCancel}
            >
              <Text style={styles.readyButtonText}>GO BACK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (countdown !== null) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        {hasPermission ? (
          <CameraView style={styles.camera} facing="front">
            <View style={styles.cameraOverlay}>
              <SafeAreaView style={styles.countdownContainer}>
                <Text style={styles.countdownText}>{countdown}</Text>
                <Text style={styles.countdownLabel}>Get ready...</Text>
              </SafeAreaView>
            </View>
          </CameraView>
        ) : (
          <SafeAreaView style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.countdownLabel}>Get ready...</Text>
          </SafeAreaView>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Prepare Your Space</Text>
          <Text style={styles.duration}>{durationMinutes} minute session</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <InstructionItem text="Find a quiet spot with no distractions" />
          <InstructionItem text="Turn off TV, music, and notifications" />
          <InstructionItem text="Prop your phone up so it can see you" />
          <InstructionItem text="Sit or stand comfortably - you'll stay still" />
          <InstructionItem text="No phone, no scrolling, no fidgeting" />
          <InstructionItem text="Just exist for the next few minutes" />
        </View>

        {/* Incognito Mode Toggle */}
        <TouchableOpacity
          style={styles.incognitoToggle}
          onPress={() => {
            setIncognitoMode(!incognitoMode);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.incognitoContent}>
            <Text style={styles.incognitoIcon}>🕶️</Text>
            <View style={styles.incognitoTextContainer}>
              <Text style={styles.incognitoTitle}>Incognito Mode</Text>
              <Text style={styles.incognitoSubtitle}>
                Black screen - no UI, just recording
              </Text>
            </View>
            <View style={[styles.checkbox, incognitoMode && styles.checkboxActive]}>
              {incognitoMode && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </View>
        </TouchableOpacity>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.readyButton}
            onPress={handleReady}
            activeOpacity={0.8}
          >
            <Text style={styles.readyButtonText}>I'M READY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface InstructionItemProps {
  text: string;
}

function InstructionItem({ text }: InstructionItemProps) {
  return (
    <View style={styles.instructionItem}>
      <View style={styles.bullet} />
      <Text style={styles.instructionText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Brand Kit - Prepare Screen
  container: {
    flex: 1,
    backgroundColor: DS_COLORS.bgDeep,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20, // 1.25rem = 20px per brand kit "Before You Start"
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 0,
    textAlign: 'center',
  },
  duration: {
    fontSize: 16,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textSecondary,
    textAlign: 'center',
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 40,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: DS_COLORS.coral,
    marginTop: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 14, // 0.9rem = ~14px per brand kit body text
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    lineHeight: 24, // 1.5-1.7 line height per brand kit
  },
  // Incognito Mode Toggle
  incognitoToggle: {
    backgroundColor: DS_COLORS.bgSurfaceLight,
    borderRadius: RADIUS.card,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  incognitoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  incognitoIcon: {
    fontSize: 24,
  },
  incognitoTextContainer: {
    flex: 1,
    gap: 2,
  },
  incognitoTitle: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
  },
  incognitoSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: DS_COLORS.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: DS_COLORS.coral,
    borderColor: DS_COLORS.coral,
  },
  checkmark: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
  },
  buttonsContainer: {
    gap: 12,
  },
  // Brand Kit - Ready Button (Primary CTA)
  readyButton: {
    backgroundColor: DS_COLORS.coral,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    ...SHADOWS.coralButton,
  },
  readyButtonText: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 0,
  },
  // Brand Kit - Back Button (Text Button)
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textMuted,
  },
  // Permission Request Screen
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: FONTS.headingBold,
    color: DS_COLORS.textPrimary,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionSubtext: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  // Brand Kit - Countdown Screen
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  countdownText: {
    fontSize: 128, // 8rem = 128px per brand kit
    fontFamily: FONTS.display, // Bebas Neue for countdown
    color: DS_COLORS.textPrimary, // Warm white per brand kit
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 20,
  },
  countdownLabel: {
    fontSize: 16, // 1rem per brand kit
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    textAlign: 'center',
  },
});
