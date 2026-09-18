import React, { useEffect, useRef, useState } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';

const PAWS_STATES = {
  focused: require('../../assets/shiba/shiba-thriving.png'),
  struggling: require('../../assets/shiba/paws-scroll-2.png'),
  aboutToBlink: require('../../assets/shiba/paws-scroll-3.png'),
  blinked: require('../../assets/shiba/paws-scroll-4.png'),
  won: require('../../assets/shiba/paws-scroll-5.png'),
};

interface PawsOpponentProps {
  /** Seconds elapsed in the match */
  elapsed: number;
  /** When Paws will blink (seconds) */
  blinkTime: number;
  /** Whether user blinked first */
  userBlinkedFirst: boolean;
  /** Whether match is over */
  matchOver: boolean;
  /** Size of Paws */
  size?: number;
}

export function PawsOpponent({ elapsed, blinkTime, userBlinkedFirst, matchOver, size = 120 }: PawsOpponentProps) {
  const earTwitch = useRef(new Animated.Value(0)).current;
  const [hasBlinked, setHasBlinked] = useState(false);
  const blinkOpacity = useRef(new Animated.Value(1)).current;

  // Ear twitch animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(earTwitch, { toValue: 3, duration: 100, useNativeDriver: true }),
        Animated.timing(earTwitch, { toValue: -2, duration: 80, useNativeDriver: true }),
        Animated.timing(earTwitch, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]).start();
    }, 4000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [earTwitch]);

  // Paws blink animation
  useEffect(() => {
    if (elapsed >= blinkTime && !hasBlinked && blinkTime < 999) {
      setHasBlinked(true);
      // Quick blink: opacity 1 → 0 → 1 over 300ms
      Animated.sequence([
        Animated.timing(blinkOpacity, { toValue: 0.1, duration: 100, useNativeDriver: true }),
        Animated.timing(blinkOpacity, { toValue: 0.1, duration: 100, useNativeDriver: true }),
        Animated.timing(blinkOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }
  }, [elapsed, blinkTime, hasBlinked, blinkOpacity]);

  // Determine which image to show
  const getImage = () => {
    if (matchOver && userBlinkedFirst) return PAWS_STATES.won;
    if (hasBlinked) return PAWS_STATES.blinked;
    if (elapsed >= blinkTime - 3) return PAWS_STATES.aboutToBlink;
    if (elapsed >= blinkTime - 6) return PAWS_STATES.struggling;
    return PAWS_STATES.focused;
  };

  return (
    <Animated.View style={[st.container, {
      width: size,
      height: size,
      transform: [{ rotate: earTwitch.interpolate({ inputRange: [-3, 0, 3], outputRange: ['-2deg', '0deg', '2deg'] }) }],
    }]}>
      <Animated.Image
        source={getImage()}
        style={[st.image, { width: size, height: size, opacity: blinkOpacity }]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const st = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {},
});
