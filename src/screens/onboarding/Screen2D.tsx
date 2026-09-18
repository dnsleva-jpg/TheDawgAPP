import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Easing } from 'react-native-reanimated';
import { MotiView, MotiText } from 'moti';
import * as Haptics from 'expo-haptics';

const PAWS_FOCUS = require('../../../assets/shiba/paws-focus.png');

type Intensity = 'Light' | 'Medium' | 'Heavy';

const TACTICS: Array<{
  emoji: string;
  label: string;
  intensity: Intensity;
  pos: { top?: number; bottom?: number; left?: number; right?: number };
}> = [
  { emoji: '🔴', label: 'Red dots',           intensity: 'Light',  pos: { top: 0,   left: 6 } },
  { emoji: '🎰', label: 'Variable rewards',   intensity: 'Light',  pos: { top: 16,  right: 0 } },
  { emoji: '♾️', label: 'Infinite scroll',    intensity: 'Medium', pos: { top: 96,  left: -10 } },
  { emoji: '🔔', label: 'Push alerts',        intensity: 'Medium', pos: { top: 108, right: -8 } },
  { emoji: '🎯', label: 'Personalized feed',  intensity: 'Heavy',  pos: { bottom: 16, left: 16 } },
  { emoji: '👁️', label: 'Read receipts',     intensity: 'Heavy',  pos: { bottom: 0,  right: 30 } },
];

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen2D({ goNext }: Props) {
  const insets = useSafeAreaInsets();
  const [headerDone, setHeaderDone] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -6, duration: 1400, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
    ])).start();
  }, [floatAnim]);

  useEffect(() => {
    if (!headerDone) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    TACTICS.forEach((tactic, i) => {
      timers.push(setTimeout(() => {
        setRevealedCount(i + 1);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle[tactic.intensity]).catch(() => {});
        if (i > 2) {
          setTimeout(() => Haptics.selectionAsync().catch(() => {}), 50);
        }
      }, 700 + i * 280));
    });
    return () => timers.forEach(clearTimeout);
  }, [headerDone]);

  const headerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const subBigHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  };

  const subSmallHaptic = () => {
    Haptics.selectionAsync().catch(() => {});
  };

  const reframeHaptic = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 120);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    goNext();
  };

  return (
    <View
      style={[
        st.container,
        {
          paddingTop: insets.top + 16,
          paddingBottom: Math.max(insets.bottom, 20) + 14,
        },
      ]}
    >
      <View style={st.headerWrap}>
        <MotiText
          style={st.header}
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 750, delay: 280, easing: Easing.out(Easing.cubic) }}
          onDidAnimate={(key, finished) => {
            if (finished && key === 'translateY') {
              headerHaptic();
              setHeaderDone(true);
            }
          }}
        >
          This isn't an accident.
        </MotiText>
      </View>

      <View style={st.middle}>
        {headerDone && (
          <View style={st.scene}>
            <MotiView
              from={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 200, damping: 14, mass: 0.9 }}
              style={st.pawsWrap}
            >
              <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
                <Image source={PAWS_FOCUS} style={st.pawsImg} resizeMode="contain" />
              </Animated.View>
            </MotiView>

            {TACTICS.map((tactic, i) => {
              const revealed = i < revealedCount;
              return (
                <MotiView
                  key={tactic.label}
                  style={[st.chip, tactic.pos]}
                  from={{ opacity: 0, scale: 0.4 }}
                  animate={{
                    opacity: revealed ? 1 : 0,
                    scale: revealed ? [0.4, 1.25, 1] as any : 0.4,
                  }}
                  transition={{ type: 'timing', duration: 380 }}
                >
                  <Text style={st.chipEmoji}>{tactic.emoji}</Text>
                  <Text style={st.chipText}>{tactic.label}</Text>
                </MotiView>
              );
            })}
          </View>
        )}

        {headerDone && (
          <MotiText
            style={st.subBig}
            from={{ opacity: 0, translateY: 18 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, mass: 1.4, delay: 3000 }}
            onDidAnimate={(key, finished) => finished && key === 'translateY' && subBigHaptic()}
          >
            1,000 <Text style={st.subBigUnit}>ENGINEERS</Text>
          </MotiText>
        )}

        {headerDone && (
          <MotiText
            style={st.subSmall}
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, mass: 1.2, delay: 3600 }}
            onDidAnimate={(key, finished) => finished && key === 'translateY' && subSmallHaptic()}
          >
            paid to keep you scrolling. right now.
          </MotiText>
        )}

        {headerDone && (
          <MotiView
            from={{ opacity: 0, translateY: 18 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, mass: 1.6, delay: 4300 }}
            onDidAnimate={(key, finished) => finished && key === 'translateY' && reframeHaptic()}
            style={st.reframeWrap}
          >
            <Text style={st.reframeLine}>
              Them: an <Text style={st.reframeKey}>ARMY.</Text>
            </Text>
            <Text style={st.reframeLine}>
              You: one <Text style={st.reframeKey}>BRAIN.</Text>
            </Text>
          </MotiView>
        )}
      </View>

      {headerDone && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 5000 }}
        >
          <TouchableOpacity style={st.btn} onPress={handlePress} activeOpacity={0.8}>
            <Text style={st.btnText}>How do I fight back?</Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  headerWrap: { alignItems: 'center', marginTop: 4, paddingHorizontal: 4 },
  header: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 30,
    color: '#1C1208',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 8 },
  scene: {
    width: 320,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pawsWrap: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  pawsImg: {
    width: 150,
    height: 150,
  },
  chip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 3,
    maxWidth: 170,
  },
  chipEmoji: { fontSize: 14 },
  chipText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 11,
    color: '#1C1208',
  },
  subBig: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 38,
    color: '#1C1208',
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 1,
    lineHeight: 42,
  },
  subBigUnit: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 22,
    color: '#1C1208',
    letterSpacing: 2,
  },
  subSmall: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#8A7A60',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 18,
  },
  reframeWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  reframeLine: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 14,
    color: '#1C1208',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 0.5,
  },
  reframeKey: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 24,
    color: '#D4820A',
    letterSpacing: 1.4,
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
