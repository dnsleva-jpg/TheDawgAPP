import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { useOnboarding } from '../../context/OnboardingContext';

const AGE_MAP: Record<string, number> = { 'Under 18': 16, '18–24': 21, '25–34': 30, '35–44': 40, '45–54': 50, '55+': 60 };

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen23({ goNext }: Props) {
  const { data, yearsBack } = useOnboarding();
  const livedYears = AGE_MAP[data.userAge ?? '25–34'] ?? 30;
  const remaining = 80 - livedYears;
  const recoveredYears = Math.min(yearsBack, remaining);
  const greyYears = remaining - recoveredYears;
  const [animDone, setAnimDone] = useState(false);

  const dotOpacities = useRef(Array.from({ length: recoveredYears }, () => new Animated.Value(0))).current;

  useEffect(() => {
    dotOpacities.forEach((a, i) => {
      setTimeout(() => Animated.timing(a, { toValue: 1, duration: 200, useNativeDriver: true }).start(
        i === dotOpacities.length - 1 ? () => setAnimDone(true) : undefined
      ), i * 60);
    });
  }, [dotOpacities]);

  const dots: { color: string; opacity?: Animated.Value }[] = [];
  for (let i = 0; i < greyYears; i++) dots.push({ color: '#E0D8CC' });
  for (let i = 0; i < recoveredYears; i++) dots.push({ color: '#2196F3', opacity: dotOpacities[i] });

  return (
    <ScrollView contentContainerStyle={st.container} showsVerticalScrollIndicator={false}>
      <Text style={st.title}>Get {yearsBack} years of your life back with Do Nothin'</Text>
      <View style={st.grid}>
        {dots.map((d, i) => d.opacity ? (
          <Animated.View key={i} style={[st.dot, { backgroundColor: d.color, opacity: d.opacity }]} />
        ) : (
          <View key={i} style={[st.dot, { backgroundColor: d.color }]} />
        ))}
      </View>
      <View style={st.legend}>
        <View style={st.legendRow}><View style={[st.legendDot, { backgroundColor: '#2196F3' }]} /><Text style={st.legendText}>{recoveredYears} years recovered with Do Nothin'</Text></View>
      </View>
      <Text style={st.italic}>Paws already has the first session planned.</Text>
      {animDone && <Text style={st.btn} onPress={goNext}>How does it work?</Text>}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#1C1208', textAlign: 'center', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 8 * (12 + 10), justifyContent: 'center' },
  dot: { width: 12, height: 12, borderRadius: 6, margin: 5 },
  legend: { marginTop: 20, gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60' },
  italic: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60', fontStyle: 'italic', textAlign: 'center', marginTop: 12 },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', marginTop: 24, width: '100%', overflow: 'hidden' },
});
