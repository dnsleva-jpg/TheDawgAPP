import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { AnimatedPaws } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

// Projected Focus Score climb — based on Paws' research-backed avg improvement curve
const MILESTONES = [
  { day: 1,  score: 35, label: 'Day 1',  color: '#E74C3C', note: 'Baseline' },
  { day: 7,  score: 48, label: 'Day 7',  color: '#E67E22', note: 'First week' },
  { day: 30, score: 65, label: 'Day 30', color: '#D4820A', note: 'Momentum' },
  { day: 60, score: 78, label: 'Day 60', color: '#66BB6A', note: 'Rewiring' },
  { day: 90, score: 88, label: 'Day 90', color: '#4CAF50', note: 'New baseline' },
];

const MAX = 100;
const CHART_H = 160;

export function Screen22T({ goNext }: Props) {
  return (
    <View style={st.container}>
      <AnimatedPaws state="celebrating" size={70} style={{ alignSelf: 'center', marginBottom: 8 }} />

      <Text style={st.title}>Your 90-day trajectory.</Text>
      <Text style={st.body}>
        Paws tracks every check-in and plots the climb. You'll watch it happen.
      </Text>

      <View style={st.chartCard}>
        <View style={st.chartHeader}>
          <Text style={st.chartTitle}>Focus Score</Text>
          <Text style={st.chartSub}>Projected</Text>
        </View>

        <View style={[st.chart, { height: CHART_H }]}>
          {/* Y-axis gridlines */}
          {[0, 25, 50, 75, 100].map((v) => (
            <View key={v} style={[st.grid, { bottom: (v / MAX) * CHART_H }]} />
          ))}

          {/* Bars */}
          <View style={st.bars}>
            {MILESTONES.map((m, i) => {
              const h = (m.score / MAX) * CHART_H;
              return (
                <View key={m.day} style={st.barCol}>
                  <MotiView
                    from={{ height: 0, opacity: 0 }}
                    animate={{ height: h, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      delay: 300 + i * 180,
                      damping: 14,
                    }}
                    style={[st.bar, { backgroundColor: m.color }]}
                  />
                  <MotiView
                    from={{ opacity: 0, translateY: -4 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'timing', delay: 500 + i * 180, duration: 280 }}
                    style={st.barScoreWrap}
                  >
                    <Text style={[st.barScore, { color: m.color }]}>{m.score}</Text>
                  </MotiView>
                </View>
              );
            })}
          </View>
        </View>

        <View style={st.xLabels}>
          {MILESTONES.map((m) => (
            <View key={m.day} style={st.xLabelWrap}>
              <Text style={st.xLabel}>{m.label}</Text>
              <Text style={st.xNote}>{m.note}</Text>
            </View>
          ))}
        </View>
      </View>

      <Text style={st.hook}>Average user: <Text style={st.hookHi}>+43%</Text> in 30 days.</Text>

      <Text style={st.btn} onPress={goNext}>I'm in</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, backgroundColor: '#F7F4EE' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: '#1C1208', textAlign: 'center' },
  body: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', textAlign: 'center', lineHeight: 22, marginTop: 6, marginBottom: 18 },

  chartCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 },
  chartTitle: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#1C1208' },
  chartSub: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#B0A090', fontStyle: 'italic' },

  chart: { position: 'relative', justifyContent: 'flex-end' },
  grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#F0EBE0' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: '100%' },
  barCol: { width: 34, alignItems: 'center' },
  bar: { width: 26, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barScoreWrap: { position: 'absolute', top: -22 },
  barScore: { fontFamily: 'Outfit_800ExtraBold', fontSize: 13 },

  xLabels: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  xLabelWrap: { alignItems: 'center', width: 62 },
  xLabel: { fontFamily: 'Outfit_700Bold', fontSize: 11, color: '#1C1208' },
  xNote: { fontFamily: 'Outfit_400Regular', fontSize: 10, color: '#B0A090', marginTop: 1 },

  hook: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#8A7A60', textAlign: 'center', marginTop: 18 },
  hookHi: { color: '#4CAF50', fontFamily: 'Outfit_800ExtraBold' },

  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', marginTop: 18, overflow: 'hidden' },
});
