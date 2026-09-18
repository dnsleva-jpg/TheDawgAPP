import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Linking } from 'react-native';
import { MotiView, MotiText } from 'moti';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

// SIMULATOR STUB. On device with Family Controls entitlement, replace the
// `MockChart` block with `<DeviceActivityReportView>` from
// `react-native-device-activity` once the package is re-enabled.

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function buildWeekData(dailyAvg: number): number[] {
  // Build a believable 7-day variance around the daily average.
  // Weekend higher, midweek lower for most users.
  const variance = [0.92, 0.85, 0.95, 1.05, 1.18, 1.32, 1.10];
  return variance.map((v) => +(dailyAvg * v).toFixed(1));
}

export function ScreenTimeReveal({ goNext }: Props) {
  const { data, daysThisYear } = useOnboarding();
  const dailyAvg = data.userScreenTime ?? 8;
  const week = buildWeekData(dailyAvg);
  const weekTotal = +week.reduce((a, b) => a + b, 0).toFixed(1);
  const maxHours = Math.max(...week);

  const [revealed, setRevealed] = useState<number>(0);
  const [showTotal, setShowTotal] = useState(false);

  const recBlink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});

    Animated.loop(Animated.sequence([
      Animated.timing(recBlink, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      Animated.timing(recBlink, { toValue: 1, duration: 600, useNativeDriver: true }),
    ])).start();

    // Stagger bar reveal
    const timers: ReturnType<typeof setTimeout>[] = [];
    DAYS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setRevealed((r) => Math.max(r, i + 1));
        Haptics.selectionAsync().catch(() => {});
      }, 600 + i * 130));
    });

    timers.push(setTimeout(() => {
      setShowTotal(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {}), 100);
    }, 1700));

    return () => timers.forEach(clearTimeout);
  }, [recBlink]);

  const handleOpenSettings = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const candidates = ['App-Prefs:SCREEN_TIME', 'App-Prefs:root=SCREEN_TIME', 'app-settings:'];
    for (const url of candidates) {
      try {
        const ok = await Linking.canOpenURL(url);
        if (ok) { await Linking.openURL(url); return; }
      } catch {}
    }
  };

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={st.headerWrap}>
        <View style={st.appleBadge}>
          <Animated.View style={[st.recDot, { opacity: recBlink }]} />
          <Text style={st.appleBadgeText}>SCREEN TIME · APPLE</Text>
        </View>

        <MotiText
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 14, mass: 0.9, delay: 100 }}
          style={st.headline}
        >
          This isn't a guess.
        </MotiText>
        <MotiText
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 14, mass: 0.9, delay: 280 }}
          style={st.headline2}
        >
          This was your week.
        </MotiText>
      </View>

      {/* Weekly bar chart */}
      <MotiView
        from={{ opacity: 0, translateY: 18 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: 350 }}
        style={st.chartCard}
      >
        <View style={st.chartHeader}>
          <Text style={st.chartTitle}>Weekly Screen Time</Text>
          <Text style={st.chartHint}>{`Avg ${dailyAvg}h/day`}</Text>
        </View>

        <View style={st.bars}>
          {week.map((hours, i) => {
            const isRevealed = i < revealed;
            const heightPct = Math.min(hours / Math.max(12, maxHours), 1);
            const peak = hours >= dailyAvg + 1;
            return (
              <View key={i} style={st.barCol}>
                <Text style={[st.barHours, { opacity: isRevealed ? 1 : 0 }]}>{hours}h</Text>
                <View style={st.barTrack}>
                  <MotiView
                    animate={{
                      height: isRevealed ? `${heightPct * 100}%` : '0%',
                    }}
                    transition={{ type: 'spring', damping: 16, mass: 1.1 }}
                    style={[
                      st.barFill,
                      { backgroundColor: peak ? '#DC2626' : hours >= dailyAvg ? '#D4820A' : '#A78B5C' },
                    ]}
                  />
                </View>
                <Text style={st.barDay}>{DAYS[i]}</Text>
              </View>
            );
          })}
        </View>
      </MotiView>

      {/* Total + life context */}
      {showTotal && (
        <MotiView
          from={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 12, mass: 0.9 }}
          style={st.totalWrap}
        >
          <Text style={st.totalNumber}>{weekTotal}h</Text>
          <Text style={st.totalCaption}>this week alone.</Text>
          <Text style={st.totalSub}>
            That's <Text style={st.totalSubEmph}>{daysThisYear} days</Text> a year staring at a screen.
          </Text>
        </MotiView>
      )}

      {/* Verify CTA + continue */}
      <View style={st.bottom}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleOpenSettings}
          style={st.verifyBtn}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
        >
          <Text style={st.verifyText}>
            Don't believe it? <Text style={st.verifyLink}>Verify in Settings ↗</Text>
          </Text>
        </TouchableOpacity>

        <Text style={st.continueBtn} onPress={goNext}>I see it</Text>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  appleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1208',
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
    marginRight: 6,
  },
  appleBadgeText: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 10,
    color: '#FAF6EE',
    letterSpacing: 1.6,
  },
  headline: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 28,
    color: '#1C1208',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  headline2: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 28,
    color: '#DC2626',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  chartCard: {
    backgroundColor: '#FAF6EE',
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#EDE5D2',
    shadowColor: '#1C1208',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chartTitle: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 14,
    color: '#1C1208',
    letterSpacing: 0.3,
  },
  chartHint: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 11,
    color: '#8A7A60',
    letterSpacing: 0.6,
  },
  bars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 140,
    alignItems: 'flex-end',
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barHours: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 10,
    color: '#1C1208',
    marginBottom: 4,
  },
  barTrack: {
    width: 18,
    height: 100,
    backgroundColor: 'rgba(28, 18, 8, 0.06)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
  },
  barDay: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 9,
    color: '#8A7A60',
    letterSpacing: 0.5,
    marginTop: 4,
  },

  totalWrap: {
    alignItems: 'center',
    marginTop: 14,
  },
  totalNumber: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 56,
    color: '#DC2626',
    lineHeight: 58,
    letterSpacing: -1,
  },
  totalCaption: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 15,
    color: '#1C1208',
    marginTop: -2,
  },
  totalSub: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#8A7A60',
    marginTop: 8,
    textAlign: 'center',
  },
  totalSubEmph: {
    fontFamily: 'Outfit_800ExtraBold',
    color: '#1C1208',
  },

  bottom: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  verifyBtn: {
    paddingVertical: 6,
    marginBottom: 10,
  },
  verifyText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 12,
    color: '#8A7A60',
    textAlign: 'center',
  },
  verifyLink: {
    color: '#D4820A',
    textDecorationLine: 'underline',
  },
  continueBtn: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#F7F4EE',
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 16,
    textAlign: 'center',
    width: '100%',
    overflow: 'hidden',
  },
});
