import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';

// All Paws state images
const PAWS_IMAGES: Record<string, any> = {
  focus: require('../../assets/shiba/paws-focus.png'),
  calm: require('../../assets/shiba/paws-calm.png'),
  tempted: require('../../assets/shiba/paws-tempted.png'),
  pickingUp: require('../../assets/shiba/paws-picking-up.png'),
  hooked: require('../../assets/shiba/paws-hooked.png'),
  cantStop: require('../../assets/shiba/paws-cant-stop.png'),
  brainFog: require('../../assets/shiba/paws-brain-fog.png'),
  melting: require('../../assets/shiba/paws-melting.png'),
  severeRot: require('../../assets/shiba/paws-severe-rot.png'),
  fullRot: require('../../assets/shiba/paws-full-rot.png'),
  deadRot: require('../../assets/shiba/paws-dead-rot.png'),
  dissolved: require('../../assets/shiba/paws-dissolved.png'),
  decaying: require('../../assets/shiba/paws-decaying.png'),
  grave: require('../../assets/shiba/paws-grave.png'),
  notepad: require('../../assets/shiba/paws-notepad.png'),
  celebrating: require('../../assets/shiba/paws-celebrating.png'),
  victory: require('../../assets/shiba/paws-victory.png'),
};

export type PawsAnimState =
  | 'focus' | 'calm' | 'tempted' | 'pickingUp' | 'hooked'
  | 'cantStop' | 'brainFog' | 'melting' | 'severeRot' | 'fullRot'
  | 'deadRot' | 'dissolved' | 'decaying' | 'grave'
  | 'notepad' | 'celebrating' | 'victory';

interface AnimatedPawsProps {
  state: PawsAnimState;
  size: number;
  style?: any;
}

export function AnimatedPaws({ state, size, style }: AnimatedPawsProps) {
  // Shared animations
  const floatY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const squishY = useRef(new Animated.Value(1)).current;

  // Particle animations
  const particle1 = useRef(new Animated.Value(0)).current;
  const particle2 = useRef(new Animated.Value(0)).current;
  const particle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stop previous loops — leave values wherever they are so the next
    // animation picks up smoothly instead of snapping back to rest.
    floatY.stopAnimation();
    scale.stopAnimation();
    rotate.stopAnimation();
    shakeX.stopAnimation();
    squishY.stopAnimation();
    particle1.stopAnimation();
    particle2.stopAnimation();
    particle3.stopAnimation();

    // Soft ease back toward rest over ~180ms; new loops start in parallel
    // and take over. This is what prevents the mid-drag "snap".
    Animated.parallel([
      Animated.timing(floatY,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(shakeX,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(rotate,  { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(scale,   { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(squishY, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    switch (state) {
      case 'focus':
        // Gentle float + breathing + sparkle particles
        Animated.loop(Animated.sequence([
          Animated.timing(floatY, { toValue: -10, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(floatY, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.timing(scale, { toValue: 1.03, duration: 2000, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])).start();
        // Sparkle particles
        Animated.loop(Animated.sequence([
          Animated.timing(particle1, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(particle1, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])).start();
        break;

      case 'calm':
        // Slow breathing
        Animated.loop(Animated.sequence([
          Animated.timing(scale, { toValue: 1.04, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])).start();
        break;

      case 'tempted':
        // Eyes glancing — subtle rotate back and forth
        Animated.loop(Animated.sequence([
          Animated.timing(rotate, { toValue: 0.03, duration: 2000, useNativeDriver: true }),
          Animated.delay(500),
          Animated.timing(rotate, { toValue: -0.02, duration: 1500, useNativeDriver: true }),
          Animated.delay(1000),
          Animated.timing(rotate, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])).start();
        break;

      case 'pickingUp':
        // Lean forward pulse
        Animated.loop(Animated.sequence([
          Animated.timing(rotate, { toValue: 0.05, duration: 800, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: 800, useNativeDriver: true }),
          Animated.delay(1500),
        ])).start();
        break;

      case 'hooked':
        // Trembling shake
        Animated.loop(Animated.sequence([
          Animated.timing(shakeX, { toValue: 3, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -3, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 2, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -2, duration: 50, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0, duration: 50, useNativeDriver: true }),
          Animated.delay(800),
        ])).start();
        break;

      case 'cantStop':
        // Heavy shake + slight scale pulse (blue glow implied)
        Animated.loop(Animated.sequence([
          Animated.timing(shakeX, { toValue: 4, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -4, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 3, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -3, duration: 40, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0, duration: 40, useNativeDriver: true }),
          Animated.delay(400),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.timing(scale, { toValue: 0.97, duration: 500, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])).start();
        break;

      case 'brainFog':
        // Spinning dizzy + fog overlay implied
        Animated.loop(Animated.sequence([
          Animated.timing(rotate, { toValue: 0.06, duration: 600, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: -0.06, duration: 600, useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.timing(shakeX, { toValue: 2, duration: 300, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -2, duration: 300, useNativeDriver: true }),
        ])).start();
        break;

      case 'melting':
        // Squish downward + drip effect
        Animated.loop(Animated.sequence([
          Animated.timing(squishY, { toValue: 0.92, duration: 1200, useNativeDriver: true }),
          Animated.timing(squishY, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.timing(floatY, { toValue: 5, duration: 1500, useNativeDriver: true }),
          Animated.timing(floatY, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])).start();
        break;

      case 'severeRot':
        // Shake + green fly particles orbiting
        Animated.loop(Animated.sequence([
          Animated.timing(shakeX, { toValue: 5, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -5, duration: 60, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
          Animated.delay(200),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.timing(squishY, { toValue: 0.88, duration: 800, useNativeDriver: true }),
          Animated.timing(squishY, { toValue: 0.95, duration: 800, useNativeDriver: true }),
        ])).start();
        // Fly particles orbit
        Animated.loop(Animated.timing(particle1, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })).start();
        Animated.loop(Animated.timing(particle2, { toValue: 1, duration: 2500, easing: Easing.linear, useNativeDriver: true })).start();
        Animated.loop(Animated.timing(particle3, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })).start();
        break;

      case 'fullRot':
        // Pulsing goo + fly swarm
        Animated.loop(Animated.sequence([
          Animated.timing(scale, { toValue: 0.9, duration: 600, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.05, duration: 600, useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.timing(squishY, { toValue: 0.85, duration: 700, useNativeDriver: true }),
          Animated.timing(squishY, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.timing(particle1, { toValue: 1, duration: 1500, easing: Easing.linear, useNativeDriver: true })).start();
        Animated.loop(Animated.timing(particle2, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true })).start();
        Animated.loop(Animated.timing(particle3, { toValue: 1, duration: 2200, easing: Easing.linear, useNativeDriver: true })).start();
        break;

      case 'celebrating':
        // Bounce + confetti implied
        Animated.loop(Animated.sequence([
          Animated.timing(floatY, { toValue: -20, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(floatY, { toValue: 0, duration: 400, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.delay(600),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.timing(scale, { toValue: 1.08, duration: 300, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])).start();
        // Confetti particles
        Animated.loop(Animated.sequence([
          Animated.timing(particle1, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(particle1, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ])).start();
        break;

      case 'deadRot':
        // Heavy sinking squish + drift + fly swarm
        Animated.loop(Animated.sequence([
          Animated.timing(squishY, { toValue: 0.78, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(squishY, { toValue: 0.9, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.timing(floatY, { toValue: 6, duration: 1400, useNativeDriver: true }),
          Animated.timing(floatY, { toValue: 0, duration: 1400, useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.timing(particle1, { toValue: 1, duration: 1700, easing: Easing.linear, useNativeDriver: true })).start();
        Animated.loop(Animated.timing(particle2, { toValue: 1, duration: 2100, easing: Easing.linear, useNativeDriver: true })).start();
        Animated.loop(Animated.timing(particle3, { toValue: 1, duration: 2500, easing: Easing.linear, useNativeDriver: true })).start();
        break;

      case 'dissolved':
        // Barely-alive bubble pulse + slow sink/rise
        Animated.loop(Animated.sequence([
          Animated.timing(scale, { toValue: 0.95, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1.02, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.timing(floatY, { toValue: 4, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(floatY, { toValue: -2, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.timing(particle1, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true })).start();
        Animated.loop(Animated.timing(particle2, { toValue: 1, duration: 3200, easing: Easing.linear, useNativeDriver: true })).start();
        break;

      case 'decaying':
        // Upside-down sink: subtle drift + heavier squish + flies
        Animated.loop(Animated.sequence([
          Animated.timing(squishY, { toValue: 0.88, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(squishY, { toValue: 0.94, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.timing(rotate, { toValue: 0.02, duration: 2000, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: -0.02, duration: 2000, useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.timing(particle1, { toValue: 1, duration: 2400, easing: Easing.linear, useNativeDriver: true })).start();
        Animated.loop(Animated.timing(particle2, { toValue: 1, duration: 2900, easing: Easing.linear, useNativeDriver: true })).start();
        Animated.loop(Animated.timing(particle3, { toValue: 1, duration: 3300, easing: Easing.linear, useNativeDriver: true })).start();
        break;

      case 'grave':
        // Terminal — minimal motion, heavy fly swarm, occasional shiver
        Animated.loop(Animated.sequence([
          Animated.timing(scale, { toValue: 0.98, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.delay(3000),
          Animated.timing(shakeX, { toValue: 2, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: -2, duration: 80, useNativeDriver: true }),
          Animated.timing(shakeX, { toValue: 0, duration: 80, useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.timing(particle1, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true })).start();
        Animated.loop(Animated.timing(particle2, { toValue: 1, duration: 1700, easing: Easing.linear, useNativeDriver: true })).start();
        Animated.loop(Animated.timing(particle3, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true })).start();
        break;

      case 'victory':
        // Amped celebration — taller bounce, sparkle + confetti
        Animated.loop(Animated.sequence([
          Animated.timing(floatY, { toValue: -28, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(floatY, { toValue: 0, duration: 350, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.delay(350),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.timing(scale, { toValue: 1.12, duration: 250, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 250, useNativeDriver: true }),
          Animated.delay(550),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.timing(rotate, { toValue: 0.04, duration: 400, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: -0.04, duration: 400, useNativeDriver: true }),
        ])).start();
        Animated.loop(Animated.sequence([
          Animated.timing(particle1, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(particle1, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])).start();
        break;

      case 'notepad':
        // Gentle thinking sway
        Animated.loop(Animated.sequence([
          Animated.timing(rotate, { toValue: 0.03, duration: 1500, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: -0.03, duration: 1500, useNativeDriver: true }),
        ])).start();
        break;
    }
  }, [state, floatY, scale, rotate, shakeX, squishY, particle1, particle2, particle3]);

  const image = PAWS_IMAGES[state] ?? PAWS_IMAGES.focus;

  // Determine if we need particles
  const showSparkles = state === 'focus' || state === 'celebrating' || state === 'victory';
  const showFlies =
    state === 'severeRot' ||
    state === 'fullRot' ||
    state === 'deadRot' ||
    state === 'dissolved' ||
    state === 'decaying' ||
    state === 'grave';

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Fly particles */}
      {showFlies && (
        <>
          <Animated.View style={[st.fly, {
            transform: [{
              translateX: particle1.interpolate({ inputRange: [0, 1], outputRange: [-(size * 0.4), size * 0.4] }),
            }, {
              translateY: particle1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-(size * 0.3), -(size * 0.1), -(size * 0.3)] }),
            }],
          }]}>
            <View style={st.flyDot} />
          </Animated.View>
          <Animated.View style={[st.fly, {
            transform: [{
              translateX: particle2.interpolate({ inputRange: [0, 1], outputRange: [size * 0.3, -(size * 0.3)] }),
            }, {
              translateY: particle2.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-(size * 0.2), -(size * 0.4), -(size * 0.2)] }),
            }],
          }]}>
            <View style={st.flyDot} />
          </Animated.View>
          <Animated.View style={[st.fly, {
            transform: [{
              translateX: particle3.interpolate({ inputRange: [0, 1], outputRange: [-(size * 0.2), size * 0.2] }),
            }, {
              translateY: particle3.interpolate({ inputRange: [0, 0.5, 1], outputRange: [-(size * 0.35), -(size * 0.15), -(size * 0.35)] }),
            }],
          }]}>
            <View style={st.flyDot} />
          </Animated.View>
        </>
      )}

      {/* Sparkle particles */}
      {showSparkles && (
        <>
          <Animated.Text style={[st.sparkle, { top: '10%', left: '15%',
            opacity: particle1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0] }),
          }]}>✨</Animated.Text>
          <Animated.Text style={[st.sparkle, { top: '20%', right: '10%',
            opacity: particle1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 1] }),
          }]}>✨</Animated.Text>
          <Animated.Text style={[st.sparkle, { bottom: '30%', left: '10%',
            opacity: particle1.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] }),
          }]}>⭐</Animated.Text>
        </>
      )}

      {/* Main Paws image */}
      <Animated.Image
        source={image}
        style={{
          width: size * 0.85,
          height: size * 0.85,
          transform: [
            { translateY: floatY },
            { translateX: shakeX },
            { scale },
            { scaleY: squishY },
            { rotate: rotate.interpolate({ inputRange: [-1, 1], outputRange: ['-57.3deg', '57.3deg'] }) },
          ],
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const st = StyleSheet.create({
  glow: { position: 'absolute' },
  goldenGlow: { backgroundColor: '#FFD700' },
  blueGlow: { backgroundColor: '#4FC3F7' },
  fogGlow: { backgroundColor: '#9E9E9E' },
  fly: { position: 'absolute', zIndex: 10 },
  flyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4A4A2A' },
  sparkle: { position: 'absolute', fontSize: 14, zIndex: 10 },
});
