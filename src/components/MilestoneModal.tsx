import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { COLORS as DS_COLORS, FONTS, RADIUS, SHADOWS } from '../constants/designSystem';

const MILESTONE_DATA: Record<number, { emoji: string; title: string; subtitle: string }> = {
  7: {
    emoji: '🔥',
    title: 'ONE WEEK DOWN',
    subtitle: 'Most people quit by day 3. You didn\'t.',
  },
  14: {
    emoji: '🧠',
    title: 'TWO WEEKS STRONG',
    subtitle: 'Your brain is already forming new neural pathways.',
  },
  30: {
    emoji: '💎',
    title: '30-DAY WARRIOR',
    subtitle: 'You\'ve built a real habit. This is rare.',
  },
  60: {
    emoji: '⚡',
    title: '60 DAYS. UNBREAKABLE.',
    subtitle: 'Your attention span has genuinely changed.',
  },
  90: {
    emoji: '👑',
    title: 'PROGRAM COMPLETE',
    subtitle: '90 days of rewiring. You own your attention now.',
  },
};

interface MilestoneModalProps {
  visible: boolean;
  dayNumber: number;
  onDismiss: () => void;
}

export function MilestoneModal({ visible, dayNumber, onDismiss }: MilestoneModalProps) {
  const data = MILESTONE_DATA[dayNumber];
  if (!data) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.emoji}>{data.emoji}</Text>
          <Text style={styles.dayLabel}>DAY {dayNumber}</Text>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.subtitle}>{data.subtitle}</Text>

          <TouchableOpacity style={styles.button} onPress={onDismiss} activeOpacity={0.8}>
            <Text style={styles.buttonText}>KEEP GOING</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export const MILESTONE_DAYS = [7, 14, 30, 60, 90];

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: RADIUS.card,
    borderWidth: 1.5,
    borderColor: DS_COLORS.coral,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    ...SHADOWS.coralButton,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  dayLabel: {
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    color: DS_COLORS.coral,
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: DS_COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: DS_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  button: {
    backgroundColor: DS_COLORS.coral,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: RADIUS.button,
    ...SHADOWS.coralButton,
  },
  buttonText: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: DS_COLORS.textPrimary,
    letterSpacing: 1,
  },
});
