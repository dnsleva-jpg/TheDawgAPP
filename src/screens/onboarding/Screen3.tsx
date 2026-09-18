import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView, MotiText } from 'moti';
import * as Haptics from 'expo-haptics';
import { TypewriterTitle } from '../../components/TypewriterTitle';

const PAWS_SELFIE = require('../../../assets/shiba/paws-selfie.png');

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen3({ goNext }: Props) {
  const insets = useSafeAreaInsets();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const recBlink = useRef(new Animated.Value(1)).current;
  const [headerDone, setHeaderDone] = useState(false);
  const [stillness, setStillness] = useState(98);
  const [blinks, setBlinks] = useState(12);
  const [focusScore, setFocusScore] = useState(94);

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -10, duration: 1400, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(recBlink, { toValue: 0.2, duration: 600, useNativeDriver: true }),
      Animated.timing(recBlink, { toValue: 1, duration: 600, useNativeDriver: true }),
    ])).start();
  }, [floatAnim, recBlink]);

  useEffect(() => {
    const stillnessId = setInterval(() => {
      setStillness(96 + Math.floor(Math.random() * 4));
    }, 1300);
    const blinksId = setInterval(() => {
      setBlinks(b => b + 1);
    }, 4200);
    const focusId = setInterval(() => {
      setFocusScore(92 + Math.floor(Math.random() * 6));
    }, 2000);
    return () => {
      clearInterval(stillnessId);
      clearInterval(blinksId);
      clearInterval(focusId);
    };
  }, []);

  const handleHeaderChar = (_index: number, char: string) => {
    if (char === ' ' || char === '.') return;
    Haptics.selectionAsync().catch(() => {});
  };

  const pawsEntryHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const line2Haptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    goNext();
  };

  return (
    <View style={[st.container, { paddingTop: insets.top + 16 }]}>
      <View style={st.headerWrap}>
        <TypewriterTitle
          text="PAWS IS RECORDING."
          style={st.header}
          delay={200}
          speed={95}
          onChar={handleHeaderChar}
          onComplete={() => setHeaderDone(true)}
        />
      </View>

      <View style={st.middle}>
        {headerDone && (
          <MotiView
            from={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 200, damping: 12, mass: 0.9 }}
            onDidAnimate={(key, finished) => finished && key === 'scale' && pawsEntryHaptic()}
          >
            <Animated.View style={[st.phoneShadow, { transform: [{ translateY: floatAnim }] }]}>
              <View style={st.phoneFrame}>
                <View style={st.dynamicIsland}>
                  <View style={st.cameraDot} />
                </View>
                <View style={st.phoneScreen}>
                  <Image source={PAWS_SELFIE} style={st.pawsSelfie} resizeMode="contain" />
                  <View style={st.recBadge}>
                    <Animated.View style={[st.recDot, { opacity: recBlink }]} />
                    <Text style={st.recText}>REC</Text>
                  </View>
                  <View style={st.hudStack}>
                    <View style={st.hudPill}>
                      <Text style={st.hudLabel}>STILLNESS</Text>
                      <Text style={st.hudValue}>{stillness}%</Text>
                    </View>
                    <View style={st.hudPill}>
                      <Text style={st.hudLabel}>BLINKS</Text>
                      <Text style={st.hudValue}>{blinks}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>
          </MotiView>
        )}

        {headerDone && (
          <MotiText
            style={st.sub}
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 14, mass: 0.8, delay: 1000 }}
            onDidAnimate={(key, finished) => finished && key === 'translateY' && line2Haptic()}
          >
            Paws is rebuilding your attention. 🔨
          </MotiText>
        )}
      </View>

      {headerDone && (
        <>
          <MotiView
            from={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 12, delay: 1700 }}
            style={st.pillsRow}
          >
            <View style={st.verifiedPill}>
              <Text style={st.verifiedCheck}>✓</Text>
              <Text style={st.verifiedText}>CAMERA VERIFIED</Text>
            </View>
            <View style={st.focusPill}>
              <Text style={st.focusLabel}>FOCUS</Text>
              <Text style={st.focusValue}>{focusScore}</Text>
            </View>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 2000 }}
          >
            <TouchableOpacity style={st.btn} onPress={handlePress} activeOpacity={0.8}>
              <Text style={st.btnText}>Continue</Text>
            </TouchableOpacity>
          </MotiView>
        </>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingBottom: 40, backgroundColor: '#F7F4EE' },
  headerWrap: { alignItems: 'center', marginTop: 8, paddingBottom: 8 },
  header: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 28,
    letterSpacing: 2,
    color: '#8A7A60',
    textAlign: 'center',
  },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  phoneShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 14,
    position: 'relative',
  },
  phoneFrame: {
    width: 200,
    height: 400,
    borderRadius: 36,
    backgroundColor: '#1C1208',
    padding: 6,
    overflow: 'hidden',
  },
  dynamicIsland: {
    alignSelf: 'center',
    width: 96,
    height: 26,
    backgroundColor: '#000',
    borderRadius: 18,
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  cameraDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#3a3a3a',
    marginRight: -60,
  },
  phoneScreen: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 30,
    backgroundColor: '#F0EAD9',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pawsSelfie: {
    width: '100%',
    height: '100%',
  },
  recBadge: {
    position: 'absolute',
    top: 44,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 100,
    gap: 4,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E74C3C',
  },
  recText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 8.5,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  hudStack: {
    position: 'absolute',
    top: 44,
    right: 10,
    gap: 5,
    alignItems: 'flex-end',
  },
  hudPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    minWidth: 58,
    alignItems: 'center',
  },
  hudLabel: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 7,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.75)',
  },
  hudValue: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    marginTop: 1,
  },
  sub: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#1C1208',
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 30,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    alignSelf: 'center',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
  },
  verifiedCheck: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 13,
    color: '#4CAF50',
  },
  verifiedText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    color: '#4CAF50',
  },
  focusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: 'rgba(212, 130, 10, 0.12)',
  },
  focusLabel: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 11,
    letterSpacing: 2,
    color: '#D4820A',
  },
  focusValue: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 13,
    color: '#D4820A',
    letterSpacing: 0.5,
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
