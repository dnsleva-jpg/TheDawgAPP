import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, AppState } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { getOnboardingData } from '../onboardingStorage';
import { saveShieldConfig, DOOM_SCROLL_APPS } from '../../utils/shieldService';

interface ShortcutsSetupScreenProps {
  onNext: () => void;
  screenIndex: number;
}

type Phase = 'intro' | 'setup' | 'returned' | 'done';

export function ShortcutsSetupScreen({ onNext, screenIndex }: ShortcutsSetupScreenProps) {
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedApps, setCompletedApps] = useState<string[]>([]);
  const sentToShortcuts = useRef(false);

  useEffect(() => {
    (async () => {
      const data = await getOnboardingData();
      setSelectedApps(data.doomScrollApps ?? []);
    })();
  }, []);

  // Detect when user comes back from Shortcuts app
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && sentToShortcuts.current) {
        sentToShortcuts.current = false;
        setPhase('returned');
      }
    });
    return () => sub.remove();
  }, []);

  const currentAppId = selectedApps[currentIndex];
  const currentApp = DOOM_SCROLL_APPS.find((a) => a.id === currentAppId);
  const url = `donothin://intercept?app=${currentAppId}`;

  const handleCopyAndOpen = async () => {
    // Copy the URL to clipboard
    await Clipboard.setStringAsync(url);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Mark that we're heading to Shortcuts
    sentToShortcuts.current = true;
    setPhase('setup');

    // Open Shortcuts app
    Linking.openURL('shortcuts://').catch(() => {
      Linking.openURL('https://apps.apple.com/app/shortcuts/id915249334').catch(() => {});
    });
  };

  const advanceToNext = (markComplete: boolean) => {
    if (markComplete) {
      setCompletedApps((prev) => [...prev, currentAppId]);
    }

    if (currentIndex < selectedApps.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setPhase('intro'); // Reset phase for next app but stay in per-app view
      // Actually go straight to the app card, not back to intro
      if (currentIndex > 0 || markComplete) {
        // Already past intro, just show next app
      }
    } else {
      setPhase('done');
    }
  };

  const handleFinish = async () => {
    await saveShieldConfig({ shortcutsConfigured: completedApps.length > 0 });
    onNext();
  };

  if (selectedApps.length === 0) {
    // No apps selected, skip
    onNext();
    return null;
  }

  // ─── Intro (shown once) ───────────────────────────────

  if (phase === 'intro' && currentIndex === 0) {
    return (
      <OnboardingLayout screenIndex={screenIndex} scrollable={false}>
        <View style={styles.centered}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={48} color={COLORS.coral} />
          </View>

          <Text style={styles.headline}>Activate Your Shield</Text>
          <Text style={styles.body}>
            For each app you picked, we'll copy a link and send you to the Shortcuts app. You'll create a quick automation — takes about 30 seconds per app.
          </Text>

          <View style={styles.previewRow}>
            {selectedApps.map((id) => {
              const app = DOOM_SCROLL_APPS.find((a) => a.id === id);
              return (
                <View key={id} style={styles.previewChip}>
                  <Text style={styles.previewEmoji}>{app?.emoji}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.fullWidth}>
            <OnboardingButton
              title={`Set up ${selectedApps.length} app${selectedApps.length === 1 ? '' : 's'}`}
              onPress={() => setPhase('setup')}
            />
            <OnboardingButton
              title="Skip for now"
              onPress={onNext}
              variant="text"
            />
          </View>
        </View>
      </OnboardingLayout>
    );
  }

  // ─── Done ─────────────────────────────────────────────

  if (phase === 'done') {
    return (
      <OnboardingLayout screenIndex={screenIndex} scrollable={false}>
        <View style={styles.centered}>
          <Ionicons name="checkmark-circle" size={64} color={COLORS.verified} />
          <Text style={[styles.headline, { marginTop: 16 }]}>
            {completedApps.length > 0 ? 'Shield Active' : 'No worries'}
          </Text>
          <Text style={styles.body}>
            {completedApps.length > 0
              ? `${completedApps.length} app${completedApps.length === 1 ? '' : 's'} protected. You can add more anytime in Settings.`
              : 'You can set up Shield later in Settings whenever you\'re ready.'}
          </Text>
          <View style={styles.fullWidth}>
            <OnboardingButton title="Continue" onPress={handleFinish} />
          </View>
        </View>
      </OnboardingLayout>
    );
  }

  // ─── "Welcome back" after returning from Shortcuts ────

  if (phase === 'returned') {
    return (
      <OnboardingLayout screenIndex={screenIndex} scrollable={false}>
        <View style={styles.centered}>
          <Text style={styles.returnEmoji}>{currentApp?.emoji}</Text>
          <Text style={styles.headline}>Did you set up {currentApp?.label}?</Text>
          <Text style={styles.body}>
            If you created the automation and pasted the URL, you're all set for this app.
          </Text>

          <View style={styles.fullWidth}>
            <OnboardingButton
              title="Yes, it's set up"
              onPress={() => advanceToNext(true)}
            />
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleCopyAndOpen}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh-outline" size={16} color={COLORS.coral} />
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
            <OnboardingButton
              title="Skip this app"
              onPress={() => advanceToNext(false)}
              variant="text"
            />
          </View>
        </View>
      </OnboardingLayout>
    );
  }

  // ─── Per-app setup screen ─────────────────────────────

  return (
    <OnboardingLayout screenIndex={screenIndex}>
      {/* Progress dots */}
      <View style={styles.progressRow}>
        {selectedApps.map((id, i) => (
          <View
            key={id}
            style={[
              styles.dot,
              completedApps.includes(id) && styles.dotDone,
              i === currentIndex && styles.dotCurrent,
            ]}
          />
        ))}
      </View>

      {/* App header */}
      <View style={styles.appHeader}>
        <Text style={styles.appEmoji}>{currentApp?.emoji}</Text>
        <Text style={styles.appName}>{currentApp?.label}</Text>
        <Text style={styles.appSub}>App {currentIndex + 1} of {selectedApps.length}</Text>
      </View>

      {/* The one big action button */}
      <TouchableOpacity
        style={styles.bigAction}
        onPress={handleCopyAndOpen}
        activeOpacity={0.8}
      >
        <View style={styles.bigActionIcon}>
          <Ionicons name="copy-outline" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.bigActionText}>
          <Text style={styles.bigActionTitle}>Copy Link & Open Shortcuts</Text>
          <Text style={styles.bigActionSub}>URL copied to your clipboard automatically</Text>
        </View>
        <Ionicons name="open-outline" size={20} color="rgba(28,18,8,0.4)" />
      </TouchableOpacity>

      {/* Mini guide - what to do in Shortcuts */}
      <View style={styles.miniGuide}>
        <Text style={styles.miniGuideTitle}>IN THE SHORTCUTS APP:</Text>
        <MiniStep number="1" text="Tap Automation → + New Automation" />
        <MiniStep number="2" text={`Select App → choose ${currentApp?.label} → "Is Opened"`} />
        <MiniStep number="3" text='Search "Open URLs" → paste the link' />
        <MiniStep number="4" text='Turn OFF "Ask Before Running" → Done' />
      </View>

      {/* Skip */}
      <OnboardingButton
        title="Skip this app"
        onPress={() => advanceToNext(false)}
        variant="text"
      />
    </OnboardingLayout>
  );
}

function MiniStep({ number, text }: { number: string; text: string }) {
  return (
    <View style={styles.miniStepRow}>
      <View style={styles.miniStepDot}>
        <Text style={styles.miniStepNumber}>{number}</Text>
      </View>
      <Text style={styles.miniStepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
    gap: 4,
    marginTop: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 77, 106, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  // Preview chips
  previewRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 24,
    marginBottom: 8,
  },
  previewChip: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewEmoji: {
    fontSize: 22,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bgSurfaceLight,
  },
  dotCurrent: {
    backgroundColor: COLORS.coral,
    width: 24,
    borderRadius: 4,
  },
  dotDone: {
    backgroundColor: COLORS.verified,
  },

  // App header
  appHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  appEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  appName: {
    fontFamily: FONTS.headingBold,
    fontSize: 24,
    color: COLORS.textPrimary,
  },
  appSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  // Big action button
  bigAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.card,
    padding: 16,
    gap: 14,
    marginBottom: 24,
  },
  bigActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(28,18,8,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigActionText: {
    flex: 1,
  },
  bigActionTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: '#1C1208',
  },
  bigActionSub: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },

  // Mini guide
  miniGuide: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 16,
  },
  miniGuideTitle: {
    fontFamily: FONTS.monoMedium,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  miniStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  miniStepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.bgSurfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStepNumber: {
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  miniStepText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Return screen
  returnEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  retryText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.coral,
  },
});
