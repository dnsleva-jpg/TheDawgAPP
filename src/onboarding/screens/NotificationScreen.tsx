import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';

interface NotificationScreenProps {
  onNext: () => void;
  screenIndex: number;
}

export function NotificationScreen({ onNext, screenIndex }: NotificationScreenProps) {
  const handleEnable = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      // Proceed regardless of result — never punish declining
    } catch {
      // Permission request failed
    }
    onNext();
  };

  return (
    <OnboardingLayout screenIndex={screenIndex} scrollable={false}>
      <View style={styles.content}>
        <View style={styles.mockNotification}>
          <View style={styles.notifHeader}>
            <Text style={styles.notifAppIcon}>🧠</Text>
            <Text style={styles.notifAppName}>DO NOTHIN.</Text>
            <Text style={styles.notifTime}>now</Text>
          </View>
          <Text style={styles.notifTitle}>Day 3: Phone-free breakfast</Text>
          <Text style={styles.notifBody}>
            Leave your phone in another room while you eat. Your brain processes food and gratitude differently without a screen.
          </Text>
        </View>

        <Text style={styles.headline}>Never miss your daily challenge.</Text>

        <View style={styles.bullets}>
          <View style={styles.bullet}>
            <Text style={styles.bulletIcon}>🔔</Text>
            <Text style={styles.bulletText}>Your daily challenge delivered each morning</Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletIcon}>🔥</Text>
            <Text style={styles.bulletText}>Streak reminders so you don't break the chain</Text>
          </View>
          <View style={styles.bullet}>
            <Text style={styles.bulletIcon}>📈</Text>
            <Text style={styles.bulletText}>Weekly Brain Recovery Score updates</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <OnboardingButton title="Turn On Reminders" onPress={handleEnable} />
        <OnboardingButton title="Not now" onPress={onNext} variant="text" />
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  mockNotification: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(28,18,8,0.08)',
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  notifAppIcon: {
    fontSize: 16,
  },
  notifAppName: {
    fontFamily: FONTS.heading,
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  notifTime: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  notifTitle: {
    fontFamily: FONTS.heading,
    fontSize: 15,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  notifBody: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    marginBottom: 24,
  },
  bullets: {
    gap: 12,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
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
