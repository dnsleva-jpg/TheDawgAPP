import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';

const PAWS_IMG = require('../../../assets/shiba/shiba-thriving.png');

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function ScreenLogo({ goNext }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo fade + scale in
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start(() => {
      // Then text fades in
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start(() => {
        // Auto-advance after pause
        setTimeout(goNext, 1500);
      });
    });
  }, [scaleAnim, opacityAnim, textOpacity, goNext]);

  return (
    <View style={st.container}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
        <Image source={PAWS_IMG} style={st.logo} resizeMode="contain" />
      </Animated.View>
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={st.title}>Do Nothin'</Text>
        <Text style={st.subtitle}>Reclaim Your Brain.</Text>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 36,
    color: '#1C1208',
    letterSpacing: 3,
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 17,
    color: '#8A7A60',
    marginTop: 6,
  },
});
