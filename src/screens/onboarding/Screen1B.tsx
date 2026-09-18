import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Easing } from 'react-native';
import { PawsMascot } from '../../components/PawsMascot';
import { TypewriterTitle } from '../../components/TypewriterTitle';
import { useOnboarding } from '../../context/OnboardingContext';

const AMBITION_COPY: Record<string, string> = {
  'Build something': 'With the time you\'ve spent scrolling, you could have launched a business.',
  'Learn a skill': 'With the time you\'ve spent scrolling, you could have learned a language.',
  'Get fit': 'With the time you\'ve spent scrolling, you could have transformed your body.',
  'Read and think': 'With the time you\'ve spent scrolling, you could have read 40 books.',
  'Be present': 'With the time you\'ve spent scrolling, you could have been there for the moments that mattered.',
  'Create': 'With the time you\'ve spent scrolling, you could have made something the world remembers.',
};

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen1B({ goNext }: Props) {
  const { data } = useOnboarding();
  const [score, setScore] = useState(0);
  const [showGrade, setShowGrade] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const gradeOpacity = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Phone float
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, [floatAnim]);

  // Score counter animation
  useEffect(() => {
    let i = 0;
    const target = 84;
    const interval = setInterval(() => {
      i += 2;
      setScore(Math.min(i, target));
      if (i >= target) {
        clearInterval(interval);
        setShowGrade(true);
        Animated.timing(gradeOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        setTimeout(() => setShowText(true), 600);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [gradeOpacity]);

  const handleTextDone = useCallback(() => {
    setShowSub(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
      setShowButton(true);
      Animated.timing(buttonOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });
  }, [fadeAnim, buttonOpacity]);

  const copy = AMBITION_COPY[data.userAmbition ?? ''] ?? AMBITION_COPY['Build something'];

  return (
    <ScrollView contentContainerStyle={st.container} showsVerticalScrollIndicator={false}>
      {/* Phone mockup */}
      <Animated.View style={[st.phone, { transform: [{ translateY: floatAnim }] }]}>
        <View style={st.phoneInner}>
          <PawsMascot mood="meditating" size={72} style={{ alignSelf: 'center', marginTop: 40 }} />
          <Text style={st.phoneLabel}>FOCUS SCORE</Text>
          <View style={st.phoneScoreRow}>
            <Text style={st.phoneScore}>{score}</Text>
            {showGrade && (
              <Animated.Text style={[st.phoneGrade, { opacity: gradeOpacity }]}>A</Animated.Text>
            )}
          </View>
        </View>
      </Animated.View>

      {/* Typewriter text */}
      {showText && (
        <TypewriterTitle text={copy} style={st.headline} delay={0} onComplete={handleTextDone} />
      )}

      {showSub && (
        <Animated.Text style={[st.subtext, { opacity: fadeAnim }]}>don't you think?</Animated.Text>
      )}

      {showButton && (
        <Animated.View style={[st.buttonWrap, { opacity: buttonOpacity }]}>
          <Text style={st.button} onPress={goNext}>Get started</Text>
          <Text style={st.terms}>By continuing, you agree to our Terms of Service and Privacy Policy</Text>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  phone: { width: 200, height: 380, borderRadius: 40, backgroundColor: '#1C1208', borderWidth: 2.5, borderColor: '#2A2A2A', overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 20 },
  phoneInner: { flex: 1, backgroundColor: '#0F0F1A' },
  phoneLabel: { fontFamily: 'Outfit_400Regular', fontSize: 9, color: '#8A7A60', letterSpacing: 2, textAlign: 'center', marginTop: 8 },
  phoneScoreRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  phoneScore: { fontFamily: 'Outfit_800ExtraBold', fontSize: 44, color: '#D4820A', textAlign: 'center' },
  phoneGrade: { fontFamily: 'Outfit_700Bold', fontSize: 26, color: '#4CAF50', marginLeft: 6 },
  headline: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: '#1C1208', textAlign: 'center', marginTop: 28 },
  subtext: { fontFamily: 'Outfit_400Regular', fontSize: 16, color: '#8A7A60', textAlign: 'center', marginTop: 8 },
  buttonWrap: { width: '100%', marginTop: 24, alignItems: 'center' },
  button: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', width: '100%', overflow: 'hidden' },
  terms: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#B0A090', textAlign: 'center', marginTop: 12 },
});
