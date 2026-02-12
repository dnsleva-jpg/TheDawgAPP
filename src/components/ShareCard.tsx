import React, { useMemo, forwardRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import ViewShot from 'react-native-view-shot';
import { FONTS } from '../constants/designSystem';
import type { SessionResults } from '../scoring/scoringEngine';

const SCREEN_WIDTH = Dimensions.get('window').width;
// 9:16 aspect ratio — fill most of the width with padding
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = CARD_WIDTH * (16 / 9);

// ─── Grade colors ────────────────────────────────────────────────────────────
const GRADE_COLORS: Record<string, string> = {
  S: '#8E44AD',
  A: '#27AE60',
  B: '#2980B9',
  C: '#F39C12',
  D: '#E67E22',
  F: '#E74C3C',
};

function gradeColor(grade: string): string {
  return GRADE_COLORS[grade.charAt(0)] ?? '#F39C12';
}

// ─── Grade modifier (same logic as ResultsScreen) ────────────────────────────
function getGradeWithModifier(score: number, baseGrade: string): string {
  const bands: { grade: string; min: number; max: number }[] = [
    { grade: 'S', min: 90, max: 100 },
    { grade: 'A', min: 80, max: 89 },
    { grade: 'B', min: 65, max: 79 },
    { grade: 'C', min: 50, max: 64 },
    { grade: 'D', min: 30, max: 49 },
  ];
  const band = bands.find((b) => b.grade === baseGrade);
  if (!band) return baseGrade;
  const range = band.max - band.min + 1;
  const third = range / 3;
  if (score >= band.min + 2 * third) return `${baseGrade}+`;
  if (score < band.min + third) return `${baseGrade}-`;
  return baseGrade;
}

// ─── Roast / flex lines ──────────────────────────────────────────────────────
const ROAST_LINES: Record<string, string[]> = {
  S: ['Statue mode unlocked.', 'Your phone filed a missing persons report.'],
  A: ["Your phone wishes you'd pick it up.", 'Monk mode: activated.'],
  B: ['Not bad. Not a monk. Not bad.', 'Your attention span has potential.'],
  C: ['Lasted longer than your last screen time report.', "Rome wasn't built in a day."],
  D: ['At least you showed up.', 'The journey of 1000 sits begins with one.'],
  F: ['The phone won this round.', 'Participation trophy earned.'],
};

function pickRoast(grade: string): string {
  const lines = ROAST_LINES[grade.charAt(0)] ?? ROAST_LINES.F;
  return lines[Math.floor(Math.random() * lines.length)];
}

// ─── Format helpers ──────────────────────────────────────────────────────────
function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface ShareCardProps {
  scoringResults: SessionResults;
  completedSeconds: number;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const ShareCard = forwardRef<ViewShot, ShareCardProps>(
  ({ scoringResults, completedSeconds }, ref) => {
    const score = Math.round(scoringResults.rawDawgScore);
    const baseGrade = scoringResults.grade;
    const displayGrade = getGradeWithModifier(scoringResults.rawDawgScore, baseGrade);
    const color = gradeColor(baseGrade);
    const label = scoringResults.label;

    // Pick roast line once on mount
    const roastLine = useMemo(() => pickRoast(baseGrade), [baseGrade]);

    return (
      <ViewShot
        ref={ref}
        options={{ format: 'png', quality: 1, result: 'tmpfile' }}
        style={styles.shotContainer}
      >
        <LinearGradient
          colors={['#1a1a2e', '#16213e']}
          style={styles.card}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          {/* 1. TOP — Branding */}
          <View style={styles.topSection}>
            <Text style={styles.brandName}>RAW DAWG</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedDot}>●</Text>
              <Text style={styles.verifiedText}>CAMERA VERIFIED</Text>
            </View>
          </View>

          {/* 2. HERO — Grade letter + score */}
          <View style={styles.heroSection}>
            <Text style={[styles.heroGrade, { color }]}>{displayGrade}</Text>
            <Text style={styles.heroScore}>{score}</Text>
            <Text style={[styles.heroLabel, { color }]}>{label}</Text>
          </View>

          {/* 3. ROAST LINE */}
          <Text style={styles.roastLine}>{roastLine}</Text>

          {/* 4. STAT PILLS */}
          <View style={styles.pillRow}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                🐶 {Math.round(scoringResults.stillnessPercent)}% still
              </Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                👁 {scoringResults.blinksPerMinute.toFixed(0)}/min
              </Text>
            </View>
            <View style={styles.pill}>
              <Text style={styles.pillText}>
                ⏱ {formatDuration(completedSeconds)}
              </Text>
            </View>
          </View>

          {/* 5. BOTTOM — Handle + tagline */}
          <View style={styles.bottomSection}>
            <View style={styles.divider} />
            <Text style={styles.handle}>@TheRAWDAWGapp</Text>
            <Text style={styles.tagline}>the art of doing absolutely nothing</Text>
          </View>
        </LinearGradient>
      </ViewShot>
    );
  },
);

ShareCard.displayName = 'ShareCard';

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  shotContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
  },
  card: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 32,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },

  // 1. Top
  topSection: {
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontSize: 32,
    fontFamily: FONTS.display,
    color: '#F0EDE8',
    letterSpacing: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedDot: {
    fontSize: 8,
    color: '#2ECC71',
  },
  verifiedText: {
    fontSize: 11,
    fontFamily: FONTS.monoMedium,
    color: '#2ECC71',
    letterSpacing: 2,
  },

  // 2. Hero
  heroSection: {
    alignItems: 'center',
    gap: 0,
  },
  heroGrade: {
    fontSize: 200,
    fontFamily: FONTS.display,
    letterSpacing: 4,
    lineHeight: 200,
    includeFontPadding: false,
  },
  heroScore: {
    fontSize: 48,
    fontFamily: FONTS.display,
    color: '#F0EDE8',
    letterSpacing: 2,
    marginTop: -8,
  },
  heroLabel: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  // 3. Roast line
  roastLine: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: '#F0EDE8',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },

  // 4. Stat pills
  pillRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: 14,
    fontFamily: FONTS.headingMedium,
    color: '#F0EDE8',
  },

  // 5. Bottom
  bottomSection: {
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },
  handle: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: '#e94560',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: 'rgba(255, 255, 255, 0.3)',
  },
});
