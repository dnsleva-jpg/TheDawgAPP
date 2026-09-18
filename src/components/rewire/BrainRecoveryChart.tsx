import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS as DS_COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import { getBrainRecoveryTrend } from '../../utils/brainRecoveryService';

const CHART_HEIGHT = 160;

interface DailyPoint {
  dayNumber: number;
  date: string;
  score: number;
}

function scoreToY(score: number): number {
  return CHART_HEIGHT - (score / 100) * CHART_HEIGHT;
}

function LineSegment({
  x1, y1, x2, y2, color, width: lineWidth,
}: {
  x1: number; y1: number; x2: number; y2: number; color: string; width: number;
}) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  return (
    <View
      style={{
        position: 'absolute',
        left: x1,
        top: y1 - lineWidth / 2,
        width: length,
        height: lineWidth,
        backgroundColor: color,
        borderRadius: lineWidth / 2,
        transform: [{ rotate: `${angle}deg` }],
        transformOrigin: 'left center',
      }}
    />
  );
}

export function BrainRecoveryChart() {
  const [trend, setTrend] = useState<DailyPoint[]>([]);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    getBrainRecoveryTrend().then(setTrend).catch(() => {});
  }, []);

  if (trend.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>BRAIN RECOVERY TREND</Text>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            Complete a few sessions to see your trend
          </Text>
        </View>
      </View>
    );
  }

  // Use last 30 data points max
  const points = trend.slice(-30);
  const latest = points[points.length - 1];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>BRAIN RECOVERY</Text>
        <View style={styles.currentScore}>
          <Text style={styles.currentScoreValue}>{latest.score}%</Text>
          <Text style={styles.currentScoreLabel}>Day {latest.dayNumber}</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {/* Y-axis reference lines */}
        {[25, 50, 75].map((val) => (
          <View key={val} style={styles.gridLineRow}>
            <Text style={[styles.yLabel, { top: scoreToY(val) - 6 }]}>{val}</Text>
            <View style={[styles.gridLine, { top: scoreToY(val) }]} />
          </View>
        ))}

        {/* Line chart */}
        <View
          style={styles.chartInner}
          onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
        >
          {/* Lines between dots */}
          {chartWidth > 0 && points.map((pt, i) => {
            if (i === 0) return null;
            const prev = points[i - 1];
            const xSpacing = chartWidth / (points.length - 1);
            const x1 = (i - 1) * xSpacing;
            const x2 = i * xSpacing;
            return (
              <LineSegment
                key={`line-${i}`}
                x1={x1}
                y1={scoreToY(prev.score)}
                x2={x2}
                y2={scoreToY(pt.score)}
                color={DS_COLORS.coral + '66'}
                width={2}
              />
            );
          })}

          {/* Dots */}
          {chartWidth > 0 && points.map((pt, i) => {
            const x = (i / (points.length - 1)) * chartWidth;
            const y = scoreToY(pt.score);
            return (
              <View
                key={`dot-${i}`}
                style={{
                  position: 'absolute',
                  left: x - 3,
                  top: y - 3,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: DS_COLORS.coral,
                }}
              />
            );
          })}
        </View>

        {/* X-axis labels */}
        <View style={styles.xAxis}>
          <Text style={styles.xLabel}>Day {points[0].dayNumber}</Text>
          <Text style={styles.xLabel}>Day {latest.dayNumber}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    fontSize: 11,
    fontFamily: FONTS.monoBold,
    color: DS_COLORS.textMuted,
    letterSpacing: 1.5,
  },
  currentScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  currentScoreValue: {
    fontSize: 18,
    fontFamily: FONTS.display,
    color: DS_COLORS.coral,
  },
  currentScoreLabel: {
    fontSize: 11,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
  },
  placeholder: {
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 32,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    paddingLeft: 32,
    height: CHART_HEIGHT + 32,
  },
  gridLineRow: {},
  yLabel: {
    position: 'absolute',
    left: -28,
    fontSize: 9,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textDisabled,
    width: 24,
    textAlign: 'right',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  chartInner: {
    height: CHART_HEIGHT,
    position: 'relative',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  xLabel: {
    fontSize: 9,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textDisabled,
  },
});
