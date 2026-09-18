import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { AnimatedPaws } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

const START_SCORE = 42;
const END_SCORE = 87;
const COUNT_DURATION = 1800;
const COUNT_DELAY = 700;

function colorForScore(score: number): string {
  if (score < 55) return '#DC2626';
  if (score < 75) return '#EAB308';
  return '#16A34A';
}

export function Screen12M({ goNext }: Props) {
  const [score, setScore] = useState(START_SCORE);
  const [arrived, setArrived] = useState(false);
  const recBlink = useRef(new Animated.Value(1)).current;
  const cornerPulse = useRef(new Animated.Value(0)).current;
  const scoreGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const recLoop = Animated.loop(Animated.sequence([
      Animated.timing(recBlink, { toValue: 0.25, duration: 600, useNativeDriver: true }),
      Animated.timing(recBlink, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]));
    recLoop.start();

    // Camera corner pulse — feels like it's watching
    const cornerLoop = Animated.loop(Animated.sequence([
      Animated.timing(cornerPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(cornerPulse, { toValue: 0, duration: 900, useNativeDriver: true }),
    ]));
    cornerLoop.start();

    let raf: number;
    let lastBucket = -1;
    const startAt = Date.now() + COUNT_DELAY;

    const tick = () => {
      const elapsed = Date.now() - startAt;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(elapsed / COUNT_DURATION, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(START_SCORE + eased * (END_SCORE - START_SCORE));
      setScore(value);

      const bucket = Math.floor(value / 10);
      if (bucket > lastBucket) {
        lastBucket = bucket;
        Haptics.selectionAsync().catch(() => {});
      }

      // Glow grows with the score
      Animated.timing(scoreGlow, {
        toValue: progress,
        duration: 80,
        useNativeDriver: true,
      }).start();

      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setArrived(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 90);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      recLoop.stop();
      cornerLoop.stop();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [recBlink, cornerPulse, scoreGlow]);

  const scoreColor = colorForScore(score);
  const weekLabel = score < 55 ? 'WEEK 1' : score < 75 ? 'WEEK 4' : 'WEEK 8';

  return (
    <View style={st.container}>
      {/* HEADER (moved to top, big) */}
      <View style={st.headerWrap}>
        <View style={st.badge}><Text style={st.badgeText}>1 — MEASURE</Text></View>
        <Text style={st.title}>Prove your brain still works.</Text>
        <Text style={st.body}>5-minute camera check. Once a week.</Text>
      </View>

      {/* iPhone mock frame with the live Focus Check screen inside */}
      <View style={st.stage}>
        <MotiView
          from={{ opacity: 0, translateY: 20, scale: 0.94 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 14, mass: 0.9, delay: 200 }}
          style={st.phoneOuter}
        >
          {/* Notch */}
          <View style={st.notch} />

          {/* Inner phone screen */}
          <View style={st.phoneScreen}>
            {/* Top bar — REC + Week */}
            <View style={st.recBar}>
              <Animated.View style={[st.recDot, { opacity: recBlink }]} />
              <Text style={st.recLabel}>REC</Text>
              <Text style={st.weekLabel}>{weekLabel} · FOCUS CHECK</Text>
            </View>

            {/* Camera-view: Paws sitting still (what the camera "sees") */}
            <View style={st.cameraView}>
              <Animated.View
                style={[
                  st.cornerTL,
                  { opacity: cornerPulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
                ]}
              />
              <Animated.View
                style={[
                  st.cornerTR,
                  { opacity: cornerPulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
                ]}
              />
              <Animated.View
                style={[
                  st.cornerBL,
                  { opacity: cornerPulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
                ]}
              />
              <Animated.View
                style={[
                  st.cornerBR,
                  { opacity: cornerPulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
                ]}
              />
              <AnimatedPaws state="focus" size={92} />
            </View>

            {/* Score */}
            <View style={st.scoreWrap}>
              <Animated.View
                pointerEvents="none"
                style={[
                  st.scoreGlow,
                  {
                    backgroundColor: scoreColor,
                    opacity: scoreGlow.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.22] }),
                  },
                ]}
              />
              <Text style={[st.scoreNum, { color: scoreColor }]}>{score}</Text>
              <Text style={st.scoreUnit}>/100</Text>
            </View>
            <Text style={st.scoreCaption}>FOCUS SCORE</Text>

            {/* Metrics */}
            <View style={st.metrics}>
              <Metric label="STILLNESS" value={`${Math.round(60 + (score - START_SCORE) * 0.85)}%`} />
              <View style={st.metricDiv} />
              <Metric label="BLINKS" value={`${Math.round(28 - (score - START_SCORE) * 0.31)}`} />
              <View style={st.metricDiv} />
              <Metric label="GRADE" value={score < 55 ? 'F' : score < 75 ? 'C' : 'A'} valueColor={scoreColor} />
            </View>

            {arrived && (
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 14 }}
                style={st.deltaWrap}
              >
                <Text style={st.deltaText}>↑ {END_SCORE - START_SCORE} since week 1</Text>
              </MotiView>
            )}
          </View>

          {/* Home indicator */}
          <View style={st.homeIndicator} />
        </MotiView>
      </View>

      <Text style={st.tagline}>Most fail their first week.</Text>
      <Text style={st.taglineSub}>Streaks lie. The camera doesn't.</Text>

      <Text style={st.btn} onPress={goNext}>Continue</Text>
    </View>
  );
}

function Metric({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={st.metricCell}>
      <Text style={[st.metricValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
      <Text style={st.metricLabel}>{label}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },

  headerWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  badgeText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 11,
    color: '#FFF',
    letterSpacing: 1,
  },
  title: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 28,
    color: '#1C1208',
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 32,
  },
  body: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#8A7A60',
    textAlign: 'center',
    marginTop: 4,
  },

  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },

  // Phone mock
  phoneOuter: {
    width: 290,
    backgroundColor: '#0A0A0A',
    borderRadius: 46,
    padding: 8,
    paddingBottom: 16,
    shadowColor: '#1C1208',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.34,
    shadowRadius: 28,
    elevation: 12,
    alignItems: 'center',
  },
  notch: {
    position: 'absolute',
    top: 10,
    width: 100,
    height: 22,
    backgroundColor: '#0A0A0A',
    borderRadius: 14,
    zIndex: 2,
  },
  phoneScreen: {
    width: '100%',
    backgroundColor: '#FAF6EE',
    borderRadius: 38,
    paddingTop: 40,
    paddingBottom: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  homeIndicator: {
    width: 80,
    height: 4,
    backgroundColor: '#3A3A3A',
    borderRadius: 2,
    marginTop: 6,
  },

  // Phone screen content
  recBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginRight: 4,
  },
  recLabel: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 9,
    color: '#DC2626',
    letterSpacing: 1.4,
    marginRight: 4,
  },
  weekLabel: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 9,
    color: '#8A7A60',
    letterSpacing: 1.2,
  },

  cameraView: {
    width: 170,
    height: 115,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  cornerTL: { position: 'absolute', top: 4, left: 4, width: 12, height: 12, borderTopWidth: 2, borderLeftWidth: 2, borderColor: '#DC2626', borderTopLeftRadius: 4 },
  cornerTR: { position: 'absolute', top: 4, right: 4, width: 12, height: 12, borderTopWidth: 2, borderRightWidth: 2, borderColor: '#DC2626', borderTopRightRadius: 4 },
  cornerBL: { position: 'absolute', bottom: 4, left: 4, width: 12, height: 12, borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#DC2626', borderBottomLeftRadius: 4 },
  cornerBR: { position: 'absolute', bottom: 4, right: 4, width: 12, height: 12, borderBottomWidth: 2, borderRightWidth: 2, borderColor: '#DC2626', borderBottomRightRadius: 4 },

  scoreWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  scoreGlow: {
    position: 'absolute',
    width: 130,
    height: 80,
    borderRadius: 60,
    top: -10,
    alignSelf: 'center',
  },
  scoreNum: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 60,
    lineHeight: 62,
    letterSpacing: -1,
  },
  scoreUnit: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 17,
    color: '#8A7A60',
    marginLeft: 4,
  },
  scoreCaption: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 10,
    color: '#1C1208',
    letterSpacing: 1.4,
    marginBottom: 12,
  },

  metrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  metricCell: { flex: 1, alignItems: 'center' },
  metricValue: { fontFamily: 'Outfit_800ExtraBold', fontSize: 16, color: '#1C1208' },
  metricLabel: { fontFamily: 'Outfit_700Bold', fontSize: 9, color: '#8A7A60', letterSpacing: 0.7, marginTop: 2 },
  metricDiv: { width: 1, height: 22, backgroundColor: '#E0D8CC' },

  deltaWrap: {
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
    backgroundColor: 'rgba(22, 163, 74, 0.10)',
    borderRadius: 100,
  },
  deltaText: { fontFamily: 'Outfit_700Bold', fontSize: 9, color: '#16A34A', letterSpacing: 0.3 },

  tagline: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.4,
  },
  taglineSub: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 12,
    color: '#1C1208',
    textAlign: 'center',
    marginTop: 4,
  },

  btn: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#F7F4EE',
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 16,
    textAlign: 'center',
    marginTop: 14,
    overflow: 'hidden',
  },
});
