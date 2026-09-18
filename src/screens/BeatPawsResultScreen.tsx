import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ConfettiCannon from 'react-native-confetti-cannon';
import { AnimatedPaws } from '../components/AnimatedPaws';
import { BEAT_PAWS, getMoodMessage } from '../constants/pawsCopy';

interface BeatPawsResultProps {
  score: number;
  blinks: number;
  stillnessPercent: number;
  durationSeconds: number;
  won: boolean;
  longestStretch: number;
  levelName: string;
  streak: number;
  onRematch: () => void;
  onDone: () => void;
}

function gradeFromScore(score: number): { grade: string; color: string } {
  if (score >= 90) return { grade: 'S', color: '#9B59B6' };
  if (score >= 80) return { grade: 'A', color: '#4CAF50' };
  if (score >= 65) return { grade: 'B', color: '#2196F3' };
  if (score >= 50) return { grade: 'C', color: '#D4820A' };
  if (score >= 30) return { grade: 'D', color: '#E67E22' };
  return { grade: 'F', color: '#E74C3C' };
}

export function BeatPawsResultScreen({
  score, blinks, stillnessPercent, durationSeconds, won, longestStretch, levelName, streak,
  onRematch, onDone,
}: BeatPawsResultProps) {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [scaleAnim, fadeAnim]);

  const { grade, color } = gradeFromScore(score);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I ${won ? 'beat' : 'lost to'} Paws in a staring contest! Focus Score: ${score} (${grade}). Day ${streak} of Do Nothin'. Can you beat me?`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={st.container} edges={['top', 'bottom']}>
      {/* Confetti on win */}
      {won && <ConfettiCannon count={80} origin={{ x: -10, y: 0 }} fadeOut autoStart />}

      <Animated.View style={[st.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <AnimatedPaws
          state={won ? 'celebrating' : 'cantStop'}
          size={120}
          style={{ alignSelf: 'center' }}
        />

        <Text style={st.title}>{won ? 'You beat Paws! 🎉' : 'Paws won this round.'}</Text>

        <View style={st.scoreCircle}>
          <Text style={[st.scoreNumber, { color }]}>{score}</Text>
          <Text style={[st.scoreGrade, { color }]}>{grade}</Text>
        </View>

        <View style={st.statsRow}>
          <View style={st.statCard}>
            <Text style={st.statValue}>{blinks}</Text>
            <Text style={st.statLabel}>Blinks</Text>
          </View>
          <View style={st.statCard}>
            <Text style={st.statValue}>{stillnessPercent}%</Text>
            <Text style={st.statLabel}>Stillness</Text>
          </View>
          <View style={st.statCard}>
            <Text style={st.statValue}>{longestStretch}s</Text>
            <Text style={st.statLabel}>Best Stretch</Text>
          </View>
        </View>

        {streak > 0 && (
          <Text style={st.streak}>🔥 {streak} day streak</Text>
        )}

        <Text style={st.sub}>
          {won ? BEAT_PAWS.winHigh : BEAT_PAWS.lose}
        </Text>
      </Animated.View>

      <View style={st.buttons}>
        <TouchableOpacity style={st.shareBtn} onPress={handleShare} activeOpacity={0.7}>
          <Text style={st.shareBtnText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={st.rematchBtn} onPress={onRematch} activeOpacity={0.8}>
          <Text style={st.rematchBtnText}>{won ? 'Keep Going' : 'Rematch'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDone} activeOpacity={0.7}>
          <Text style={st.doneText}>Done</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F4EE', justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },

  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 24, color: '#1C1208', textAlign: 'center', marginTop: 16 },

  scoreCircle: { alignItems: 'center', marginVertical: 16 },
  scoreNumber: { fontFamily: 'Outfit_800ExtraBold', fontSize: 64, lineHeight: 68 },
  scoreGrade: { fontFamily: 'Outfit_700Bold', fontSize: 22, marginTop: -4 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#EDE9E0', borderRadius: 14, padding: 12, alignItems: 'center' },
  statValue: { fontFamily: 'Outfit_800ExtraBold', fontSize: 20, color: '#1C1208' },
  statLabel: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#8A7A60', marginTop: 2 },

  streak: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#D4820A', marginBottom: 8 },
  sub: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60', textAlign: 'center', lineHeight: 20 },

  buttons: { paddingHorizontal: 24, paddingBottom: 20, gap: 10 },
  shareBtn: { backgroundColor: '#EDE9E0', borderRadius: 100, paddingVertical: 16, alignItems: 'center' },
  shareBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#1C1208' },
  rematchBtn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, alignItems: 'center' },
  rematchBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE' },
  doneText: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#B0A090', textAlign: 'center', paddingVertical: 8 },
});
