import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, AppState, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PawsMascot } from '../components/PawsMascot';

const ACTIVITIES = [
  { id: 'coffee', emoji: '☕', label: 'Coffee', minutes: 15 },
  { id: 'meal', emoji: '🍽️', label: 'Meal', minutes: 20 },
  { id: 'walk', emoji: '🚶', label: 'Walk', minutes: 30 },
  { id: 'custom', emoji: '⏱️', label: 'Custom', minutes: 10 },
] as const;

type Phase = 'select' | 'active' | 'done';

interface PawsModeProps {
  onComplete: (result: { activity: string; durationMinutes: number; actualMinutes: number; pickups: number }) => void;
  onCancel: () => void;
}

export function PawsModeScreen2({ onComplete, onCancel }: PawsModeProps) {
  const [phase, setPhase] = useState<Phase>('select');
  const [selectedActivity, setSelectedActivity] = useState<typeof ACTIVITIES[number] | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [pickups, setPickups] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const appStateRef = useRef(AppState.currentState);
  const floatAnim = useRef(new Animated.Value(0)).current;

  // Float animation
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -8, duration: 1500, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
    ])).start();
  }, [floatAnim]);

  // Pickup detection during active session
  useEffect(() => {
    if (phase !== 'active') return;
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        setPickups((p) => p + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [phase]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'active') return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setPhase('done');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleStart = useCallback((activity: typeof ACTIVITIES[number]) => {
    setSelectedActivity(activity);
    setSecondsLeft(activity.minutes * 60);
    setStartTime(Date.now());
    setPickups(0);
    setPhase('active');
  }, []);

  const handleEnd = useCallback(() => {
    if (!selectedActivity) return;
    const actualMinutes = Math.round((Date.now() - startTime) / 60000);
    onComplete({
      activity: selectedActivity.id,
      durationMinutes: selectedActivity.minutes,
      actualMinutes,
      pickups,
    });
  }, [selectedActivity, startTime, pickups, onComplete]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ─── Select Activity ──────────────────────────────────

  if (phase === 'select') {
    return (
      <SafeAreaView style={st.container} edges={['top']}>
        <StatusBar style="dark" />
        <TouchableOpacity style={st.closeBtn} onPress={onCancel}>
          <Ionicons name="close" size={24} color="#1C1208" />
        </TouchableOpacity>

        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <PawsMascot mood="meditating" size={100} style={{ alignSelf: 'center' }} />
        </Animated.View>

        <Text style={st.title}>Paws Mode</Text>
        <Text style={st.sub}>Put your phone down. Paws will wait.</Text>

        <View style={st.activities}>
          {ACTIVITIES.map((a) => (
            <TouchableOpacity key={a.id} style={st.activityCard} onPress={() => handleStart(a)} activeOpacity={0.7}>
              <Text style={st.activityEmoji}>{a.emoji}</Text>
              <Text style={st.activityLabel}>{a.label}</Text>
              <Text style={st.activityTime}>{a.minutes} min</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // ─── Active Session ────────────────────────────────────

  if (phase === 'active') {
    return (
      <SafeAreaView style={st.activeContainer} edges={['top']}>
        <StatusBar style="dark" />

        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <PawsMascot
            mood={pickups === 0 ? 'meditating' : pickups < 3 ? 'thinking' : 'sideeye'}
            size={160}
            style={{ alignSelf: 'center' }}
          />
        </Animated.View>

        <Text style={st.timerText}>{formatTime(secondsLeft)}</Text>
        <Text style={st.activityNow}>{selectedActivity?.emoji} {selectedActivity?.label}</Text>

        {pickups > 0 && (
          <Text style={st.pickupWarning}>You've picked up {pickups} time{pickups > 1 ? 's' : ''}.</Text>
        )}

        <Text style={st.calmText}>Put your phone face-down. Paws is watching.</Text>

        <TouchableOpacity
          style={st.endEarlyBtn}
          onPress={() => {
            Alert.alert('End early?', `You have ${formatTime(secondsLeft)} left.`, [
              { text: 'Keep going', style: 'cancel' },
              { text: 'End', onPress: () => { setPhase('done'); } },
            ]);
          }}
          activeOpacity={0.7}
        >
          <Text style={st.endEarlyText}>End early</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Done ──────────────────────────────────────────────

  const actualMinutes = Math.round((Date.now() - startTime) / 60000);

  return (
    <SafeAreaView style={st.container} edges={['top']}>
      <StatusBar style="dark" />

      <PawsMascot
        mood={pickups === 0 ? 'celebrate' : pickups < 3 ? 'meditating' : 'sideeye'}
        size={120}
        style={{ alignSelf: 'center' }}
      />

      <Text style={st.doneTitle}>
        {pickups === 0 ? 'Perfect session!' : `${actualMinutes} minutes phone-free.`}
      </Text>

      <View style={st.doneStats}>
        <View style={st.doneStat}>
          <Text style={st.doneStatValue}>{actualMinutes}</Text>
          <Text style={st.doneStatLabel}>minutes</Text>
        </View>
        <View style={st.doneStat}>
          <Text style={[st.doneStatValue, pickups > 0 && { color: '#E67E22' }]}>{pickups}</Text>
          <Text style={st.doneStatLabel}>pickups</Text>
        </View>
      </View>

      <Text style={st.doneMessage}>
        {pickups === 0
          ? 'Paws is proud. Zero pickups.'
          : `${pickups} pickup${pickups > 1 ? 's' : ''}. ${pickups < 3 ? "Not bad." : "Room to improve."}`}
      </Text>

      <TouchableOpacity style={st.doneBtn} onPress={handleEnd} activeOpacity={0.8}>
        <Text style={st.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4EE', paddingHorizontal: 24, justifyContent: 'center' },
  closeBtn: { position: 'absolute', top: 60, left: 20, zIndex: 10, padding: 8 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#1C1208', textAlign: 'center', marginTop: 12 },
  sub: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', textAlign: 'center', marginTop: 6, marginBottom: 24 },

  activities: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  activityCard: { width: '47%', backgroundColor: '#EDE9E0', borderRadius: 16, padding: 20, alignItems: 'center' },
  activityEmoji: { fontSize: 32, marginBottom: 8 },
  activityLabel: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#1C1208' },
  activityTime: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60', marginTop: 4 },

  // Active
  activeContainer: { flex: 1, backgroundColor: '#F7F4EE', paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center' },
  timerText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 56, color: '#1C1208', marginTop: 16 },
  activityNow: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#8A7A60', marginTop: 4 },
  pickupWarning: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#E67E22', marginTop: 16 },
  calmText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#B0A090', marginTop: 12, textAlign: 'center' },
  endEarlyBtn: { marginTop: 32 },
  endEarlyText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#B0A090' },

  // Done
  doneTitle: { fontFamily: 'Outfit_800ExtraBold', fontSize: 24, color: '#1C1208', textAlign: 'center', marginTop: 16 },
  doneStats: { flexDirection: 'row', gap: 20, marginTop: 20 },
  doneStat: { flex: 1, backgroundColor: '#EDE9E0', borderRadius: 16, padding: 16, alignItems: 'center' },
  doneStatValue: { fontFamily: 'Outfit_800ExtraBold', fontSize: 32, color: '#1C1208' },
  doneStatLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#8A7A60', marginTop: 2 },
  doneMessage: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60', textAlign: 'center', marginTop: 16 },
  doneBtn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, alignItems: 'center', marginTop: 24 },
  doneBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE' },
});
