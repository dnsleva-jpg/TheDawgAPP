import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AnimatedPaws } from '../../components/AnimatedPaws';
import { TypewriterTitle } from '../../components/TypewriterTitle';

const PAWS_STOP = require('../../../assets/shiba/paws-stop.png');

const POSTS = [
  { accent: '#DC2626', tag: '#trending' },
  { accent: '#D4820A', tag: '#fyp' },
  { accent: '#7C2D12', tag: '#viral' },
];
const CARD_W = 120;

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function ScreenIntro({ goNext }: Props) {
  const insets = useSafeAreaInsets();
  const [showPaws, setShowPaws] = useState(false);
  const [showStart, setShowStart] = useState(false);

  // Headline crossfade
  const stopOpacity = useRef(new Animated.Value(1)).current;
  const startOpacity = useRef(new Animated.Value(0)).current;
  const startTranslate = useRef(new Animated.Value(24)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  // Phone + finger + content
  const fingerX = useRef(new Animated.Value(0)).current;
  const contentX = useRef(new Animated.Value(0)).current;
  const phoneShake = useRef(new Animated.Value(0)).current;
  const phoneOpacity = useRef(new Animated.Value(1)).current;
  const phoneScale = useRef(new Animated.Value(1)).current;

  // Paws layers
  const determinedScale = useRef(new Animated.Value(0)).current;
  const determinedOpacity = useRef(new Animated.Value(0)).current;
  const focusScale = useRef(new Animated.Value(0.85)).current;
  const focusOpacity = useRef(new Animated.Value(0)).current;

  // Finger sideways swipe loop
  useEffect(() => {
    if (showPaws) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fingerX, {
          toValue: -55,
          duration: 380,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(fingerX, {
          toValue: 0,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.delay(180),
      ])
    );
    loop.start();
    return () => {
      loop.stop();
      fingerX.setValue(0);
    };
  }, [showPaws, fingerX]);

  // Content row continuous slide left (3 cards + duplicate first for seamless loop)
  useEffect(() => {
    if (showPaws) return;
    const loop = Animated.loop(
      Animated.timing(contentX, {
        toValue: -CARD_W * POSTS.length,
        duration: 2100,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      contentX.setValue(0);
    };
  }, [showPaws, contentX]);

  // Phase 2: Paws (determined) intercepts, phone shakes
  useEffect(() => {
    if (!showPaws) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    Animated.parallel([
      Animated.spring(determinedScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(determinedOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(phoneShake, { toValue: 6, duration: 55, useNativeDriver: true }),
        Animated.timing(phoneShake, { toValue: -6, duration: 55, useNativeDriver: true }),
        Animated.timing(phoneShake, { toValue: 5, duration: 55, useNativeDriver: true }),
        Animated.timing(phoneShake, { toValue: -3, duration: 55, useNativeDriver: true }),
        Animated.timing(phoneShake, { toValue: 0, duration: 55, useNativeDriver: true }),
      ]),
    ]).start();

    const timer = setTimeout(() => setShowStart(true), 1300);
    return () => clearTimeout(timer);
  }, [showPaws, determinedScale, determinedOpacity, phoneShake]);

  // Phase 3: Crossfade headline + paws, fade phone
  useEffect(() => {
    if (!showStart) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    Animated.parallel([
      Animated.timing(stopOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(startOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(startTranslate, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      Animated.timing(phoneOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(phoneScale, { toValue: 0.7, duration: 500, useNativeDriver: true }),
      Animated.timing(determinedOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(focusOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(focusScale, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
    ]).start(() => {
      Animated.timing(buttonOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });
  }, [
    showStart,
    stopOpacity,
    startOpacity,
    startTranslate,
    phoneOpacity,
    phoneScale,
    determinedOpacity,
    focusOpacity,
    focusScale,
    buttonOpacity,
  ]);

  const handleTypewriterChar = (_index: number, char: string) => {
    if (char === ' ' || char === '.') return;
    if (char === 'S') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    } else {
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    goNext();
  };

  const cards = [...POSTS, POSTS[0]];

  return (
    <View style={[st.container, { paddingTop: insets.top + 20 }]}>
      <Text style={st.brand}>DO NOTHIN.</Text>

      <View style={st.scene}>
        <Animated.View
          style={[
            st.phoneScene,
            {
              opacity: phoneOpacity,
              transform: [
                { translateX: phoneShake },
                { scale: phoneScale },
              ],
            },
          ]}
        >
          <View style={st.phoneFrame}>
            <View style={st.dynamicIsland} />
            <View style={st.phoneScreen}>
              <Animated.View
                style={[
                  st.contentRow,
                  { transform: [{ translateX: contentX }] },
                ]}
              >
                {cards.map((p, i) => (
                  <View key={i} style={st.post}>
                    <View style={st.postHeader}>
                      <View style={[st.profilePic, { backgroundColor: p.accent }]} />
                      <View style={st.postUserBar} />
                    </View>
                    <View style={[st.postMedia, { backgroundColor: p.accent }]}>
                      <Text style={st.playIcon}>▶</Text>
                    </View>
                    <View style={st.postFooter}>
                      <Text style={st.postIcons}>♥  💬  ↗</Text>
                      <Text style={st.postTag}>{p.tag}</Text>
                    </View>
                  </View>
                ))}
              </Animated.View>
            </View>
          </View>

          <Animated.Text
            style={[
              st.finger,
              { transform: [{ translateX: fingerX }] },
            ]}
          >
            👆
          </Animated.Text>
        </Animated.View>

        <Animated.Image
          source={PAWS_STOP}
          style={[
            st.pawsLayer,
            {
              opacity: determinedOpacity,
              transform: [{ scale: determinedScale }],
            },
          ]}
          resizeMode="contain"
        />

        <Animated.View
          style={[
            st.pawsLayer,
            {
              opacity: focusOpacity,
              transform: [{ scale: focusScale }],
            },
          ]}
          pointerEvents="none"
        >
          <AnimatedPaws state="focus" size={240} />
        </Animated.View>
      </View>

      <View style={st.headlineWrap}>
        <Animated.View style={[st.headlineLayer, { opacity: stopOpacity }]}>
          <TypewriterTitle
            text="STOP SCROLLING."
            style={st.headline}
            delay={500}
            speed={110}
            onChar={handleTypewriterChar}
            onComplete={() => setTimeout(() => setShowPaws(true), 400)}
          />
        </Animated.View>
        <Animated.Text
          style={[
            st.headline,
            st.headlineLayer,
            { opacity: startOpacity, transform: [{ translateY: startTranslate }] },
          ]}
        >
          START FOCUSING.
        </Animated.Text>
      </View>

      <Animated.View style={[st.bottomSection, { opacity: buttonOpacity }]}>
        <TouchableOpacity style={st.button} onPress={handleStart} activeOpacity={0.8}>
          <Text style={st.buttonText}>Get started</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 50,
  },
  brand: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 28,
    letterSpacing: 6,
    color: '#1C1208',
    marginTop: 8,
  },
  scene: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneScene: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
    height: 280,
  },
  phoneFrame: {
    width: 130,
    height: 230,
    borderRadius: 26,
    backgroundColor: '#1C1208',
    padding: 5,
    overflow: 'hidden',
    shadowColor: '#1C1208',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
  },
  dynamicIsland: {
    alignSelf: 'center',
    width: 50,
    height: 12,
    backgroundColor: '#000',
    borderRadius: 10,
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
    paddingTop: 22,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    width: CARD_W * 4,
  },
  post: {
    width: CARD_W,
    paddingHorizontal: 6,
    gap: 4,
    height: 196,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  profilePic: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  postUserBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1C1208',
  },
  postMedia: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '900',
  },
  postFooter: {
    marginTop: 2,
    gap: 2,
  },
  postIcons: {
    fontSize: 11,
    color: '#1C1208',
    letterSpacing: 1,
  },
  postTag: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 8,
    color: '#8A7A60',
  },
  finger: {
    position: 'absolute',
    top: 132,
    left: 138,
    fontSize: 38,
  },
  pawsLayer: {
    position: 'absolute',
    width: 260,
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    width: '100%',
  },
  headlineLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  headline: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 32,
    color: '#1C1208',
    textAlign: 'center',
    lineHeight: 40,
  },
  bottomSection: {
    width: '100%',
    paddingHorizontal: 24,
  },
  button: {
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#F7F4EE',
  },
});
