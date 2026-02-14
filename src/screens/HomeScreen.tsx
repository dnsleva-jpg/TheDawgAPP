import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { DurationPicker } from '../components/DurationPicker';
import { COLORS } from '../constants/colors';
import { COLORS as DS_COLORS, FONTS, BRAND, RADIUS, SHADOWS } from '../constants/designSystem';
import { DURATION_OPTIONS } from '../constants/durations';
import { UserStats } from '../types';
import { getSessions } from '../utils/storage';
import { calculateStats, formatTotalTime } from '../utils/stats';
import { formatTimeDisplay, formatRecordTime } from '../utils/formatTime';
import { getStreakData, getStreakMessage, StreakData } from '../utils/streakManager';

interface HomeScreenProps {
  onStartSession: (durationSeconds: number) => void;
}

export function HomeScreen({ onStartSession }: HomeScreenProps) {
  const [selectedDuration, setSelectedDuration] = useState(
    DURATION_OPTIONS[0].seconds
  );
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    totalTimeSeconds: 0,
    longestSessionSeconds: 0,
    currentStreak: 0,
  });
  const [streakData, setStreakData] = useState<StreakData>({
    currentStreak: 0,
    lastSessionDate: null,
    longestStreak: 0,
  });

  useEffect(() => {
    loadStats();
    loadStreak();
  }, []);

  const loadStats = async () => {
    try {
      const sessions = await getSessions();
      const calculatedStats = calculateStats(sessions);
      setStats(calculatedStats);
    } catch (error) {
      // Stats failed to load — defaults remain
    }
  };

  const loadStreak = async () => {
    try {
      const data = await getStreakData();
      setStreakData(data);
    } catch (error) {
      // Streak failed to load — defaults remain
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.header}>
          {/* Gradient Title */}
          <MaskedView
            maskElement={
              <Text style={styles.title} accessibilityRole="header">THE RAW DAWG APP</Text>
            }
          >
            <LinearGradient
              colors={['#FF4D6A', '#FF8A9E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <Text style={[styles.title, { opacity: 0 }]}>THE RAW DAWG APP</Text>
            </LinearGradient>
          </MaskedView>
          
          <Text style={styles.subtitle} accessibilityRole="header">
            The art of doing absolutely nothing
          </Text>
        </View>

        {/* Streak Display */}
        {streakData.currentStreak > 0 && (
          <View style={styles.streakCard} accessibilityRole="header">
            <Text style={styles.streakEmoji} accessibilityLabel="">
              {getStreakMessage(streakData).emoji}
            </Text>
            <Text style={styles.streakText}>
              {getStreakMessage(streakData).mainText}
            </Text>
            {getStreakMessage(streakData).subText && (
              <Text style={styles.streakSubText}>
                {getStreakMessage(streakData).subText}
              </Text>
            )}
          </View>
        )}

        <View style={styles.pickerContainer}>
          <DurationPicker
            selectedDuration={selectedDuration}
            onSelectDuration={setSelectedDuration}
            onStartSession={onStartSession}
          />
        </View>

        {/* Stats Grid - Always visible */}
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>✓</Text>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>⏱️</Text>
              <Text style={styles.statValue}>
                {formatTotalTime(stats.totalTimeSeconds)}
              </Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statValue}>{streakData.currentStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>
              {formatRecordTime(stats.longestSessionSeconds)}
            </Text>
            <Text style={styles.statLabel}>Record</Text>
          </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => onStartSession(selectedDuration)}
            activeOpacity={0.8}
            accessibilityLabel="Start session"
            accessibilityRole="button"
          >
            <Text style={styles.startButtonText}>START SESSION</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Put your phone down. No distractions. Just exist.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Brand Kit - Home Screen
  container: {
    flex: 1,
    backgroundColor: DS_COLORS.bgDeep,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },
  header: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 40,
    fontFamily: FONTS.display, // Bebas Neue
    color: DS_COLORS.textPrimary, // Fallback color (used by MaskedView)
    letterSpacing: 2,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  // Streak Display Card
  streakCard: {
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: RADIUS.card,
    borderWidth: 2,
    borderColor: DS_COLORS.coral,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 12,
    alignItems: 'center',
    gap: 2,
    ...SHADOWS.coralButton,
  },
  streakEmoji: {
    fontSize: 24,
    marginBottom: 0,
  },
  streakText: {
    fontSize: 18,
    fontFamily: FONTS.headingBold,
    color: DS_COLORS.textPrimary,
    letterSpacing: 0,
  },
  streakSubText: {
    fontSize: 13,
    fontFamily: FONTS.heading,
    color: DS_COLORS.coral,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  footer: {
    gap: 12,
    marginTop: 'auto',
  },
  // Brand Kit - Primary CTA (Start Session)
  startButton: {
    backgroundColor: DS_COLORS.coral,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: RADIUS.button, // 14px per brand kit
    alignItems: 'center',
    ...SHADOWS.coralButton, // Brand kit coral shadow
  },
  startButtonText: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 0,
  },
  disclaimer: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginTop: 8,
    marginBottom: 12,
    width: '100%',
    paddingHorizontal: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  // Brand Kit - Stat Cards
  statCard: {
    flex: 1,
    backgroundColor: DS_COLORS.bgSurface,
    padding: 8,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)', // Brand kit card border
    gap: 2,
  },
  statEmoji: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 18,
    fontFamily: FONTS.monoBold,
    color: DS_COLORS.coral,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
