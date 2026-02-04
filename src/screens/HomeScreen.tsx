import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DurationPicker } from '../components/DurationPicker';
import { COLORS } from '../constants/colors';
import { DURATION_OPTIONS } from '../constants/durations';
import { UserStats } from '../types';
import { getSessions } from '../utils/storage';
import { calculateStats, formatTotalTime } from '../utils/stats';
import { formatTimeDisplay, formatRecordTime } from '../utils/formatTime';

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

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const sessions = await getSessions();
      const calculatedStats = calculateStats(sessions);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>RAW DAWG</Text>
          <Text style={styles.subtitle}>
            The art of doing absolutely nothing
          </Text>
        </View>

        <View style={styles.pickerContainer}>
          <DurationPicker
            selectedDuration={selectedDuration}
            onSelectDuration={setSelectedDuration}
          />
          
          {/* Stats Grid */}
          {stats.totalSessions > 0 && (
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
                  <Text style={styles.statValue}>{stats.currentStreak}</Text>
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
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => onStartSession(selectedDuration)}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>START SESSION</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Put your phone down. No distractions. Just exist.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.coral,
    letterSpacing: 4,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    gap: 20,
  },
  startButton: {
    backgroundColor: COLORS.coral,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.coral,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 2,
  },
  disclaimer: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.gray,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginTop: 40,
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.darkSecondary,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    gap: 4,
  },
  statEmoji: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.coral,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
