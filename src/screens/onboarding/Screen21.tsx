import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AnimatedPaws } from '../../components/AnimatedPaws';
import { useOnboarding } from '../../context/OnboardingContext';

const AGE_MAP: Record<string, number> = {
  'Under 18': 16, '18–24': 21, '25–34': 30, '35–44': 40, '45–54': 50, '55+': 60,
};

const COLS = 8;
const TOTAL_YEARS = 80;

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen21({ goNext }: Props) {
  const { data, yearsOnPhone } = useOnboarding();
  const livedYears = AGE_MAP[data.userAge ?? '25–34'] ?? 30;
  const remaining = TOTAL_YEARS - livedYears;
  const phoneWaste = Math.min(yearsOnPhone, remaining);
  const freeYears = remaining - phoneWaste;
  const [showBtn, setShowBtn] = useState(false);
  const [showHook, setShowHook] = useState(false);
  const graveFade = useRef(new Animated.Value(0)).current;

  // Animated values for each dot
  const dotAnims = useRef(
    Array.from({ length: TOTAL_YEARS }, () => ({
      opacity: new Animated.Value(0),
      scale: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: Show lived years instantly (green)
    for (let i = 0; i < livedYears; i++) {
      dotAnims[i].opacity.setValue(1);
    }

    // Phase 2: Show free years (grey, fast stagger)
    const freeStart = livedYears;
    for (let i = 0; i < freeYears; i++) {
      timers.push(setTimeout(() => {
        Animated.timing(dotAnims[freeStart + i].opacity, {
          toValue: 1, duration: 150, useNativeDriver: true,
        }).start();
      }, i * 25));
    }

    // Phase 3: After free years done, pause, then RED dots slam in
    const redStart = livedYears + freeYears;
    const redDelay = freeYears * 25 + 600; // pause after grey

    for (let i = 0; i < phoneWaste; i++) {
      timers.push(setTimeout(() => {
        // Pop in with scale bounce
        dotAnims[redStart + i].opacity.setValue(1);
        Animated.sequence([
          Animated.timing(dotAnims[redStart + i].scale, {
            toValue: 1.8, duration: 100, useNativeDriver: true,
          }),
          Animated.timing(dotAnims[redStart + i].scale, {
            toValue: 1, duration: 200, useNativeDriver: true,
          }),
        ]).start();

        // Haptic on every 3rd red dot
        if (i % 3 === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        // Show hook after last red dot
        if (i === phoneWaste - 1) {
          timers.push(setTimeout(() => {
            setShowHook(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            // Grave reveals simultaneously with the Error haptic — terminal state
            Animated.timing(graveFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
            timers.push(setTimeout(() => setShowBtn(true), 800));
          }, 400));
        }
      }, redDelay + i * 120));
    }

    return () => { timers.forEach(clearTimeout); };
  }, [livedYears, freeYears, phoneWaste, dotAnims, graveFade]);

  // Build dot colors
  const getDotColor = (i: number) => {
    if (i < livedYears) return '#4CAF50';
    if (i < livedYears + freeYears) return '#E0D8CC';
    return '#E74C3C';
  };

  const sunrises = phoneWaste * 365;

  return (
    <ScrollView contentContainerStyle={st.container} showsVerticalScrollIndicator={false}>
      <Text style={st.title}>This is your life.</Text>
      <Text style={st.subtitle}>Each dot is one year.</Text>

      <View style={st.grid}>
        {Array.from({ length: TOTAL_YEARS }, (_, i) => (
          <Animated.View
            key={i}
            style={[
              st.dot,
              {
                backgroundColor: getDotColor(i),
                opacity: dotAnims[i].opacity,
                transform: [{ scale: dotAnims[i].scale }],
              },
            ]}
          />
        ))}
      </View>

      {/* Legend */}
      <View style={st.legend}>
        <LegendRow color="#4CAF50" label={`${livedYears} years lived`} />
        <LegendRow color="#E0D8CC" label={`${freeYears} years you have left`} />
        <LegendRow color="#E74C3C" label={`${phoneWaste} years gone to your phone`} />
      </View>

      {/* Fear hook + terminal reveal */}
      {showHook && (
        <View style={st.hookSection}>
          <Animated.View style={{ opacity: graveFade, marginBottom: 12 }}>
            <AnimatedPaws state="grave" size={160} />
          </Animated.View>
          <Text style={st.hookNumber}>{sunrises.toLocaleString()}</Text>
          <Text style={st.hookText}>sunrises you'll spend staring at a screen.</Text>
          <Text style={st.hookSub}>Every red dot is a year you won't get back.</Text>
        </View>
      )}

      {showBtn && (
        <Text style={st.btn} onPress={goNext}>Continue</Text>
      )}
    </ScrollView>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <View style={st.legendRow}>
      <View style={[st.legendDot, { backgroundColor: color }]} />
      <Text style={st.legendText}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40, alignItems: 'center' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#1C1208', textAlign: 'center' },
  subtitle: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#B0A090', textAlign: 'center', marginTop: 4, marginBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: COLS * (16 + 6), justifyContent: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, margin: 3 },
  legend: { marginTop: 24, gap: 8, width: '100%' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 14, height: 14, borderRadius: 7 },
  legendText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60' },
  hookSection: { marginTop: 24, alignItems: 'center' },
  hookNumber: { fontFamily: 'Outfit_800ExtraBold', fontSize: 48, color: '#E74C3C' },
  hookText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#1C1208', textAlign: 'center' },
  hookSub: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60', textAlign: 'center', marginTop: 6, fontStyle: 'italic' },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', marginTop: 24, width: '100%', overflow: 'hidden' },
});
