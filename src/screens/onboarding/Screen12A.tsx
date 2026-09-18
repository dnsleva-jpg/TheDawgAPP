import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPaws } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen12A({ goNext }: Props) {
  return (
    <View style={st.container}>
      <View style={st.badge}><Text style={st.badgeText}>2 — TEST</Text></View>

      <AnimatedPaws state="notepad" size={80} style={{ alignSelf: 'center', marginVertical: 8 }} />

      <Text style={st.title}>Your camera sees what you can't.</Text>
      <Text style={st.body}>
        Every few days, a Focus Check. Paws tracks blink rate and micro-movements — the signals neuroscientists use to measure attention.
      </Text>

      {/* Focus meter preview */}
      <View style={st.previewCard}>
        <View style={st.previewHead}>
          <View style={st.camIconWrap}>
            <Ionicons name="videocam" size={16} color="#4CAF50" />
          </View>
          <Text style={st.camLabel}>Focus Check · Live</Text>
        </View>

        <View style={st.statRow}>
          <Text style={st.statLabel}>Stillness</Text>
          <View style={st.meterTrack}>
            <MotiView
              from={{ width: '10%' }}
              animate={{ width: '87%' }}
              transition={{ type: 'timing', duration: 1600, loop: true, repeatReverse: true, delay: 300 }}
              style={st.meterFill}
            />
          </View>
          <Text style={st.statValue}>87%</Text>
        </View>

        <View style={st.statRow}>
          <Text style={st.statLabel}>Blinks</Text>
          <View style={st.blinkPill}><Text style={st.blinkPillText}>12/min</Text></View>
        </View>

        <View style={st.scoreLine}>
          <Text style={st.scoreLabel}>Focus Check Score</Text>
          <MotiView
            from={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 600, damping: 12 }}
          >
            <Text style={st.scoreValue}>82</Text>
          </MotiView>
        </View>
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

  previewCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
  previewHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  camIconWrap: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center' },
  camLabel: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#1C1208' },

  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  statLabel: { fontFamily: 'Outfit_700Bold', fontSize: 12, color: '#8A7A60', width: 60 },
  meterTrack: { flex: 1, height: 8, backgroundColor: '#EDE9E0', borderRadius: 100, overflow: 'hidden' },
  meterFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 100 },
  statValue: { fontFamily: 'Outfit_800ExtraBold', fontSize: 13, color: '#1C1208', width: 38, textAlign: 'right' },
  blinkPill: { backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  blinkPillText: { fontFamily: 'Outfit_700Bold', fontSize: 12, color: '#D4820A' },

  scoreLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EDE9E0' },
  scoreLabel: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#1C1208' },
  scoreValue: { fontFamily: 'Outfit_800ExtraBold', fontSize: 32, color: '#D4820A' },

  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', marginTop: 20, overflow: 'hidden' },
});
