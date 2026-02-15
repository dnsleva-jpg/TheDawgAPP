import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS as DS_COLORS, FONTS, BRAND } from '../constants/designSystem';

const APP_VERSION = '1.0.0';
const PRIVACY_URL = 'https://dnsleva-jpg.github.io/TheDawgAPP/docs/privacy-policy.html';
const CONTACT_EMAIL = 'dustin@sixeightestates.com';
const APP_STORE_URL = 'https://apps.apple.com/app/dawg/id6742598449';

function openURL(url: string) {
  Linking.openURL(url).catch(() => {
    Alert.alert('Error', 'Could not open link.');
  });
}

function handleSignIn() {
  Alert.alert('Coming Soon', 'Account sign-in will be available in a future update.');
}

function handleRateApp() {
  Linking.openURL(`${APP_STORE_URL}?action=write-review`).catch(() => {
    Alert.alert('Error', 'Could not open the App Store.');
  });
}

function handleShareApp() {
  Share.share({
    message: `Check out D.A.W.G. — the art of doing absolutely nothing. Put your phone down and prove it. ${APP_STORE_URL}`,
  }).catch(() => {});
}

function handleContact() {
  Linking.openURL(`mailto:${CONTACT_EMAIL}?subject=D.A.W.G.%20App%20Feedback`).catch(() => {
    Alert.alert('Error', 'Could not open email client.');
  });
}

// ─── Row Component ─────────────────────────────────────────

interface SettingsRowProps {
  label: string;
  onPress: () => void;
}

function SettingsRow({ label, onPress }: SettingsRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.6}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowChevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ────────────────────────────────────────────────

export function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>SETTINGS</Text>

        {/* ─── Account ─────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.section}>
          <SettingsRow label="Sign In" onPress={handleSignIn} />
        </View>

        {/* ─── App ─────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>APP</Text>
        <View style={styles.section}>
          <SettingsRow label="Rate the App" onPress={handleRateApp} />
          <View style={styles.separator} />
          <SettingsRow label="Share the App" onPress={handleShareApp} />
        </View>

        {/* ─── Support ─────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.section}>
          <SettingsRow label="Privacy Policy" onPress={() => openURL(PRIVACY_URL)} />
          <View style={styles.separator} />
          <SettingsRow label="Terms of Service" onPress={() => openURL(PRIVACY_URL)} />
          <View style={styles.separator} />
          <SettingsRow label="Contact Us" onPress={handleContact} />
        </View>

        {/* ─── Footer ──────────────────────────────────────── */}
        <View style={styles.footer}>
          <Text style={styles.footerVersion}>D.A.W.G. v{APP_VERSION}</Text>
          <Text style={styles.footerTagline}>{BRAND.tagline}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────

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
    backgroundColor: 'rgba(255,255,255,0.06)',
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
  rowChevron: {
    fontSize: 22,
    color: DS_COLORS.textDisabled,
    marginLeft: 8,
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
    color: 'rgba(255,255,255,0.2)',
  },
});
