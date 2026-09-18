import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { useCameraPermission } from 'react-native-vision-camera';
import { COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';

interface CameraPermissionScreenProps {
  onNext: () => void;
  screenIndex: number;
}

export function CameraPermissionScreen({ onNext, screenIndex }: CameraPermissionScreenProps) {
  const { hasPermission, requestPermission } = useCameraPermission();

  const handleEnable = async () => {
    if (hasPermission) {
      onNext();
      return;
    }
    const granted = await requestPermission();
    if (granted) {
      onNext();
    } else {
      // Permission denied — user can still skip or open settings
      Linking.openSettings();
    }
  };

  return (
    <OnboardingLayout screenIndex={screenIndex} scrollable={false}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>📹</Text>
          <View style={styles.scanLines}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={[styles.scanLine, { opacity: 0.3 - i * 0.08 }]} />
            ))}
          </View>
        </View>

        <Text style={styles.headline}>See your focus in real-time.</Text>
        <Text style={styles.subheadline}>
          The camera uses on-device face tracking to measure your stillness and blink rate. No data leaves your phone.
        </Text>

        <View style={styles.bullets}>
          <View style={styles.bullet}>
            <Text style={styles.bulletIcon}>📹</Text>
            <Text style={styles.bulletText}>Watch your stillness score live during sessions</Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletIcon}>👁️</Text>
            <Text style={styles.bulletText}>Track your blink rate to measure focus improvement</Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletIcon}>🏆</Text>
            <Text style={styles.bulletText}>Get a verified score no one can fake</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <OnboardingButton title="Enable Camera" onPress={handleEnable} />
        <OnboardingButton title="Not now" onPress={onNext} variant="text" />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: COLORS.coral,
  },
  icon: {
    fontSize: 40,
  },
  scanLines: {
    position: 'absolute',
    bottom: -20,
    gap: 4,
  },
  scanLine: {
    width: 60,
    height: 2,
    backgroundColor: COLORS.coral,
    borderRadius: 1,
  },
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subheadline: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  bullets: {
    alignSelf: 'stretch',
    gap: 16,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    gap: 14,
  },
  bulletIcon: {
    fontSize: 24,
  },
  bulletText: {
    flex: 1,
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 21,
  },
  footer: {
    gap: 4,
  },
});
