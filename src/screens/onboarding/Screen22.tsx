import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { MotiView, MotiText } from 'moti';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Haptics from 'expo-haptics';
import { AnimatedPaws } from '../../components/AnimatedPaws';
import { useOnboarding } from '../../context/OnboardingContext';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

interface Vision {
  glyph: string;
  title: string;
  sub: string;
}

const VISIONS: Vision[] = [
  { glyph: '🌅', title: 'Mornings without the scroll', sub: 'Wake up. Walk. Don\'t look down.' },
  { glyph: '🧠', title: 'A mind that focuses', sub: 'Read for hours. Build deep things.' },
  { glyph: '🌙', title: 'Sleep without guilt', sub: 'Phone down by 10. Rested by 7.' },
];

export function Screen22({ goNext }: Props) {
  const { yearsBack } = useOnboarding();
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  const line1 = useRef(new Animated.Value(0)).current;
  const counterOpacity = useRef(new Animated.Value(0)).current;
  const visionOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -6, duration: 1500, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
    ])).start();

    Animated.timing(line1, { toValue: 1, duration: 500, delay: 400, useNativeDriver: true }).start(() => {
      Animated.timing(counterOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });
  }, [line1, counterOpacity, floatAnim]);

  useEffect(() => {
    const target = yearsBack;
    const step = Math.max(1, Math.ceil(target / 80));
    const interval = setInterval(() => {
      setCount((c) => {
        const n = c + step;
        if (n >= target) { clearInterval(interval); setDone(true); return target; }
        return n;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [yearsBack]);

  useEffect(() => {
    if (!done) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.sequence([
      Animated.timing(visionOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [done, visionOpacity, btnOpacity]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    goNext();
  };

  return (
    <View style={st.container}>
      <View style={st.top}>
        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <AnimatedPaws state="celebrating" size={96} style={{ alignSelf: 'center' }} />
        </Animated.View>

        <Animated.Text style={[st.intro, { opacity: line1 }]}>
          But imagine this...
        </Animated.Text>

        <Animated.View style={{ opacity: counterOpacity, alignItems: 'center', marginTop: 4 }}>
          <Text style={st.counter}>{count}</Text>
          <Text style={st.counterLabel}>years back in your hands.</Text>
        </Animated.View>
      </View>

      {done && (
        <Animated.View style={[st.visionCards, { opacity: visionOpacity }]}>
          {VISIONS.map((v, i) => (
            <MotiView
              key={v.title}
              from={{ opacity: 0, translateX: -16 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', damping: 16, mass: 0.9, delay: 200 + i * 140 }}
              style={st.visionCard}
            >
              <View style={st.visionGlyphWrap}>
                <Text style={st.visionGlyph}>{v.glyph}</Text>
              </View>
              <View style={st.visionTextWrap}>
                <Text style={st.visionTitle}>{v.title}</Text>
                <Text style={st.visionSub}>{v.sub}</Text>
              </View>
            </MotiView>
          ))}
        </Animated.View>
      )}

      <Animated.View style={{ opacity: btnOpacity, width: '100%' }}>
        <TouchableOpacity activeOpacity={0.85} style={st.btn} onPress={handleNext}>
          <Text style={st.btnText}>That's what I want</Text>
        </TouchableOpacity>
      </Animated.View>

      {done && (
        <ConfettiCannon
          count={120}
          origin={{ x: SCREEN_W / 2, y: -20 }}
          fadeOut
          fallSpeed={2800}
          explosionSpeed={350}
          colors={['#16A34A', '#4CAF50', '#D4820A', '#FFB74D', '#F7F4EE']}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 40,
    paddingBottom: 40,
    backgroundColor: '#F7F4EE',
  },
  top: {
    alignItems: 'center',
    width: '100%',
  },
  intro: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#8A7A60',
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 0.2,
  },
  counter: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 92,
    color: '#16A34A',
    textAlign: 'center',
    lineHeight: 96,
    letterSpacing: -1,
  },
  counterLabel: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 18,
    color: '#1C1208',
    textAlign: 'center',
    letterSpacing: 0.2,
    marginTop: 2,
  },
  visionCards: {
    width: '100%',
    gap: 10,
    marginVertical: 12,
  },
  visionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FAF6EE',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDE5D2',
    shadowColor: '#1C1208',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  visionGlyphWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 130, 10, 0.12)',
  },
  visionGlyph: {
    fontSize: 26,
  },
  visionTextWrap: {
    flex: 1,
  },
  visionTitle: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 15,
    color: '#1C1208',
    letterSpacing: 0.2,
  },
  visionSub: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#8A7A60',
    marginTop: 2,
    lineHeight: 16,
  },
  btn: {
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#F7F4EE',
    letterSpacing: 0.4,
  },
});
