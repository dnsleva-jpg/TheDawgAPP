import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Notifications from 'expo-notifications';
import { COLORS as DS_COLORS, FONTS, BRAND, RADIUS } from '../constants/designSystem';
import { getStreakData, StreakData } from '../utils/streakManager';
import { scheduleDailyNotification } from '../utils/notificationService';
import { resetOnboarding } from '../onboarding/onboardingStorage';
import useAuth from '../../hooks/useAuth';
import { restorePurchases } from '../utils/subscriptionService';
import { DOOM_SCROLL_APPS, getShieldConfig, saveShieldConfig } from '../utils/shieldService';

const APP_VERSION = '1.0.0';
const PRIVACY_URL = 'https://dnsleva-jpg.github.io/TheDawgAPP/docs/privacy-policy.html';
const CONTACT_EMAIL = 'dnsleva@yahoo.com';
const APP_STORE_URL = 'https://apps.apple.com/app/dawg/id6758909198';

function openURL(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert('Error', 'Could not open link.');
  });
}

// ─── Row Components ───────────────────────────────────────

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingsRow({ label, value, onPress, destructive }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
    >
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
      {value ? (
        <Text style={styles.rowValue}>{value}</Text>
      ) : onPress ? (
        <Text style={styles.rowChevron}>›</Text>
      ) : null}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────

export function SettingsScreen() {
  const { user, signInWithApple, signOut } = useAuth();
  const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, lastSessionDate: null, longestStreak: 0 });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [enabledApps, setEnabledApps] = useState<string[]>([]);

  useEffect(() => {
    getStreakData().then(setStreakData).catch(() => {});
    Notifications.getPermissionsAsync().then(({ status }) => {
      setNotificationsEnabled(status === 'granted');
    });
    getShieldConfig().then((c) => setEnabledApps(c.enabledApps)).catch(() => {});
  }, []);

  const handleToggleShieldApp = async (appId: string) => {
    const updated = enabledApps.includes(appId)
      ? enabledApps.filter((id) => id !== appId)
      : [...enabledApps, appId];
    setEnabledApps(updated);
    await saveShieldConfig({ enabledApps: updated });
  };

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotificationsEnabled(false);
    } else {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        await scheduleDailyNotification();
        setNotificationsEnabled(true);
      } else {
        Alert.alert('Notifications Disabled', 'Enable notifications in Settings to receive daily reminders.');
      }
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithApple();
    } catch {
      // User cancelled or error
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleRestorePurchase = async () => {
    try {
      const isPro = await restorePurchases();
      if (isPro) {
        Alert.alert('Restored!', 'Your subscription has been restored.');
      } else {
        Alert.alert('No Subscription', 'No active subscription found.');
      }
    } catch {
      Alert.alert('Error', 'Could not restore purchases.');
    }
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will replay the onboarding flow next time you open the app. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();
            Alert.alert('Done', 'Restart the app to see the onboarding flow.');
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>SETTINGS</Text>

        {/* ─── Account ─────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.section}>
          {user ? (
            <>
              <SettingsRow label="Signed in as" value={user.email ?? 'Apple ID'} />
              <View style={styles.separator} />
              <SettingsRow label="Sign Out" onPress={handleSignOut} destructive />
            </>
          ) : (
            <TouchableOpacity style={styles.appleSignInRow} onPress={handleSignIn} activeOpacity={0.7}>
              {Platform.OS === 'ios' ? (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                  cornerRadius={8}
                  style={{ width: '100%', height: 44 }}
                  onPress={handleSignIn}
                />
              ) : (
                <Text style={styles.rowLabel}>Sign in not available on this platform</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ─── Streak ──────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>STREAK</Text>
        <View style={styles.section}>
          <SettingsRow label="Current Streak" value={`${streakData.currentStreak} days`} />
          <View style={styles.separator} />
          <SettingsRow label="Longest Streak" value={`${streakData.longestStreak} days`} />
        </View>

        {/* ─── Notifications ───────────────────────────────── */}
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={handleToggleNotifications} activeOpacity={0.6}>
            <Text style={styles.rowLabel}>Daily Reminders</Text>
            <Text style={[styles.rowValue, { color: notificationsEnabled ? DS_COLORS.verified : DS_COLORS.textMuted }]}>
              {notificationsEnabled ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── Doom Scroll Shield ──────────────────────────── */}
        <Text style={styles.sectionTitle}>DOOM SCROLL SHIELD</Text>
        <View style={styles.section}>
          {DOOM_SCROLL_APPS.map((app, i) => (
            <React.Fragment key={app.id}>
              {i > 0 && <View style={styles.separator} />}
              <TouchableOpacity
                style={styles.row}
                onPress={() => handleToggleShieldApp(app.id)}
                activeOpacity={0.6}
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>{app.emoji}</Text>
                <Text style={[styles.rowLabel, { flex: 1 }]}>{app.label}</Text>
                <Text style={[styles.rowValue, {
                  color: enabledApps.includes(app.id) ? DS_COLORS.verified : DS_COLORS.textMuted,
                }]}>
                  {enabledApps.includes(app.id) ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        {/* ─── App ─────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>APP</Text>
        <View style={styles.section}>
          <SettingsRow label="Rate the App" onPress={() => Linking.openURL(`${APP_STORE_URL}?action=write-review`)} />
          <View style={styles.separator} />
          <SettingsRow
            label="Share the App"
            onPress={() => Share.share({ message: `Check out DO NOTHIN. — Own Your Attention. ${APP_STORE_URL}` })}
          />
          <View style={styles.separator} />
          <SettingsRow label="Restore Purchase" onPress={handleRestorePurchase} />
        </View>

        {/* ─── Support ─────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.section}>
          <SettingsRow label="Privacy Policy" onPress={() => openURL(PRIVACY_URL)} />
          <View style={styles.separator} />
          <SettingsRow label="Terms of Service" onPress={() => openURL(PRIVACY_URL)} />
          <View style={styles.separator} />
          <SettingsRow label="Contact Us" onPress={() => openURL(`mailto:${CONTACT_EMAIL}?subject=DO%20NOTHIN%20Feedback`)} />
        </View>

        {/* ─── Developer ───────────────────────────────────── */}
        <Text style={styles.sectionTitle}>DEVELOPER</Text>
        <View style={styles.section}>
          <SettingsRow label="Reset Onboarding" onPress={handleResetOnboarding} destructive />
        </View>

        {/* ─── Footer ──────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerVersion}>DO NOTHIN. v{APP_VERSION}</Text>
          <Text style={styles.footerTagline}>{BRAND.tagline}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DS_COLORS.bgDeep,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  header: {
    fontSize: 36,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 28,
  },

  // ── Sections ──
  sectionTitle: {
    fontSize: 11,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 8,
    marginTop: 24,
    marginLeft: 4,
  },
  section: {
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: 14,
    overflow: 'hidden',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(28,18,8,0.06)',
    marginLeft: 16,
  },

  // ── Rows ──
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textPrimary,
  },
  rowLabelDestructive: {
    color: '#E74C3C',
  },
  rowValue: {
    fontSize: 14,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textSecondary,
  },
  rowChevron: {
    fontSize: 22,
    color: DS_COLORS.textDisabled,
    marginLeft: 8,
  },
  appleSignInRow: {
    padding: 16,
  },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    marginTop: 48,
    gap: 6,
  },
  footerVersion: {
    fontSize: 13,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textDisabled,
  },
  footerTagline: {
    fontSize: 12,
    fontFamily: FONTS.body,
    fontStyle: 'italic',
    color: 'rgba(28,18,8,0.15)',
  },
});
