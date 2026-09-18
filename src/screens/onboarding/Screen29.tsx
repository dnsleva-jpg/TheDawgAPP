import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AnimatedPaws } from '../../components/AnimatedPaws';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen29({ goNext }: Props) {
  const { yearsBack, daysThisYear } = useOnboarding();
  const line1 = useRef(new Animated.Value(0)).current;
  const line2 = useRef(new Animated.Value(0)).current;
  const line3 = useRef(new Animated.Value(0)).current;
  const mascotOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -6, duration: 1200, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ])).start();

    Animated.sequence([
      Animated.timing(line1, { toValue: 1, duration: 400, delay: 300, useNativeDriver: true }),
      Animated.timing(line2, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(line3, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(mascotOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [line1, line2, line3, mascotOpacity, btnOpacity, floatAnim]);

  return (
    <View style={st.container}>
      <Animated.Text style={[st.line1, { opacity: line1 }]}>
        {daysThisYear} days this year.
      </Animated.Text>
      <Animated.Text style={[st.line2, { opacity: line2 }]}>
        {yearsBack} years of your life.
      </Animated.Text>
      <Animated.Text style={[st.line3, { opacity: line3 }]}>
        Take it back in 90 days.
      </Animated.Text>

      <Animated.View style={{ opacity: mascotOpacity, transform: [{ translateY: floatAnim }] }}>
        <AnimatedPaws state="focus" size={140} style={{ alignSelf: 'center', marginTop: 24 }} />
      </Animated.View>

      <Animated.View style={{ opacity: btnOpacity, width: '100%', alignItems: 'center', marginTop: 24 }}>
        <Text style={st.btn} onPress={goNext}>I'm ready</Text>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  line1: { fontFamily: 'Outfit_400Regular', fontSize: 18, color: '#8A7A60', textAlign: 'center' },
  line2: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#E74C3C', textAlign: 'center', marginTop: 6 },
  line3: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#1C1208', textAlign: 'center', marginTop: 10 },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', width: '100%', overflow: 'hidden' },
});
