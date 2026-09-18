import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { PawsMascot } from '../../components/PawsMascot';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

const STEPS = [
  'Paws is analyzing your habits...',
  'Paws is calculating your attention profile...',
  'Paws is generating your focus plan...',
];

export function Screen15({ goNext }: Props) {
  const [visibleStep, setVisibleStep] = useState(-1);
  const barWidths = useRef(STEPS.map(() => new Animated.Value(0))).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ])).start();

    let t = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleStep(i);
        Animated.timing(barWidths[i], { toValue: 1, duration: i === 0 ? 1200 : 1000, useNativeDriver: false }).start();
      }, t));
      t += i === 0 ? 1400 : 1200;
    });
    timers.push(setTimeout(goNext, t + 600));
    return () => timers.forEach(clearTimeout);
  }, [barWidths, pulseAnim, goNext]);

  return (
    <View style={st.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <PawsMascot mood="thinking" size={64} style={{ alignSelf: 'center', marginBottom: 32 }} />
      </Animated.View>

      {STEPS.map((step, i) => (
        <View key={i} style={[st.stepWrap, i > visibleStep && { opacity: 0 }]}>
          <Text style={st.stepLabel}>{step}</Text>
          <View style={st.barTrack}>
            <Animated.View style={[st.barFill, { width: barWidths[i].interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, backgroundColor: '#F7F4EE' },
  stepWrap: { width: 240, marginBottom: 20 },
  stepLabel: { fontFamily: 'Outfit_400Regular', fontSize: 16, color: '#8A7A60', marginBottom: 8 },
  barTrack: { height: 6, backgroundColor: '#EDE9E0', borderRadius: 100, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#D4820A', borderRadius: 100 },
});
