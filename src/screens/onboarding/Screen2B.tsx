import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Easing } from 'react-native-reanimated';
import { MotiView, MotiText } from 'moti';
import * as Haptics from 'expo-haptics';
// NOTE: bark sound disabled — bark-short.mp3 is a corrupt LFS pull (S3 Access Denied).
// Re-enable once asset is fixed.

const PAWS_MELTING = require('../../../assets/shiba/paws-melting.png');

const TIMES_CALM = ['7:14 PM'];
const TIMES_RACE = ['7:14 PM', '8:23 PM', '9:47 PM', '11:18 PM', '1:32 AM'];

type Notif = {
  app: string;
  appColor: string;
  iconGlyph: string;
  title: string;
  body: string;
  time: string;
  pos: { top: number; left?: number; right?: number };
};

const MOM: Notif = {
  app: 'MESSAGES', appColor: '#22C55E', iconGlyph: '💬',
  title: 'Mom', body: 'Sent a photo', time: 'now',
  pos: { top: 0, left: -4 },
};

const BOMB: Notif[] = [
  { app: 'TIKTOK',    appColor: '#0A0A0A', iconGlyph: '♪',  title: 'For You',     body: '47 new posts you might like', time: '1m', pos: { top: 30, right: -10 } },
  { app: 'INSTAGRAM', appColor: '#E4405F', iconGlyph: '◉',  title: 'Sarah Chen',  body: 'liked your post · 2 others',  time: '2m', pos: { top: 92, left: -14 } },
  { app: 'MAIL',      appColor: '#3B82F6', iconGlyph: '✉',  title: 'Boss',        body: 'Need this by EOD',            time: '3m', pos: { top: 120, right: -12 } },
  { app: 'SNAPCHAT',  appColor: '#FFFC00', iconGlyph: '👻', title: '12 streaks',  body: 'expiring in 3 hours',         time: '5m', pos: { top: 184, left: 6 } },
  { app: 'X',         appColor: '#1C1208', iconGlyph: '𝕏',  title: 'Trending',    body: "Don't miss what people say",  time: '7m', pos: { top: 212, right: 18 } },
];

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen2B({ goNext }: Props) {
  const insets = useSafeAreaInsets();
  const [headerDone, setHeaderDone] = useState(false);
  const [bombStarted, setBombStarted] = useState(false);
  const [timeIdx, setTimeIdx] = useState(0);

  const meltAnim = useRef(new Animated.Value(0)).current;
  const tapAnim = useRef(new Animated.Value(0)).current;
  const redFlash = useRef(new Animated.Value(0)).current;

  // Bark sound removed — corrupt asset.
  const playBark = () => {};

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(meltAnim, { toValue: 4, duration: 1500, useNativeDriver: true }),
      Animated.timing(meltAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
    ])).start();
  }, [meltAnim]);

  useEffect(() => {
    if (!headerDone) return;
    if (!bombStarted) {
      setTimeIdx(0);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i++;
      if (i >= TIMES_RACE.length) {
        clearInterval(id);
        setTimeIdx(TIMES_RACE.length - 1);
        return;
      }
      setTimeIdx(i);
    }, 280);
    return () => clearInterval(id);
  }, [headerDone, bombStarted]);

  useEffect(() => {
    if (!headerDone) return;

    const tapTimer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(tapAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(tapAnim, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      setTimeout(() => Haptics.selectionAsync().catch(() => {}), 60);
    }, 1900);

    const bombTimer = setTimeout(() => setBombStarted(true), 2700);

    return () => {
      clearTimeout(tapTimer);
      clearTimeout(bombTimer);
    };
  }, [headerDone, tapAnim]);

  useEffect(() => {
    if (!bombStarted) return;
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    BOMB.forEach((_, i) => {
      timers.push(setTimeout(() => {
        Animated.sequence([
          Animated.timing(redFlash, { toValue: 1, duration: 70, useNativeDriver: true }),
          Animated.timing(redFlash, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid).catch(() => {});
        playBark();
        setTimeout(() => Haptics.selectionAsync().catch(() => {}), 40);
      }, i * 300));
    });
    return () => timers.forEach(clearTimeout);
  }, [bombStarted, redFlash]);

  const headerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const momHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    playBark();
  };

  const subBigHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
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
    <View style={[st.container, { paddingTop: insets.top + 16 }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          st.screenFlash,
          {
            opacity: redFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
          },
        ]}
      />
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
          You opened your phone for one thing.
        </MotiText>
      </View>

      <View style={st.middle}>
        {headerDone && (
          <View style={st.scene}>
            <MotiView
              from={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 100, damping: 12 }}
              style={st.phoneWrap}
            >
              <View style={st.phoneFrame}>
                <View style={st.dynamicIsland} />
                <View style={st.phoneScreen}>
                  <Text style={st.timeText}>{(bombStarted ? TIMES_RACE : TIMES_CALM)[timeIdx]}</Text>
                  <View style={st.feedLines}>
                    <View style={[st.feedLine, { width: '85%' }]} />
                    <View style={[st.feedLine, { width: '60%' }]} />
                    <View style={[st.feedLine, { width: '90%' }]} />
                    <View style={[st.feedLine, { width: '50%' }]} />
                    <View style={[st.feedLine, { width: '75%' }]} />
                  </View>
                </View>
              </View>
            </MotiView>

            <MotiView
              key="mom"
              style={[st.notif, MOM.pos]}
              from={{ opacity: 0, scale: 0.6, translateY: -8 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: 600, damping: 14, mass: 0.9 }}
              onDidAnimate={(key, finished) => finished && key === 'scale' && momHaptic()}
            >
              <View style={[st.notifIcon, { backgroundColor: MOM.appColor }]}>
                <Text style={st.notifIconGlyph}>{MOM.iconGlyph}</Text>
              </View>
              <View style={st.notifBody}>
                <View style={st.notifHeader}>
                  <Text style={st.notifApp}>{MOM.app}</Text>
                  <Text style={st.notifTime}>{MOM.time}</Text>
                </View>
                <Text style={st.notifTitle} numberOfLines={1}>{MOM.title}</Text>
                <Text style={st.notifText} numberOfLines={1}>{MOM.body}</Text>
              </View>
            </MotiView>

            <Animated.View
              pointerEvents="none"
              style={[
                st.tapRipple,
                {
                  top: MOM.pos.top + 12,
                  left: (MOM.pos.left ?? 0) + 70,
                  opacity: tapAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] }),
                  transform: [
                    { scale: tapAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 2.2] }) },
                  ],
                },
              ]}
            />

            {bombStarted && BOMB.map((n, i) => (
              <MotiView
                key={n.app + i}
                style={[st.notif, n.pos]}
                from={{ opacity: 0, scale: 0.4, translateY: -6 }}
                animate={{ opacity: 1, scale: [0.4, 1.06, 1] as any, translateY: 0 }}
                transition={{ type: 'timing', duration: 380, delay: i * 300 }}
              >
                <View style={[st.notifIcon, { backgroundColor: n.appColor }]}>
                  <Text style={[st.notifIconGlyph, n.appColor === '#FFFC00' && { color: '#1C1208' }]}>
                    {n.iconGlyph}
                  </Text>
                </View>
                <View style={st.notifBody}>
                  <View style={st.notifHeader}>
                    <Text style={st.notifApp}>{n.app}</Text>
                    <Text style={st.notifTime}>{n.time}</Text>
                  </View>
                  <Text style={st.notifTitle} numberOfLines={1}>{n.title}</Text>
                  <Text style={st.notifText} numberOfLines={1}>{n.body}</Text>
                </View>
              </MotiView>
            ))}

            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 700, delay: 4400 }}
              style={st.pawsCenter}
            >
              <Animated.View style={{ transform: [{ translateY: meltAnim }] }}>
                <Image source={PAWS_MELTING} style={st.pawsImg} resizeMode="contain" />
              </Animated.View>
            </MotiView>
          </View>
        )}

        {headerDone && (
          <MotiText
            style={st.subBig}
            from={{ opacity: 0, translateY: 22 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, mass: 1.4, delay: 5200 }}
            onDidAnimate={(key, finished) => finished && key === 'translateY' && subBigHaptic()}
          >
            1 notification.
          </MotiText>
        )}

        {headerDone && (
          <MotiText
            style={st.subSmall}
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, mass: 1.2, delay: 5900 }}
            onDidAnimate={(key, finished) => finished && key === 'translateY' && subSmallHaptic()}
          >
            Hours of mindless scrolling.
          </MotiText>
        )}

        {headerDone && (
          <MotiView
            from={{ opacity: 0, translateY: 18 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 20, mass: 1.6, delay: 6700 }}
            onDidAnimate={(key, finished) => finished && key === 'translateY' && reframeHaptic()}
            style={st.reframeWrap}
          >
            <Text style={st.reframeLine}>
              It's not <Text style={st.reframeKey}>YOU</Text>
            </Text>
            <Text style={st.reframeLine}>
              It's the <Text style={st.reframeKey}>ALGORITHM</Text>
            </Text>
          </MotiView>
        )}
      </View>

      {headerDone && (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 7400 }}
        >
          <TouchableOpacity style={st.btn} onPress={handlePress} activeOpacity={0.8}>
            <Text style={st.btnText}>I've been there</Text>
          </TouchableOpacity>
        </MotiView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingBottom: 40, backgroundColor: '#F7F4EE' },
  headerWrap: { alignItems: 'center', marginTop: 8, minHeight: 80, paddingHorizontal: 4 },
  header: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 26,
    color: '#1C1208',
    textAlign: 'center',
    lineHeight: 32,
  },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'flex-start' },
  scene: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  phoneWrap: {
    zIndex: 1,
  },
  phoneFrame: {
    width: 132,
    height: 248,
    borderRadius: 26,
    backgroundColor: '#1C1208',
    padding: 5,
    overflow: 'hidden',
  },
  dynamicIsland: {
    alignSelf: 'center',
    width: 52,
    height: 13,
    backgroundColor: '#000',
    borderRadius: 11,
    marginTop: 4,
    zIndex: 2,
  },
  phoneScreen: {
    position: 'absolute',
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 22,
    backgroundColor: '#F0EAD9',
    paddingTop: 26,
    paddingHorizontal: 11,
    alignItems: 'center',
    overflow: 'hidden',
  },
  screenFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF3B30',
    zIndex: 100,
  },
  timeText: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 20,
    color: '#1C1208',
    letterSpacing: 1,
  },
  feedLines: {
    marginTop: 14,
    width: '100%',
    gap: 7,
    alignItems: 'center',
  },
  feedLine: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D4C8AE',
  },
  notif: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 250, 245, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 8,
    width: 200,
    shadowColor: '#1C1208',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(28, 18, 8, 0.06)',
  },
  notifIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifIconGlyph: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  notifBody: {
    flex: 1,
    minWidth: 0,
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1,
  },
  notifApp: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 9,
    color: '#8A7A60',
    letterSpacing: 0.8,
  },
  notifTime: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 9,
    color: '#8A7A60',
  },
  notifTitle: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 11,
    color: '#1C1208',
    letterSpacing: 0.1,
  },
  notifText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 10,
    color: '#1C1208',
    marginTop: 0,
  },
  tapRipple: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    zIndex: 5,
  },
  pawsCenter: {
    position: 'absolute',
    bottom: -6,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
  pawsImg: {
    width: 96,
    height: 96,
  },
  subBig: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 30,
    color: '#1C1208',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
    lineHeight: 36,
  },
  subSmall: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#8A7A60',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 24,
  },
  reframeWrap: {
    alignItems: 'center',
    marginTop: 18,
  },
  reframeLine: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#1C1208',
    textAlign: 'center',
    lineHeight: 28,
  },
  reframeKey: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 22,
    color: '#D4820A',
    letterSpacing: 1.2,
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
