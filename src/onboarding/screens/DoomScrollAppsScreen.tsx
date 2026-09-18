import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../constants/designSystem';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { OnboardingButton } from '../components/OnboardingButton';
import { OptionCard } from '../components/OptionCard';
import { saveOnboardingData } from '../onboardingStorage';
import { saveShieldConfig } from '../../utils/shieldService';

const DOOM_SCROLL_APPS = [
  { emoji: '📸', label: 'Instagram', id: 'instagram' },
  { emoji: '🎵', label: 'TikTok', id: 'tiktok' },
  { emoji: '𝕏', label: 'Twitter / X', id: 'twitter' },
  { emoji: '🤖', label: 'Reddit', id: 'reddit' },
  { emoji: '▶️', label: 'YouTube', id: 'youtube' },
  { emoji: '👻', label: 'Snapchat', id: 'snapchat' },
  { emoji: '📘', label: 'Facebook', id: 'facebook' },
  { emoji: '📰', label: 'News Apps', id: 'news' },
];

interface DoomScrollAppsScreenProps {
  onNext: () => void;
  screenIndex: number;
}

export function DoomScrollAppsScreen({ onNext, screenIndex }: DoomScrollAppsScreenProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    await saveOnboardingData({ doomScrollApps: selected });
    await saveShieldConfig({ enabledApps: selected });
    onNext();
  };

  return (
    <OnboardingLayout screenIndex={screenIndex}>
      <Text style={styles.headline}>Which apps drain your focus?</Text>
      <Text style={styles.subheadline}>
        We'll help you pause before opening these. Calls and texts are fine — this is about doom scrolling.
      </Text>

      <View style={styles.options}>
        {DOOM_SCROLL_APPS.map((app) => (
          <OptionCard
            key={app.id}
            emoji={app.emoji}
            label={app.label}
            selected={selected.includes(app.id)}
            onPress={() => toggleSelection(app.id)}
            multiSelect
          />
        ))}
      </View>

      <OnboardingButton
        title="Continue"
        onPress={handleContinue}
        disabled={selected.length === 0}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subheadline: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  options: {
    marginBottom: 24,
  },
});
