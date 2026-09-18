import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, MotiText } from 'moti';
import * as Haptics from 'expo-haptics';
import { AnimatedPaws } from '../../components/AnimatedPaws';
import { TypewriterTitle } from '../../components/TypewriterTitle';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen2({ goNext }: Props) {
  const insets = useSafeAreaInsets();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [headerDone, setHeaderDone] = useState(false);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -10, duration: 1400, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
    ])).start();
  }, [floatAnim]);

  const handleHeaderChar = (_index: number, char: string) => {
    if (char === ' ' || char === '.') return;
    Haptics.selectionAsync().catch(() => {});
  };

  const pawsEntryHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const pauseLineHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const watchLineHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTimeout(() => Haptics.selectionAsync().catch(() => {}), 80);
    setTimeout(() => Haptics.selectionAsync().catch(() => {}), 160);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    goNext();
  };

  return (
    <View style={[st.container, { paddingTop: insets.top + 16 }]}>
      <View style={st.headerWrap}>
        <TypewriterTitle
          text="MEET PAWS."
          style={st.header}
          delay={200}
          speed={110}
          onChar={handleHeaderChar}
          onComplete={() => setHeaderDone(true)}
        />
        {headerDone && (
          <MotiText
            style={st.roleTag}
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            your focus buddy
          </MotiText>
        )}
      </View>

      <View style={st.middle}>
        {headerDone && (
          <MotiView
            from={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 200, damping: 12, mass: 0.9 }}
            onDidAnimate={(key, finished) => finished && key === 'scale' && pawsEntryHaptic()}
          >
            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
              <AnimatedPaws state="focus" size={300} style={{ alignSelf: 'center' }} />
            </Animated.View>
          </MotiView>
        )}

        {headerDone && (
          <>
            <MotiText
              style={st.sub}
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 14, mass: 0.8, delay: 900 }}
              onDidAnimate={(key, finished) => finished && key === 'translateY' && pauseLineHaptic()}
            >
              Paws helps you pause. ⏸️
            </MotiText>
            <MotiText
              style={st.sub2}
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 14, mass: 0.8, delay: 1700 }}
              onDidAnimate={(key, finished) => finished && key === 'translateY' && watchLineHaptic()}
            >
              Then Paws helps you focus. 🎯
            </MotiText>
          </>
        )}
      </View>

      {headerDone && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 2400 }}
        >
          <TouchableOpacity style={st.btn} onPress={handlePress} activeOpacity={0.8}>
            <Text style={st.btnText}>Let's go!</Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingBottom: 40, backgroundColor: '#F7F4EE' },
  headerWrap: { alignItems: 'center', marginTop: 8, minHeight: 80 },
  header: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 40,
    letterSpacing: 6,
    color: '#1C1208',
    textAlign: 'center',
  },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  roleTag: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
    letterSpacing: 2,
    color: '#8A7A60',
    textAlign: 'center',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  sub: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: '#1C1208',
    textAlign: 'center',
    marginTop: 28,
    lineHeight: 32,
  },
  sub2: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 24,
    color: '#1C1208',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 32,
  },
  btn: {
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 18,
    width: '100%',
  },
  btnText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#F7F4EE',
    textAlign: 'center',
  },
});
