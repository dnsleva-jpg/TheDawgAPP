import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Linking,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  saveWeeklyReport,
  markWeeklyReportDone,
  getCurrentWeekGoal,
  getScreenTimeGoal,
  type WeeklyReport,
} from '../utils/screenTimeService';

const SHIBA = require('../../assets/shiba/shiba-thriving.png');

interface ScreenTimeCheckInProps {
  weekNumber: number;
  onComplete: (report: WeeklyReport) => void;
  onSkip: () => void;
}

export function ScreenTimeCheckIn({ weekNumber, onComplete, onSkip }: ScreenTimeCheckInProps) {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [weekGoal, setWeekGoal] = useState(4);
  const [submitted, setSubmitted] = useState(false);
  const [report, setReport] = useState<WeeklyReport | null>(null);

  useEffect(() => {
    getCurrentWeekGoal(weekNumber).then(setWeekGoal);
  }, [weekNumber]);

  const handleOpenScreenTime = () => {
    // Deep link to iOS Screen Time settings
    Linking.openURL('App-prefs:SCREEN_TIME').catch(() => {
      Linking.openURL('app-settings:').catch(() => {});
    });
  };

  const handleSubmit = async () => {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    const totalHours = h + m / 60;

    if (totalHours <= 0) return;

    const r = await saveWeeklyReport(Math.round(totalHours * 10) / 10);
    await markWeeklyReportDone();
    setReport(r);
    setSubmitted(true);
  };

  if (submitted && report) {
    const improvement = report.metGoal;
    return (
      <View style={styles.container}>
        <Image source={SHIBA} style={styles.shiba} resizeMode="contain" />
        <Text style={styles.resultTitle}>
          {improvement ? 'Under your goal!' : 'Over your goal'}
        </Text>
        <Text style={styles.resultSub}>
          {improvement
            ? `You used ${report.reportedHours}h — your goal was ${report.goalHours}h. Keep it up.`
            : `You used ${report.reportedHours}h — your goal was ${report.goalHours}h. This week, try harder.`}
        </Text>

        <View style={styles.comparisonRow}>
          <View style={styles.comparisonCard}>
            <Text style={styles.comparisonValue}>{report.reportedHours}h</Text>
            <Text style={styles.comparisonLabel}>Actual</Text>
          </View>
          <View style={styles.comparisonCard}>
            <Text style={[styles.comparisonValue, { color: '#D4820A' }]}>{report.goalHours}h</Text>
            <Text style={styles.comparisonLabel}>Goal</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.doneButton} onPress={() => onComplete(report)} activeOpacity={0.8}>
          <Text style={styles.doneText}>Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={SHIBA} style={styles.shibaSmall} resizeMode="contain" />

      <Text style={styles.title}>Weekly Screen Time Check</Text>
      <Text style={styles.subtitle}>
        Check your average daily screen time in{'\n'}
        <Text style={styles.bold}>Settings → Screen Time</Text>
      </Text>

      <TouchableOpacity style={styles.openSettings} onPress={handleOpenScreenTime} activeOpacity={0.8}>
        <Ionicons name="settings-outline" size={18} color="#F7F4EE" />
        <Text style={styles.openSettingsText}>Open Screen Time Settings</Text>
      </TouchableOpacity>

      <Text style={styles.inputLabel}>Enter your daily average</Text>

      <View style={styles.inputRow}>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            value={hours}
            onChangeText={setHours}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#B0A090"
            maxLength={2}
          />
          <Text style={styles.inputUnit}>hours</Text>
        </View>
        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor="#B0A090"
            maxLength={2}
          />
          <Text style={styles.inputUnit}>min</Text>
        </View>
      </View>

      <View style={styles.goalCard}>
        <Text style={styles.goalLabel}>This week's goal</Text>
        <Text style={styles.goalValue}>{weekGoal.toFixed(1)}h / day</Text>
      </View>

      <TouchableOpacity
        style={[styles.submitButton, !(hours || minutes) && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={!(hours || minutes)}
        activeOpacity={0.8}
      >
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={onSkip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip this week</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  shiba: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  shibaSmall: {
    width: 72,
    height: 72,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 24,
    color: '#1C1208',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#8A7A60',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  bold: {
    fontFamily: 'Outfit_700Bold',
    color: '#1C1208',
  },
  openSettings: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 28,
  },
  openSettingsText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#F7F4EE',
  },
  inputLabel: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#1C1208',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  inputGroup: {
    alignItems: 'center',
    gap: 6,
  },
  input: {
    width: 80,
    height: 56,
    backgroundColor: '#EDE9E0',
    borderRadius: 16,
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 28,
    color: '#1C1208',
    textAlign: 'center',
  },
  inputUnit: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#B0A090',
  },
  goalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EDE9E0',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  goalLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#8A7A60',
  },
  goalValue: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 18,
    color: '#D4820A',
  },
  submitButton: {
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#F7F4EE',
  },
  skipButton: {
    paddingVertical: 16,
  },
  skipText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#B0A090',
  },

  // Results
  resultTitle: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 24,
    color: '#1C1208',
    marginBottom: 8,
  },
  resultSub: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#8A7A60',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    width: '100%',
  },
  comparisonCard: {
    flex: 1,
    backgroundColor: '#EDE9E0',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  comparisonValue: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 28,
    color: '#1C1208',
  },
  comparisonLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#8A7A60',
    marginTop: 4,
  },
  doneButton: {
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  doneText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#F7F4EE',
  },
});
