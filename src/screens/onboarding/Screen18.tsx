import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AnimatedPaws } from '../../components/AnimatedPaws';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: (id?: any) => void; goBack: () => void; onComplete: () => void }

export function Screen18({ goNext }: Props) {
  const { daysThisYear } = useOnboarding();
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const fadeBottom = useRef(new Animated.Value(0)).current;
  const fadeItalic = useRef(new Animated.Value(0)).current;
  const counterScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const target = daysThisYear;
    const duration = 1800;
    const step = Math.max(1, Math.ceil(target / (duration / 16)));
    const interval = setInterval(() => {
      setCount((c) => {
        const next = c + step;
        if (next >= target) { clearInterval(interval); setDone(true); return target; }
        return next;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [daysThisYear]);

  useEffect(() => {
    if (!done) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // Spring-bounce counter + red glow pulse
    Animated.parallel([
      Animated.sequence([
        Animated.spring(counterScale, { toValue: 1.28, friction: 4, tension: 180, useNativeDriver: true }),
        Animated.spring(counterScale, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.timing(fadeBottom, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
      Animated.timing(fadeItalic, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
    const t = setTimeout(() => goNext(), 3200);
    return () => clearTimeout(t);
  }, [done, fadeBottom, fadeItalic, counterScale, glowOpacity, goNext]);

  return (
    <View style={st.container}>
      <Text style={st.top}>Looks like you'll spend</Text>
      <View style={st.counterWrap}>
        <Animated.View style={[st.glow, { opacity: glowOpacity }]} pointerEvents="none" />
        <Animated.Text style={[st.counter, { transform: [{ scale: counterScale }] }]}>{count}</Animated.Text>
      </View>
      {done && <Animated.Text style={[st.bottom, { opacity: fadeBottom }]}>days on your phone this year.</Animated.Text>}
      {done && (
        <Animated.View style={{ opacity: fadeItalic, alignItems: 'center', marginTop: 16 }}>
          <AnimatedPaws state="notepad" size={110} />
          <Text style={st.italic}>Paws ran the numbers twice.</Text>
        </Animated.View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F4EE', paddingHorizontal: 24 },
  top: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#1C1208', textAlign: 'center' },
  counterWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 8 },
  glow: { position: 'absolute', width: 240, height: 140, borderRadius: 120, backgroundColor: '#D4820A', opacity: 0 },
  counter: { fontFamily: 'Outfit_800ExtraBold', fontSize: 68, color: '#D4820A', textAlign: 'center' },
  bottom: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#1C1208', textAlign: 'center' },
  italic: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60', fontStyle: 'italic', textAlign: 'center', marginTop: 12 },
  skip: { position: 'absolute', bottom: 40 },
  skipText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#B0A090' },
});
