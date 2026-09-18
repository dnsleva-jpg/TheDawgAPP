import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { AnimatedPaws } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

const TOTAL_DAYS = 90;
const COLS = 15;

export function Screen12C({ goNext }: Props) {
  return (
    <View style={st.container}>
      <View style={st.badge}><Text style={st.badgeText}>4 — TRAIN</Text></View>

      <AnimatedPaws state="celebrating" size={80} style={{ alignSelf: 'center', marginVertical: 8 }} />

      <Text style={st.title}>90 days of daily missions.</Text>
      <Text style={st.body}>
        Phone-free breakfasts. Digital sunsets. Stillness challenges. Each day builds your streak.
      </Text>

      {/* Streak grid preview */}
      <View style={st.streakCard}>
        <View style={st.streakHeader}>
          <Text style={st.streakLabel}>Your 90-day streak</Text>
          <Text style={st.streakCount}>Day 0 / 90</Text>
        </View>
        <View style={st.grid}>
          {Array.from({ length: TOTAL_DAYS }).map((_, i) => (
            <MotiView
              key={i}
              from={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: 'timing',
                duration: 260,
                delay: 250 + i * 18,
              }}
              style={[
                st.dot,
                // Highlight first 7 dots in coral to show "first week" progress feel
                i < 7 ? st.dotActive : st.dotInactive,
              ]}
            />
          ))}
        </View>
        <Text style={st.streakHook}>Miss a day, streak breaks. Paws is strict.</Text>
      </View>

      <Text style={st.btn} onPress={goNext}>Continue</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  badge: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 6, paddingHorizontal: 16, alignSelf: 'center' },
  badgeText: { fontFamily: 'Outfit_700Bold', fontSize: 12, color: '#FFF', letterSpacing: 1 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 24, color: '#1C1208', textAlign: 'center' },
  body: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: 16 },

  streakCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
  streakHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  streakLabel: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#1C1208' },
  streakCount: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#8A7A60' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: COLS * 16, alignSelf: 'center', gap: 3 },
  dot: { width: 13, height: 13, borderRadius: 4 },
  dotActive: { backgroundColor: '#D4820A' },
  dotInactive: { backgroundColor: '#EDE9E0' },
  streakHook: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#B0A090', textAlign: 'center', marginTop: 10, fontStyle: 'italic' },

  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', marginTop: 20, overflow: 'hidden' },
});
