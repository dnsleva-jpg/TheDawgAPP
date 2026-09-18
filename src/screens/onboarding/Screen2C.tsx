import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, InteractionManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenTimeReader } from '../../components/ScreenTimeReader';
import { useOnboarding } from '../../context/OnboardingContext';

// Lazy-require Screen Time native module. Falls through to manual entry
// if the binary isn't linked.
let DA: any = null;
try { DA = require('react-native-device-activity'); } catch {}
const DA_AVAILABLE = !!(DA && typeof DA.requestAuthorization === 'function');

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

type Phase = 'idle' | 'authorizing' | 'fetching' | 'error';

const PHONE_YEARS = 11;
const LIFE_YEARS = 80;

export function Screen2C({ goNext }: Props) {
  const insets = useSafeAreaInsets();
  const { updateField } = useOnboarding();
  const [phase, setPhase] = useState<Phase>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualHours, setManualHours] = useState<number>(7);
  const [showManualFallback, setShowManualFallback] = useState(false);

  const beginFetch = () => {
    setErrorMsg(null);
    setPhase('fetching');
  };

  const handleConnect = () => {
    if (!DA_AVAILABLE) {
      setShowManualFallback(true);
      return;
    }

    let pre: any = 0;
    try { pre = DA.getAuthorizationStatus?.(); } catch {}
    console.log('[ScreenTime] authorizationStatus BEFORE:', pre);

    if (pre === 2) {
      console.log('[ScreenTime] already authorized — mounting report view');
      updateField('skippedScreenTime', false);
      beginFetch();
      return;
    }

    setPhase('authorizing');

    // Defer the native auth presentation past Fabric commit — calling it
    // inline crashes the SwiftUI bridge on iOS 26 + new architecture.
    InteractionManager.runAfterInteractions(() => {
      setTimeout(async () => {
        try {
          console.log('[ScreenTime] calling requestAuthorization (deferred)...');
          await DA.requestAuthorization('individual');
          const post = DA.getAuthorizationStatus?.();
          console.log('[ScreenTime] authorizationStatus AFTER:', post);
          if (post === 2) {
            updateField('skippedScreenTime', false);
            beginFetch();
          } else {
            setErrorMsg('Screen Time access was not granted.');
            setPhase('error');
          }
        } catch (e: any) {
          const msg = e?.message || String(e) || 'Unknown error';
          console.log('[ScreenTime] requestAuthorization threw:', msg);
          setErrorMsg(msg);
          setPhase('error');
        }
      }, 50);
    });
  };

  const handleHoursFetched = (dailyHours: number, totalSeconds: number) => {
    console.log('[ScreenTime] real daily hours:', dailyHours, 'total seconds:', totalSeconds);
    const rounded = Math.max(1, Math.min(20, Math.round(dailyHours)));
    updateField('userScreenTime', rounded);
    updateField('skippedScreenTime', false);
    setTimeout(() => goNext(), 400);
  };

  const handleHoursTimeout = () => {
    console.log('[ScreenTime] extension never reported — falling back to manual entry');
    setPhase('idle');
    setShowManualFallback(true);
  };

  const handleManualSubmit = () => {
    const hours = Math.max(1, Math.min(20, manualHours));
    updateField('userScreenTime', hours);
    updateField('skippedScreenTime', false);
    setShowManualFallback(false);
    setTimeout(() => goNext(), 250);
  };

  const handleSkip = () => {
    updateField('userScreenTime', 8);
    updateField('skippedScreenTime', true);
    goNext();
  };

  return (
    <View style={[st.container, { paddingTop: insets.top + 24, paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
      <View style={st.body}>
        <Text style={st.hero}>{PHONE_YEARS}</Text>
        <Text style={st.heroLabel}>YEARS GONE.</Text>
        <Text style={st.subtitle}>
          The average person loses {PHONE_YEARS} years of their life to a phone — out of {LIFE_YEARS}.
        </Text>
        <Text style={st.subtitleSmall}>Connect Apple Screen Time to see your real number.</Text>
      </View>

      <View style={st.bottom}>
        {phase === 'idle' && !showManualFallback && (
          <>
            <TouchableOpacity activeOpacity={0.85} onPress={handleConnect} style={st.primaryBtn}>
              <Text style={st.primaryBtnText}>Show me my real number</Text>
            </TouchableOpacity>
            <Text style={st.lockNote}>🔒 Apple Screen Time · stays on device</Text>
            <TouchableOpacity activeOpacity={0.6} onPress={handleSkip} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }} style={st.skipBtn}>
              <Text style={st.skipText}>skip · use average</Text>
            </TouchableOpacity>
          </>
        )}

        {phase === 'authorizing' && (
          <View style={st.loadingWrap}>
            <ActivityIndicator size="small" color="#D4820A" />
            <Text style={st.loadingText}>Authorizing…</Text>
          </View>
        )}

        {phase === 'fetching' && (
          <View style={st.loadingWrap}>
            <ActivityIndicator size="small" color="#D4820A" />
            <Text style={st.loadingText}>Reading your Screen Time…</Text>
            <Text style={st.loadingSub}>Pulling last 7 days from Apple</Text>
          </View>
        )}

        {phase === 'error' && (
          <View style={st.errorWrap}>
            <Text style={st.errorTitle}>Couldn't connect</Text>
            {errorMsg && <Text style={st.errorBody}>{errorMsg}</Text>}
            <TouchableOpacity activeOpacity={0.85} onPress={() => { setPhase('idle'); setErrorMsg(null); }} style={st.primaryBtn}>
              <Text style={st.primaryBtnText}>Try again</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.6} onPress={() => { setPhase('idle'); setShowManualFallback(true); }} style={st.skipBtn}>
              <Text style={st.skipText}>Enter manually instead</Text>
            </TouchableOpacity>
          </View>
        )}

        {showManualFallback && (
          <View style={st.manualWrap}>
            <Text style={st.manualTitle}>Your daily average</Text>
            <Text style={st.manualBody}>Open Settings → Screen Time to see your weekly daily average.</Text>
            <View style={st.manualNumRow}>
              <Text style={st.manualNum}>{manualHours}</Text>
              <Text style={st.manualNumUnit}>HOURS / DAY</Text>
            </View>
            <View style={st.manualRow}>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setManualHours(h => Math.max(1, h - 1))} style={st.manualStepper}>
                <Text style={st.manualStepperText}>−</Text>
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={() => setManualHours(h => Math.min(16, h + 1))} style={st.manualStepper}>
                <Text style={st.manualStepperText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity activeOpacity={0.85} onPress={handleManualSubmit} style={st.primaryBtn}>
              <Text style={st.primaryBtnText}>Lock it in</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Root-level sibling, NOT inside any animated subtree. iOS only invokes
          the DeviceActivityReport extension when the SwiftUI host has a real
          on-screen frame, so it sits here invisibly. */}
      {phase === 'fetching' && (
        <View style={st.nativeReportHost} pointerEvents="none">
          <ScreenTimeReader
            days={7}
            onResult={handleHoursFetched}
            onTimeout={handleHoursTimeout}
          />
        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: '#F7F4EE',
  },
  nativeReportHost: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.001,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 128,
    color: '#DC2626',
    lineHeight: 128,
    letterSpacing: -3,
  },
  heroLabel: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 22,
    color: '#1C1208',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  subtitle: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: '#3A2A14',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 18,
    paddingHorizontal: 8,
  },
  subtitleSmall: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#7A6A50',
    textAlign: 'center',
    marginTop: 14,
  },
  bottom: {
    marginTop: 'auto',
  },
  primaryBtn: {
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#FAF6EE',
  },
  lockNote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#7A6A50',
    textAlign: 'center',
    marginTop: 10,
  },
  skipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  skipText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 13,
    color: '#7A6A50',
    textDecorationLine: 'underline',
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 15,
    color: '#1C1208',
    marginTop: 12,
  },
  loadingSub: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#7A6A50',
    marginTop: 4,
  },
  errorWrap: {
    alignItems: 'stretch',
    paddingVertical: 12,
  },
  errorTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 6,
  },
  errorBody: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#7A6A50',
    textAlign: 'center',
    marginBottom: 14,
  },
  manualWrap: {
    alignItems: 'stretch',
    paddingVertical: 8,
  },
  manualTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 18,
    color: '#1C1208',
    textAlign: 'center',
  },
  manualBody: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    color: '#7A6A50',
    textAlign: 'center',
    marginTop: 6,
  },
  manualNumRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  manualNum: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 56,
    color: '#DC2626',
    lineHeight: 60,
  },
  manualNumUnit: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 12,
    color: '#5C4A3A',
    letterSpacing: 1.4,
    marginTop: -2,
  },
  manualRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginTop: 14,
    marginBottom: 18,
  },
  manualStepper: {
    width: 64,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EDE5D2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualStepperText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#1C1208',
  },
});
