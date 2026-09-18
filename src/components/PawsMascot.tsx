import React from 'react';
import { View, Image, type ViewStyle, type ImageStyle } from 'react-native';

export type PawsMood = 'meditating' | 'thinking' | 'sideeye' | 'worried' | 'celebrate';

interface PawsMascotProps {
  mood: PawsMood;
  size: number;
  style?: ViewStyle;
}

// TODO: Replace with mood-specific assets when available:
// paws_meditating.png, paws_thinking.png, paws_sideeye.png, paws_worried.png, paws_celebrate.png
const PAWS_IMAGE = require('../../assets/shiba/shiba-thriving.png');

// Visual effects per mood (until real assets exist)
const MOOD_STYLE: Record<PawsMood, { opacity: number; tintColor?: string; rotate?: string; scale?: number }> = {
  meditating: { opacity: 1 },
  thinking: { opacity: 0.9, rotate: '-5deg' },
  celebrate: { opacity: 1, scale: 1.05 },
  sideeye: { opacity: 0.85, rotate: '8deg' },
  worried: { opacity: 0.6, scale: 0.92 },
};

export function PawsMascot({ mood, size, style }: PawsMascotProps) {
  const fx = MOOD_STYLE[mood];

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* Tint overlay for worried/depleted states */}
      {(mood === 'worried' || mood === 'sideeye') && (
        <View style={{
          position: 'absolute',
          width: size * 0.8,
          height: size * 0.8,
          borderRadius: size * 0.4,
          backgroundColor: mood === 'worried' ? 'rgba(200,50,50,0.08)' : 'rgba(200,150,50,0.06)',
          zIndex: 1,
        }} />
      )}
      <Image
        source={PAWS_IMAGE}
        style={{
          width: size,
          height: size,
          opacity: fx.opacity,
          transform: [
            { rotate: fx.rotate ?? '0deg' },
            { scale: fx.scale ?? 1 },
          ],
        } as ImageStyle}
        resizeMode="contain"
      />
    </View>
  );
}
