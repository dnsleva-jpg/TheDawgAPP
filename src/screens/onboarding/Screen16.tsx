import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { AnimatedPaws } from '../../components/AnimatedPaws';
import { TypewriterTitle } from '../../components/TypewriterTitle';
import { useOnboarding } from '../../context/OnboardingContext';

const PROFILES: Record<string, { name: string; desc: string; quote: string; focus: number; distraction: number }> = {
  Mornings: { name: 'The Morning Zombie', desc: 'Your attention is at its worst before it even starts. Your plan builds focus from the first hour.', quote: 'Paws says your mornings are costing you the most.', focus: 75, distraction: 20 },
  'During the day': { name: 'The Afternoon Drifter', desc: 'Midday distractions are your biggest leak. Your plan builds deep focus during peak hours.', quote: 'Paws sees you losing it after lunch every day.', focus: 60, distraction: 50 },
  Evenings: { name: 'The Nighttime Scroller', desc: 'Evenings are your biggest attention leak. Your plan protects evenings and improves sleep.', quote: 'Paws is up late watching you scroll too.', focus: 70, distraction: 80 },
  'All day': { name: 'The Constant Scroller', desc: 'Your attention is under constant attack. Your plan builds focus in structured bursts.', quote: "Paws has been watching all day. It's not great.", focus: 40, distraction: 90 },
  'Not sure': { name: 'The Unaware Drifter', desc: 'Your plan will reveal exactly when and why you lose focus.', quote: 'Paws is about to show you something uncomfortable.', focus: 50, distraction: 60 },
};

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen16({ goNext }: Props) {
  const { data } = useOnboarding();
  const profile = PROFILES[data.userWorstTime ?? 'Not sure'] ?? PROFILES['Not sure'];
  const [phase, setPhase] = useState(0);
  const descOpacity = useRef(new Animated.Value(0)).current;
  const quoteOpacity = useRef(new Animated.Value(0)).current;
  const barsOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const focusWidth = useRef(new Animated.Value(0)).current;
  const distractWidth = useRef(new Animated.Value(0)).current;

  const showDesc = useCallback(() => {
    setPhase(1);
    Animated.timing(descOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
      Animated.timing(quoteOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
        Animated.timing(barsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
          Animated.parallel([
            Animated.timing(focusWidth, { toValue: profile.focus, duration: 800, useNativeDriver: false }),
            Animated.timing(distractWidth, { toValue: profile.distraction, duration: 800, useNativeDriver: false }),
          ]).start(() => {
            Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
          });
        });
      });
    });
  }, [descOpacity, quoteOpacity, barsOpacity, focusWidth, distractWidth, btnOpacity, profile]);

  return (
    <ScrollView contentContainerStyle={st.container} showsVerticalScrollIndicator={false}>
      <Text style={st.label}>Your attention profile is</Text>
      <TypewriterTitle text={profile.name} style={st.name} delay={200} onComplete={showDesc} />

      {phase >= 1 && (
        <>
          <Animated.View style={[st.descRow, { opacity: descOpacity }]}>
            <AnimatedPaws state="notepad" size={56} />
            <Text style={st.desc}>{profile.desc}</Text>
          </Animated.View>
          <Animated.Text style={[st.quote, { opacity: quoteOpacity }]}>{profile.quote}</Animated.Text>

          <Animated.View style={[st.barsWrap, { opacity: barsOpacity }]}>
            <Text style={st.barLabel}>Focus drain</Text>
            <View style={st.barTrack}>
              <Animated.View style={[st.barFill, { width: focusWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
            </View>
            <Text style={st.barLabel}>Peak distraction</Text>
            <View style={st.barTrack}>
              <Animated.View style={[st.barFill, { width: distractWidth.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: btnOpacity, width: '100%' }}>
            <Text style={st.btn} onPress={goNext}>Continue</Text>
          </Animated.View>
        </>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  label: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60', marginBottom: 8 },
  name: { fontFamily: 'Outfit_800ExtraBold', fontSize: 30, color: '#1C1208', textAlign: 'center' },
  descRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  desc: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60', flex: 1, lineHeight: 20 },
  quote: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60', fontStyle: 'italic', textAlign: 'center', marginTop: 12 },
  barsWrap: { width: '100%', marginTop: 20, gap: 8 },
  barLabel: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#8A7A60' },
  barTrack: { height: 10, backgroundColor: '#EDE9E0', borderRadius: 100, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#D4820A', borderRadius: 100 },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', marginTop: 24, overflow: 'hidden' },
});
