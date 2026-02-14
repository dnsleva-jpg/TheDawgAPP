import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';

import { HomeScreen } from './src/screens/HomeScreen';
import { RewireScreen } from './src/screens/RewireScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { PrepareScreen } from './src/screens/PrepareScreen';
import type { ProtectionLevel } from './src/screens/PrepareScreen';
import { TimerScreen } from './src/screens/TimerScreen';
import { SelfieScreen } from './src/screens/SelfieScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { Session } from './src/types';
import { saveSession } from './src/utils/storage';
import { getDateString } from './src/utils/stats';
import { updateStreakAfterSession } from './src/utils/streakManager';
import { AppLoader } from './src/components/AppLoader';
import type { SessionResults } from './src/scoring/scoringEngine';
import { FONTS } from './src/constants/designSystem';

// ─── Tab types ────────────────────────────────────────────
type Tab = 'Home' | 'Rewire' | 'Settings';
type SessionScreen = 'Prepare' | 'Timer' | 'Selfie' | 'Results' | null;

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'Home', label: 'Home', icon: '🏠' },
  { key: 'Rewire', label: 'Rewire', icon: '🧠' },
  { key: 'Settings', label: 'Settings', icon: '⚙️' },
];

// ─── Custom Bottom Tab Bar ────────────────────────────────
function BottomTabBar({
  activeTab,
  onTabPress,
}: {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabItem}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── App Content ──────────────────────────────────────────
function AppContent() {
  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [tabKey, setTabKey] = useState(0); // Forces HomeScreen data reload

  // Session flow state
  const [sessionScreen, setSessionScreen] = useState<SessionScreen>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [completedSeconds, setCompletedSeconds] = useState<number>(0);
  const [videoUri, setVideoUri] = useState<string | undefined>(undefined);
  const [stillnessPercent, setStillnessPercent] = useState<number>(0);
  const [blinksCount, setBlinksCount] = useState<number>(0);
  const [incognitoMode, setIncognitoMode] = useState<boolean>(false);
  const [scoringResults, setScoringResults] = useState<SessionResults | null>(null);
  const [protectionLevel, setProtectionLevel] = useState<ProtectionLevel>('easy');

  // ─── Session handlers ───
  const handleStartSession = useCallback((durationSeconds: number) => {
    setSessionDuration(durationSeconds);
    setVideoUri(undefined);
    setStillnessPercent(0);
    setBlinksCount(0);
    setScoringResults(null);
    setProtectionLevel('easy');
    setSessionScreen('Prepare');
  }, []);

  const handleReady = useCallback((incognito?: boolean, level?: ProtectionLevel) => {
    setIncognitoMode(incognito || false);
    setProtectionLevel(level || 'easy');
    setSessionScreen('Timer');
  }, []);

  const handleSessionComplete = useCallback(async (
    seconds: number,
    sessionVideoUri?: string,
    stillness?: number,
    blinks?: number,
    sessionScoringResults?: SessionResults
  ) => {
    setCompletedSeconds(seconds);
    setVideoUri(sessionVideoUri);
    setScoringResults(sessionScoringResults ?? null);
    setStillnessPercent(sessionScoringResults?.stillnessPercent ?? stillness ?? 0);
    setBlinksCount(
      sessionScoringResults
        ? Math.round(sessionScoringResults.blinksPerMinute * (seconds / 60))
        : (blinks ?? 0)
    );

    // Save session to storage (including V3 scoring results when available)
    const session: Session = {
      id: Date.now().toString(),
      duration: seconds,
      date: getDateString(new Date()),
      timestamp: Date.now(),
      isRogueMode: sessionDuration === -1,
      completed: true,
      stillnessPercent: sessionScoringResults?.stillnessPercent ?? stillness ?? 0,
      blinksCount: sessionScoringResults
        ? Math.round(sessionScoringResults.blinksPerMinute * (seconds / 60))
        : (blinks ?? 0),
      rawDawgScore: sessionScoringResults?.rawDawgScore,
      stillnessScore: sessionScoringResults?.stillnessScore,
      blinkScore: sessionScoringResults?.blinkScore,
      durationScore: sessionScoringResults?.durationScore,
      grade: sessionScoringResults?.grade,
      gradeLabel: sessionScoringResults?.label,
      blinksPerMinute: sessionScoringResults?.blinksPerMinute,
      facePresencePercent: sessionScoringResults?.facePresencePercent,
      committedDuration: sessionDuration > 0 ? sessionDuration : undefined,
      protectionLevel,
    };

    try {
      await saveSession(session);
      await updateStreakAfterSession();
    } catch (_) {
      // Storage failed — continue to selfie screen regardless
    }

    setSessionScreen('Selfie');
  }, [sessionDuration, protectionLevel]);

  const handleSelfieComplete = useCallback(() => {
    setSessionScreen('Results');
  }, []);

  const handleCancelPrepare = useCallback(() => {
    setSessionScreen(null);
  }, []);

  const handleCancelSession = useCallback(() => {
    setVideoUri(undefined);
    setTabKey(prev => prev + 1);
    setSessionScreen(null);
  }, []);

  const handleGoHome = useCallback(() => {
    setVideoUri(undefined);
    setTabKey(prev => prev + 1);
    setActiveTab('Home');
    setSessionScreen(null);
  }, []);

  const handleTabPress = useCallback((tab: Tab) => {
    if (tab === 'Home' && activeTab !== 'Home') {
      setTabKey(prev => prev + 1); // Reload stats when switching to Home
    }
    setActiveTab(tab);
  }, [activeTab]);

  // ─── Session flow screens (rendered on top, hides tabs) ───
  if (sessionScreen === 'Prepare') {
    return (
      <PrepareScreen
        durationMinutes={Math.floor(sessionDuration / 60)}
        isRogueMode={sessionDuration === -1}
        onReady={handleReady}
        onCancel={handleCancelPrepare}
      />
    );
  }

  if (sessionScreen === 'Timer') {
    return (
      <TimerScreen
        durationSeconds={sessionDuration}
        onComplete={handleSessionComplete}
        onCancel={handleCancelSession}
        incognitoMode={incognitoMode}
        protectionLevel={protectionLevel}
      />
    );
  }

  if (sessionScreen === 'Selfie') {
    return (
      <SelfieScreen
        completedSeconds={completedSeconds}
        stillnessPercent={stillnessPercent}
        blinksCount={blinksCount}
        scoringResults={scoringResults}
        onComplete={handleSelfieComplete}
      />
    );
  }

  if (sessionScreen === 'Results') {
    return (
      <ResultsScreen
        completedSeconds={completedSeconds}
        videoUri={videoUri}
        stillnessPercent={stillnessPercent}
        blinksCount={blinksCount}
        scoringResults={scoringResults}
        protectionLevel={protectionLevel}
        onGoHome={handleGoHome}
      />
    );
  }

  // ─── Main tab screens (with bottom tab bar) ───
  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>
        {activeTab === 'Home' && (
          <HomeScreen key={tabKey} onStartSession={handleStartSession} />
        )}
        {activeTab === 'Rewire' && <RewireScreen />}
        {activeTab === 'Settings' && <SettingsScreen />}
      </View>
      <BottomTabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d12',
  },
  screenContainer: {
    flex: 1,
  },
  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0d0d1a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.3,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
  },
  tabLabelActive: {
    color: '#e94560',
  },
});

// ─── Main App ─────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <AppLoader>
        <AppContent />
      </AppLoader>
    </SafeAreaProvider>
  );
}
