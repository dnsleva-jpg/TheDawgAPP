import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { AnimatedPaws } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen12B({ goNext }: Props) {
  return (
    <View style={st.container}>
      <View style={st.badge}><Text style={st.badgeText}>3 — PROTECT</Text></View>

      <AnimatedPaws state="hooked" size={80} style={{ alignSelf: 'center', marginVertical: 8 }} />

      <Text style={st.title}>A pause before the scroll.</Text>
      <Text style={st.body}>
        When you reach for Instagram, Paws steps in. Breathe, then choose — open it, or walk away.
      </Text>

      {/* Breathing circle preview */}
      <View style={st.previewCard}>
        <View style={st.breathingWrap}>
          <MotiView
            from={{ scale: 0.7, opacity: 0.3 }}
            animate={{ scale: 1, opacity: 0.7 }}
            transition={{ type: 'timing', duration: 4000, loop: true, repeatReverse: true }}
            style={st.breathingRingOuter}
          />
          <MotiView
            from={{ scale: 0.6, opacity: 0.4 }}
            animate={{ scale: 1.05, opacity: 0.9 }}
            transition={{ type: 'timing', duration: 4000, loop: true, repeatReverse: true, delay: 100 }}
            style={st.breathingRingInner}
          />
          <Text style={st.breathingText}>Breathe</Text>
        </View>
        <View style={st.choices}>
          <View style={[st.choiceBtn, st.choiceGhost]}>
            <Text style={st.choiceGhostText}>Proceed</Text>
          </View>
          <View style={[st.choiceBtn, st.choicePrimary]}>
            <Text style={st.choicePrimaryText}>Walk away</Text>
          </View>
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

  previewCard: { backgroundColor: '#1C1208', borderRadius: 20, paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
  breathingWrap: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  breathingRingOuter: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: '#D4820A' },
  breathingRingInner: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFB74D' },
  breathingText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#1C1208' },

  choices: { flexDirection: 'row', gap: 10, width: '100%' },
  choiceBtn: { flex: 1, paddingVertical: 11, borderRadius: 100, alignItems: 'center' },
  choiceGhost: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(247,244,238,0.3)' },
  choiceGhostText: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: 'rgba(247,244,238,0.6)' },
  choicePrimary: { backgroundColor: '#D4820A' },
  choicePrimaryText: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#FFF' },

  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', marginTop: 20, overflow: 'hidden' },
});
