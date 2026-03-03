import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS as DS_COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import type { EvaluatedChallenge } from '../../utils/challengeManager';

interface Props {
  challenges: EvaluatedChallenge[];
  isPro: boolean;
  onLockPress: () => void;
}

function ChallengeCard({ challenge }: { challenge: EvaluatedChallenge }) {
  const isLocked = !challenge.unlocked;
  const dimmed = isLocked;
  const progress = Math.min(1, challenge.progress / challenge.target);

  return (
    <View
      style={[
        styles.card,
        challenge.completed && styles.cardCompleted,
        dimmed && styles.cardDimmed,
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.icon, dimmed && styles.textDimmed]}>
          {challenge.completed ? '✓' : challenge.icon}
        </Text>
        <View style={styles.titleRow}>
          <Text style={[styles.title, dimmed && styles.textDimmed]}>
            {challenge.title}
          </Text>
          {isLocked && (
            <Text style={styles.lockedText}>🔒</Text>
          )}
        </View>
      </View>

      <Text style={[styles.description, dimmed && styles.textDimmed]}>
        {challenge.description}
      </Text>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
              challenge.completed && styles.progressFillComplete,
            ]}
          />
        </View>
        <Text style={[styles.progressText, dimmed && styles.textDimmed]}>
          {challenge.progress}/{challenge.target}
        </Text>
      </View>
    </View>
  );
}

export function ChallengesSection({ challenges }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>CHALLENGES</Text>
      <View style={styles.list}>
        {challenges.map((c) => (
          <ChallengeCard key={c.id} challenge={c} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    fontSize: 22,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
  },
  list: {
    gap: 10,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: RADIUS.card,
    padding: 16,
    gap: 10,
  },
  cardCompleted: {
    borderWidth: 1,
    borderColor: 'rgba(39, 174, 96, 0.3)',
  },
  cardDimmed: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icon: {
    fontSize: 20,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  lockedText: {
    fontSize: 12,
  },
  description: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    lineHeight: 18,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: DS_COLORS.coral,
    borderRadius: 3,
  },
  progressFillComplete: {
    backgroundColor: '#27AE60',
  },
  progressText: {
    fontSize: 11,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textMuted,
    minWidth: 32,
    textAlign: 'right',
  },
  textDimmed: {
    color: DS_COLORS.textDisabled,
  },
});
