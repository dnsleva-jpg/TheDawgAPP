// PrepareScreen: Pre-session preparation screen (permissions, instructions, countdown).
// NOTE: This is NOT called "CountdownScreen" — it's PrepareScreen. The countdown is just
// one phase of this screen. Uses react-native-vision-camera for the 3-2-1 countdown preview.
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';
import { COLORS as DS_COLORS, FONTS, RADIUS, SHADOWS } from '../constants/designSystem';

export type ProtectionLevel = 'easy' | 'strict' | 'ruthless';

interface PrepareScreenProps {
  durationMinutes: number;
  isRogueMode?: boolean;
  onReady: (incognitoMode?: boolean, protectionLevel?: ProtectionLevel) => void;
  onCancel: () => void;
}

export function PrepareScreen({ 
  durationMinutes, 
  isRogueMode = false,
  onReady,
  onCancel,
}: PrepareScreenProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [mediaLibraryGranted, setMediaLibraryGranted] = useState<boolean | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(true);
  const [incognitoMode, setIncognitoMode] = useState<boolean>(false);
  const [protectionLevel, setProtectionLevel] = useState<ProtectionLevel>('easy');

  // Vision Camera hooks
  const device = useCameraDevice('front');
  const { hasPermission: cameraGranted, requestPermission: requestCameraPermission } = useCameraPermission();

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      setIsRequestingPermission(true);
      try {
        // Request camera permission via Vision Camera
        await requestCameraPermission();

        // Request media library permission (still needed for SelfieScreen photo saving)
        const mediaResult = await MediaLibrary.requestPermissionsAsync();
        setMediaLibraryGranted(mediaResult.status === 'granted');
      } catch (error) {
        // Permission request failed -- will show denial screen
      }
      setIsRequestingPermission(false);
    })();
  }, []);

  const allPermissionsGranted = cameraGranted && mediaLibraryGranted;

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onReady(incognitoMode, protectionLevel);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onReady, incognitoMode, protectionLevel]);

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
              The D.A.W.G. App needs camera and photo library access to verify your session and save your results.
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
  if (!allPermissionsGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.content}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>Permissions Required</Text>
            <Text style={styles.permissionText}>
              D.A.W.G. needs Camera and Photos access to verify your sessions and save your results.
            </Text>
            <Text style={styles.permissionText}>
              Please enable them in Settings.
            </Text>
            <TouchableOpacity
              style={styles.readyButton}
              onPress={() => Linking.openSettings()}
              accessibilityLabel="Open device settings"
              accessibilityRole="button"
            >
              <Text style={styles.readyButtonText}>OPEN SETTINGS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onCancel}
              accessibilityLabel="Go back to home screen"
              accessibilityRole="button"
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Countdown phase with camera preview
  if (countdown !== null) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        {device ? (
          <>
            <Camera
              device={device}
              isActive={true}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.cameraOverlay}>
              <SafeAreaView style={styles.countdownContainer}>
                <Text style={styles.countdownText}>{countdown}</Text>
                <Text style={styles.countdownLabel}>Get ready...</Text>
              </SafeAreaView>
            </View>
          </>
        ) : (
          <SafeAreaView style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.countdownLabel}>Get ready...</Text>
          </SafeAreaView>
        )}
      </View>
    );
  }

  const handleSelectProtection = (level: ProtectionLevel) => {
    if (level === 'ruthless') {
      if (isRogueMode) {
        Alert.alert('Not Available', 'Ruthless Mode cannot be used with Rogue Mode (infinite timer).');
        return;
      }
      Alert.alert(
        'D.A.W.G. Pro',
        'Ruthless Mode requires D.A.W.G. Pro — $4.99/month.\n\nComing soon!',
        [{ text: 'OK' }]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setProtectionLevel(level);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Prepare Your Space</Text>
          <Text style={styles.duration}>
            {isRogueMode ? 'Rogue Mode' : `${durationMinutes} minute session`}
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <InstructionItem text="Find a quiet spot with no distractions" />
          <InstructionItem text="Prop your phone up so it can see you" />
          <InstructionItem text="Sit or stand comfortably - you'll stay still" />
          <InstructionItem text="No phone, no scrolling, no fidgeting" />
        </View>

        {/* Protection Level Selector */}
        <View style={styles.protectionSection}>
          <Text style={styles.protectionTitle}>Protection Level</Text>

          {/* Easy */}
          <TouchableOpacity
            style={[
              styles.protectionCard,
              protectionLevel === 'easy' && styles.protectionCardSelected,
            ]}
            onPress={() => handleSelectProtection('easy')}
            activeOpacity={0.7}
          >
            <Text style={styles.protectionIcon}>🟢</Text>
            <View style={styles.protectionTextContainer}>
              <Text style={styles.protectionName}>Easy Mode</Text>
              <Text style={styles.protectionSubtitle}>Quit anytime</Text>
              <Text style={styles.protectionDesc}>No restrictions. Tap Give Up whenever you want.</Text>
            </View>
          </TouchableOpacity>

          {/* Strict */}
          <TouchableOpacity
            style={[
              styles.protectionCard,
              protectionLevel === 'strict' && styles.protectionCardSelectedStrict,
            ]}
            onPress={() => handleSelectProtection('strict')}
            activeOpacity={0.7}
          >
            <Text style={styles.protectionIcon}>🟡</Text>
            <View style={styles.protectionTextContainer}>
              <Text style={styles.protectionName}>Strict Mode</Text>
              <Text style={styles.protectionSubtitle}>Think before you quit</Text>
              <Text style={styles.protectionDesc}>10-second cooldown + must give a reason to quit.</Text>
            </View>
          </TouchableOpacity>

          {/* Ruthless */}
          <TouchableOpacity
            style={[
              styles.protectionCard,
              styles.protectionCardRuthless,
            ]}
            onPress={() => handleSelectProtection('ruthless')}
            activeOpacity={0.7}
          >
            <Text style={styles.protectionIcon}>🔴</Text>
            <View style={styles.protectionTextContainer}>
              <View style={styles.ruthlessHeader}>
                <Text style={styles.protectionName}>Ruthless Mode</Text>
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
              <Text style={styles.protectionSubtitle}>No escape</Text>
              <Text style={styles.protectionDesc}>Give Up is disabled. You MUST finish.</Text>
            </View>
            <Text style={styles.lockIcon}>🔒</Text>
          </TouchableOpacity>
        </View>

        {/* Incognito Mode Toggle */}
        <TouchableOpacity
          style={styles.incognitoToggle}
          onPress={() => {
            setIncognitoMode(!incognitoMode);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.7}
          accessibilityLabel={incognitoMode ? 'Incognito mode, on' : 'Incognito mode, off'}
          accessibilityRole="button"
        >
          <View style={styles.incognitoContent}>
            <Text style={styles.incognitoIcon}>🕶️</Text>
            <View style={styles.incognitoTextContainer}>
              <Text style={styles.incognitoTitle}>Incognito Mode</Text>
              <Text style={styles.incognitoSubtitle}>
                Black screen - no UI, just monitoring
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
            accessibilityLabel="I'm ready"
            accessibilityRole="button"
          >
            <Text style={styles.readyButtonText}>I'M READY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={onCancel}
            activeOpacity={0.8}
            accessibilityLabel="Go back to home screen"
            accessibilityRole="button"
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
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
    gap: 16,
    paddingVertical: 20,
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
  // Protection Level
  protectionSection: {
    gap: 10,
  },
  protectionTitle: {
    fontSize: 13,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  protectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  protectionCardSelected: {
    borderColor: DS_COLORS.verified,
    backgroundColor: 'rgba(46, 204, 113, 0.08)',
  },
  protectionCardSelectedStrict: {
    borderColor: '#F39C12',
    backgroundColor: 'rgba(243, 156, 18, 0.08)',
  },
  protectionCardRuthless: {
    borderColor: 'rgba(233, 69, 96, 0.3)',
    opacity: 0.6,
  },
  protectionIcon: {
    fontSize: 22,
  },
  protectionTextContainer: {
    flex: 1,
    gap: 1,
  },
  protectionName: {
    fontSize: 15,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
  },
  protectionSubtitle: {
    fontSize: 12,
    fontFamily: FONTS.headingMedium,
    color: DS_COLORS.textSecondary,
  },
  protectionDesc: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
    marginTop: 2,
  },
  ruthlessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  proBadge: {
    backgroundColor: DS_COLORS.coral,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 1,
  },
  lockIcon: {
    fontSize: 16,
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
    ...StyleSheet.absoluteFillObject,
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
