import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/designSystem';

interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = Math.min(current / total, 1);

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  track: {
    height: 4,
    backgroundColor: COLORS.bgSurfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.coral,
    borderRadius: 2,
  },
});
