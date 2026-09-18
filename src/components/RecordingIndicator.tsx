import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../constants/colors';
import { COLORS as DS_COLORS, FONTS } from '../constants/designSystem';

export function RecordingIndicator() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
      <Text style={styles.text}>REC</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Brand Kit - REC Indicator
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6, // Tighter gap per brand kit
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent', // No background per brand kit
    borderRadius: 20,
  },
  dot: {
    width: 6, // 6px per brand kit
    height: 6,
    borderRadius: 3,
    backgroundColor: DS_COLORS.coral, // Red per brand kit
  },
  text: {
    fontSize: 10, // 0.6rem = ~10px per brand kit
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.coral,
    letterSpacing: 0,
  },
});
