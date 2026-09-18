import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, AppState } from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';

import { HomeScreen } from './src/screens/HomeScreen';
import { RewireScreen } from './src/screens/RewireScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { InterceptionScreen } from './src/screens/InterceptionScreen';
import { PrepareScreen } from './src/screens/PrepareScreen';
import type { ProtectionLevel } from './src/screens/PrepareScreen';
import { WalkModeScreen } from './src/screens/WalkModeScreen';
import { TimerScreen } from './src/screens/TimerScreen';
import { SelfieScreen } from './src/screens/SelfieScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { FocusScoreCheckIn } from './src/components/FocusScoreCheckIn';
import { FocusCheckResultsScreen } from './src/screens/FocusCheckResultsScreen';
import { TimerChallenge } from './src/components/verification/TimerChallenge';
import { PhotoProofCapture } from './src/components/verification/PhotoProofCapture';
import { ReflectionGateModal } from './src/components/verification/ReflectionGateModal';
import { SMALL_WIN_OPTIONS } from './src/data/challenges';
import { markDailyChallengeComplete } from './src/utils/rewireManager';
import {
  saveFocusCheckResult,
  getNextCheckTestNumber,
  getLatestComparison,
  type FocusCheckResult,
  type FocusCheckComparison,
} from './src/utils/focusCheckService';
import { Session } from './src/types';
import { saveSession } from './src/utils/storage';
import { getDateString } from './src/utils/stats';
import { updateStreakAfterSession } from './src/utils/streakManager';
import { AppLoader } from './src/components/AppLoader';
import type { SessionResults } from './src/scoring/scoringEngine';
import { FONTS, COLORS } from './src/constants/designSystem';
import { OnboardingFlow } from './src/onboarding/OnboardingFlow';
import { hasCompletedOnboarding } from './src/onboarding/onboardingStorage';
import { getStartDate, getCalendarDayNumber } from './src/utils/rewireManager';
import { scheduleDailyNotification, rescheduleAfterSession, scheduleStreakReminder } from './src/utils/notificationService';
import { getCelebratedMilestones, setCelebratedMilestone } from './src/utils/rewireManager';
import { configureRevenueCat } from './src/utils/subscriptionService';
import { logSessionComplete, logMilestoneReached } from './src/utils/analyticsService';
import { MilestoneModal, MILESTONE_DAYS } from './src/components/MilestoneModal';
import { hasCheckedInToday } from './src/utils/focusScoreService';
import { getSessions } from './src/utils/storage';
import { recordPickup } from './src/utils/pickupService';
// Screen time check-in disabled — not prompting users
// import { isWeeklyReportDue } from './src/utils/screenTimeService';
// import { ScreenTimeCheckIn } from './src/components/ScreenTimeCheckIn';
import { Ionicons } from '@expo/vector-icons';
import { getProStatus, PAYWALL_TRIGGERS, type PaywallTrigger, canAccessDifficulty } from './src/utils/proService';
import { BeatPawsScreen } from './src/screens/BeatPawsScreen';
import { BeatPawsResultScreen } from './src/screens/BeatPawsResultScreen';
import { PawsModeScreen2 } from './src/screens/PawsModeScreen2';
import { AppBlockerScreen } from './src/screens/AppBlockerScreen';
import {
  saveBeatPawsSession,
  checkLevelUp,
  getBeatPawsStreak,
  type BeatPawsSession,
} from './src/utils/beatPawsService';
import { savePawsModeSession, createPawsModeSession } from './src/utils/pawsModeService';
import { PaywallModal } from './src/components/PaywallModal';

// ─── Tab types ────────────────────────────────────────────
type Tab = 'Today' | 'Journey' | 'Insights' | 'Settings';
type SessionScreen =
  | 'Prepare' | 'Timer' | 'Selfie' | 'Results' | 'WalkMode'
  | 'ChallengeTimer' | 'ChallengePhoto' | 'ChallengeReflection' | 'ChallengeHonor'
  | 'SmallWin'
  | 'FocusCheckPrepare' | 'FocusCheckTimer' | 'FocusCheckResults'
  | 'GamePicker' | 'BeatPaws' | 'BeatPawsResult' | 'PawsMode' | 'AppBlocker'
  | null;

interface ActiveChallenge {
  title: string;
  description: string;
  duration: string;
  timerSeconds?: number;
  minCharacters?: number;
  dayNumber: number;
  difficulty: 'easy' | 'medium' | 'hard';
  completionPrompt: string;
}

const LEFT_TABS: { key: Tab; label: string; iconName: keyof typeof Ionicons.glyphMap; iconNameActive: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'Today', label: 'Today', iconName: 'home-outline', iconNameActive: 'home' },
  { key: 'Journey', label: 'Journey', iconName: 'map-outline', iconNameActive: 'map' },
];

const RIGHT_TABS: { key: Tab; label: string; iconName: keyof typeof Ionicons.glyphMap; iconNameActive: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'Insights', label: 'Insights', iconName: 'analytics-outline', iconNameActive: 'analytics' },
  { key: 'Settings', label: 'Settings', iconName: 'settings-outline', iconNameActive: 'settings' },
];

// ─── Custom Bottom Tab Bar with Center Button ────────────
function BottomTabBar({
  activeTab,
  onTabPress,
  onCenterPress,
}: {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
  onCenterPress: () => void;
}) {
  const insets = useSafeAreaInsets();

  const renderTab = (tab: typeof LEFT_TABS[0]) => {
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
        <Ionicons
          name={isActive ? tab.iconNameActive : tab.iconName}
          size={22}
          color={isActive ? COLORS.accent : COLORS.textMuted}
        />
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom || 8 }]}>
      {LEFT_TABS.map(renderTab)}

      {/* Center raised Focus Test button */}
      <View style={styles.centerButtonWrapper}>
        <TouchableOpacity
          style={styles.centerButton}
          onPress={onCenterPress}
          activeOpacity={0.8}
          accessibilityLabel="Focus Test"
        >
          <Ionicons name="scan-outline" size={28} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.centerLabel}>Focus Test</Text>
      </View>

      {RIGHT_TABS.map(renderTab)}
    </View>
  );
}

// ─── App Router ──────────────────────────────────────────
function AppRouter() {
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    hasCompletedOnboarding().then((completed) => setShowOnboarding(!completed));
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  if (showOnboarding === null) return null;

  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return <MainApp />;
}

// ─── Main App ────────────────────────────────────────────
function MainApp() {
  // Tab state
  const [activeTab, setActiveTab] = useState<Tab>('Today');
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
  const [milestoneDay, setMilestoneDay] = useState<number | null>(null);

  // Challenge verification state
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallenge | null>(null);
  const [focusCheckComparison, setFocusCheckComparison] = useState<FocusCheckComparison | null>(null);

  // Beat Paws state
  const [beatPawsResult, setBeatPawsResult] = useState<{
    score: number; blinks: number; stillnessPercent: number;
    durationSeconds: number; won: boolean; longestStretch: number; levelName: string;
  } | null>(null);
  const [beatPawsStreak, setBeatPawsStreak] = useState(0);

  // Shield interception state
  const [interceptedApp, setInterceptedApp] = useState<string | null>(null);

  // Pro / Paywall state
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<PaywallTrigger | null>(null);

  // Focus Score check-in state
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInLoaded, setCheckInLoaded] = useState(false);
  const [completedSessionYesterday, setCompletedSessionYesterday] = useState(false);


  // Track phone pickups (app foreground events)
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        recordPickup();
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // Initialize RevenueCat + notifications + deep links on mount
  useEffect(() => {
    configureRevenueCat();
    scheduleDailyNotification();
    scheduleStreakReminder();
    getProStatus().then(setIsPro);

    // Check if user needs Focus Score check-in + session yesterday
    Promise.all([hasCheckedInToday(), getSessions()]).then(([done, sessions]) => {
      setShowCheckIn(!done);
      setCheckInLoaded(true);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      setCompletedSessionYesterday(sessions.some(s => s.date === yesterdayStr && s.completed));
    });

    // Deep link handler for Shield interceptions
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      if (url.startsWith('donothin://intercept')) {
        const match = url.match(/[?&]app=([^&]+)/);
        const app = match ? decodeURIComponent(match[1]) : null;
        if (app) setInterceptedApp(app);
      }
    };

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  // ─── Walk Mode handler ───
  const handleStartWalkMode = useCallback((durationMinutes: number) => {
    setSessionDuration(durationMinutes * 60);
    setSessionScreen('WalkMode');
  }, []);

  const handleWalkComplete = useCallback((completedSeconds: number, _leftApp: boolean) => {
    setCompletedSeconds(completedSeconds);
    setTabKey(prev => prev + 1);
    setSessionScreen(null);
    setActiveTab('Today');
  }, []);

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
      dawgScore: sessionScoringResults?.dawgScore,
      stillnessScore: sessionScoringResults?.stillnessScore,
      blinkScore: sessionScoringResults?.blinkScore,
      durationScore: sessionScoringResults?.durationScore,
      grade: sessionScoringResults?.grade,
      gradeLabel: sessionScoringResults?.label,
      blinksPerMinute: sessionScoringResults?.blinksPerMinute,
      facePresencePercent: sessionScoringResults?.facePresencePercent,
      committedDuration: sessionDuration > 0 ? sessionDuration : undefined,
      protectionLevel,
      challengeCompleted: false,
    };

    // Compute dayNumber from program start date
    try {
      const startDate = await getStartDate();
      if (startDate) {
        session.dayNumber = getCalendarDayNumber(startDate);
      }
    } catch {}

    try {
      await saveSession(session);
      await updateStreakAfterSession();
      rescheduleAfterSession();
    } catch (_) {
      // Storage failed — continue to selfie screen regardless
    }

    // Analytics
    logSessionComplete({
      dawgScore: session.dawgScore,
      grade: session.grade,
      durationSeconds: seconds,
      dayNumber: session.dayNumber,
    });

    // Check for milestone celebration
    if (session.dayNumber && MILESTONE_DAYS.includes(session.dayNumber)) {
      try {
        const celebrated = await getCelebratedMilestones();
        if (!celebrated.includes(session.dayNumber)) {
          await setCelebratedMilestone(session.dayNumber);
          setMilestoneDay(session.dayNumber);
          logMilestoneReached(session.dayNumber);
        }
      } catch {}
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
    setActiveTab('Today');
    setSessionScreen(null);
  }, []);

  // ─── Challenge verification handlers ───
  const handleStartChallenge = useCallback((params: {
    verificationType: string;
    title: string;
    description: string;
    duration: string;
    timerSeconds?: number;
    minCharacters?: number;
    dayNumber: number;
    difficulty: 'easy' | 'medium' | 'hard';
    completionPrompt: string;
  }) => {
    setActiveChallenge(params);
    switch (params.verificationType) {
      case 'background_timer':
        setSessionScreen('ChallengeTimer');
        break;
      case 'photo_proof':
        setSessionScreen('ChallengePhoto');
        break;
      case 'reflection_gate':
        setSessionScreen('ChallengeReflection');
        break;
      default:
        setSessionScreen('ChallengeHonor');
        break;
    }
  }, []);

  const handleChallengeComplete = useCallback(async () => {
    if (activeChallenge) {
      await markDailyChallengeComplete(activeChallenge.dayNumber);
    }
    setActiveChallenge(null);
    setTabKey(prev => prev + 1);
    setSessionScreen(null);
  }, [activeChallenge]);

  const handleChallengeCancel = useCallback(() => {
    setActiveChallenge(null);
    setSessionScreen(null);
  }, []);

  // ─── Small Win handler ───
  const handleStartSmallWin = useCallback(() => {
    const win = SMALL_WIN_OPTIONS[0]; // breathing exercise
    setActiveChallenge({
      title: win.title,
      description: win.description,
      duration: '1 min',
      timerSeconds: win.timerSeconds,
      dayNumber: 0, // will be set from current day
      difficulty: 'easy',
      completionPrompt: '',
    });
    setSessionScreen('SmallWin');
  }, []);

  // ─── Focus Check handlers ───
  const handleStartFocusCheck = useCallback(() => {
    setSessionDuration(300); // 5 min default
    setVideoUri(undefined);
    setStillnessPercent(0);
    setBlinksCount(0);
    setScoringResults(null);
    setProtectionLevel('easy');
    setSessionScreen('FocusCheckPrepare');
  }, []);

  const handleFocusCheckSessionComplete = useCallback(async (
    seconds: number,
    sessionVideoUri?: string,
    stillness?: number,
    blinks?: number,
    sessionScoringResults?: SessionResults
  ) => {
    setCompletedSeconds(seconds);
    setScoringResults(sessionScoringResults ?? null);

    // Save as a Focus Check session
    const session: Session = {
      id: Date.now().toString(),
      duration: seconds,
      date: getDateString(new Date()),
      timestamp: Date.now(),
      isRogueMode: false,
      completed: true,
      stillnessPercent: sessionScoringResults?.stillnessPercent ?? stillness ?? 0,
      blinksCount: sessionScoringResults
        ? Math.round(sessionScoringResults.blinksPerMinute * (seconds / 60))
        : (blinks ?? 0),
      dawgScore: sessionScoringResults?.dawgScore,
      stillnessScore: sessionScoringResults?.stillnessScore,
      blinkScore: sessionScoringResults?.blinkScore,
      durationScore: sessionScoringResults?.durationScore,
      grade: sessionScoringResults?.grade,
      gradeLabel: sessionScoringResults?.label,
      blinksPerMinute: sessionScoringResults?.blinksPerMinute,
      facePresencePercent: sessionScoringResults?.facePresencePercent,
      committedDuration: sessionDuration > 0 ? sessionDuration : undefined,
      protectionLevel: 'easy',
      sessionType: 'focusCheck',
    };

    try {
      const startDate = await getStartDate();
      if (startDate) session.dayNumber = getCalendarDayNumber(startDate);
    } catch {}

    const testNumber = await getNextCheckTestNumber();
    session.focusCheckNumber = testNumber;

    try {
      await saveSession(session);
      await updateStreakAfterSession();
      rescheduleAfterSession();
    } catch {}

    // Save Focus Check result
    if (sessionScoringResults) {
      const result: FocusCheckResult = {
        testNumber,
        dayNumber: session.dayNumber ?? 1,
        difficulty: 'medium',
        sessionId: session.id,
        dawgScore: sessionScoringResults.dawgScore,
        stillnessScore: sessionScoringResults.stillnessScore ?? 0,
        blinkScore: sessionScoringResults.blinkScore ?? 0,
        blinksPerMinute: sessionScoringResults.blinksPerMinute,
        stillnessPercent: sessionScoringResults.stillnessPercent ?? 0,
        date: session.date,
        timestamp: session.timestamp,
      };
      await saveFocusCheckResult(result);

      const comparison = await getLatestComparison(result);
      setFocusCheckComparison(comparison);
      setSessionScreen('FocusCheckResults');
    } else {
      // Face detection failed — return to home instead of stuck state
      setTabKey(prev => prev + 1);
      setSessionScreen(null);
    }
  }, [sessionDuration]);

  const openPaywall = useCallback((feature?: keyof typeof PAYWALL_TRIGGERS) => {
    setPaywallTrigger(feature ? PAYWALL_TRIGGERS[feature] : null);
    setShowPaywall(true);
  }, []);

  const handleTabPress = useCallback((tab: Tab) => {
    if ((tab === 'Today' || tab === 'Insights') && activeTab !== tab) {
      setTabKey(prev => prev + 1); // Reload stats when switching to Today
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

  if (sessionScreen === 'WalkMode') {
    return (
      <WalkModeScreen
        durationMinutes={Math.floor(sessionDuration / 60)}
        onComplete={handleWalkComplete}
        onCancel={handleCancelSession}
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

  // ─── Challenge verification overlays ───
  if (sessionScreen === 'ChallengeTimer' && activeChallenge) {
    return (
      <TimerChallenge
        durationSeconds={activeChallenge.timerSeconds ?? 300}
        title={activeChallenge.title}
        description={activeChallenge.description}
        onComplete={() => handleChallengeComplete()}
        onCancel={handleChallengeCancel}
      />
    );
  }

  if (sessionScreen === 'ChallengePhoto' && activeChallenge) {
    return (
      <PhotoProofCapture
        title={activeChallenge.title}
        description={activeChallenge.description}
        dayNumber={activeChallenge.dayNumber}
        onComplete={() => handleChallengeComplete()}
        onCancel={handleChallengeCancel}
      />
    );
  }

  if (sessionScreen === 'ChallengeReflection' && activeChallenge) {
    return (
      <ReflectionGateModal
        title={activeChallenge.title}
        prompt={activeChallenge.completionPrompt}
        dayNumber={activeChallenge.dayNumber}
        onComplete={() => handleChallengeComplete()}
        onCancel={handleChallengeCancel}
      />
    );
  }

  if (sessionScreen === 'ChallengeHonor' && activeChallenge) {
    return (
      <ReflectionGateModal
        title={activeChallenge.title}
        prompt={activeChallenge.completionPrompt || 'Did you complete this challenge? Write a brief note about how it went.'}
        dayNumber={activeChallenge.dayNumber}
        onComplete={() => handleChallengeComplete()}
        onCancel={handleChallengeCancel}
      />
    );
  }

  if (sessionScreen === 'SmallWin' && activeChallenge) {
    return (
      <TimerChallenge
        durationSeconds={activeChallenge.timerSeconds ?? 60}
        title={activeChallenge.title}
        description={activeChallenge.description}
        onComplete={() => handleChallengeComplete()}
        onCancel={handleChallengeCancel}
      />
    );
  }

  // ─── Focus Check flow ───
  if (sessionScreen === 'FocusCheckPrepare') {
    return (
      <PrepareScreen
        durationMinutes={5}
        onReady={(incognito, level) => {
          setIncognitoMode(incognito || false);
          setProtectionLevel(level || 'easy');
          setSessionScreen('FocusCheckTimer');
        }}
        onCancel={() => setSessionScreen(null)}
      />
    );
  }

  if (sessionScreen === 'FocusCheckTimer') {
    return (
      <TimerScreen
        durationSeconds={sessionDuration}
        onComplete={handleFocusCheckSessionComplete}
        onCancel={() => setSessionScreen(null)}
        incognitoMode={incognitoMode}
        protectionLevel={protectionLevel}
      />
    );
  }

  if (sessionScreen === 'FocusCheckResults' && focusCheckComparison) {
    return (
      <FocusCheckResultsScreen
        comparison={focusCheckComparison}
        currentDay={focusCheckComparison.current.dayNumber}
        onGoHome={() => {
          setFocusCheckComparison(null);
          setTabKey(prev => prev + 1);
          setSessionScreen(null);
        }}
      />
    );
  }

  // ─── Game Picker ───
  if (sessionScreen === 'GamePicker') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F7F4EE', justifyContent: 'center', paddingHorizontal: 24 }}>
        <TouchableOpacity style={{ position: 'absolute', top: 60, left: 20, padding: 8 }} onPress={() => setSessionScreen(null)}>
          <Ionicons name="close" size={24} color="#1C1208" />
        </TouchableOpacity>

        <Text style={{ fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#1C1208', textAlign: 'center', marginBottom: 24 }}>Choose a mode</Text>

        <TouchableOpacity
          style={{ backgroundColor: '#EDE9E0', borderRadius: 16, padding: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          onPress={() => setSessionScreen('BeatPaws')}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 32 }}>👁️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#1C1208' }}>Beat Paws</Text>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60' }}>Staring contest — test your focus</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B0A090" />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#EDE9E0', borderRadius: 16, padding: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          onPress={() => setSessionScreen('PawsMode')}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 32 }}>☕</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#1C1208' }}>Paws Mode</Text>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60' }}>Phone-free timer for meals, coffee, walks</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B0A090" />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#EDE9E0', borderRadius: 16, padding: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          onPress={() => handleStartSession(300)}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 32 }}>📷</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#1C1208' }}>Full Focus Test</Text>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60' }}>5-minute camera session with detailed scoring</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B0A090" />
        </TouchableOpacity>

        <TouchableOpacity
          style={{ backgroundColor: '#EDE9E0', borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 }}
          onPress={() => setSessionScreen('AppBlocker')}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: 32 }}>🛡️</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#1C1208' }}>App Blocker</Text>
            <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60' }}>Choose apps for Paws to intercept</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#B0A090" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── App Blocker ───
  if (sessionScreen === 'AppBlocker') {
    return (
      <AppBlockerScreen onDone={() => setSessionScreen(null)} />
    );
  }

  // ─── Beat Paws ───
  if (sessionScreen === 'BeatPaws') {
    return (
      <BeatPawsScreen
        onComplete={async (result) => {
          setBeatPawsResult(result);
          // Save session
          const session: BeatPawsSession = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            date: new Date().toISOString().split('T')[0],
            score: result.score,
            blinks: result.blinks,
            stillnessPercent: result.stillnessPercent,
            durationSeconds: result.durationSeconds,
            won: result.won,
            levelName: result.levelName as any,
            longestStretch: result.longestStretch,
            timestamp: Date.now(),
          };
          await saveBeatPawsSession(session);
          await checkLevelUp();
          const streak = await getBeatPawsStreak();
          setBeatPawsStreak(streak);
          setSessionScreen('BeatPawsResult');
        }}
        onCancel={() => setSessionScreen(null)}
      />
    );
  }

  if (sessionScreen === 'BeatPawsResult' && beatPawsResult) {
    return (
      <BeatPawsResultScreen
        {...beatPawsResult}
        streak={beatPawsStreak}
        onRematch={() => {
          setBeatPawsResult(null);
          setSessionScreen('BeatPaws');
        }}
        onDone={() => {
          setBeatPawsResult(null);
          setTabKey((prev) => prev + 1);
          setSessionScreen(null);
        }}
      />
    );
  }

  // ─── Paws Mode ───
  if (sessionScreen === 'PawsMode') {
    return (
      <PawsModeScreen2
        onComplete={async (result) => {
          const session = createPawsModeSession(result.activity, result.durationMinutes, result.actualMinutes, result.pickups);
          await savePawsModeSession(session);
          setTabKey((prev) => prev + 1);
          setSessionScreen(null);
        }}
        onCancel={() => setSessionScreen(null)}
      />
    );
  }

  // ─── Shield Interception overlay ───
  if (interceptedApp) {
    return (
      <InterceptionScreen
        appId={interceptedApp}
        onDismiss={() => {
          setInterceptedApp(null);
          setTabKey(prev => prev + 1);
        }}
      />
    );
  }

  // ─── Main tab screens (with bottom tab bar) ───
  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>
        {activeTab === 'Today' && (
          <HomeScreen
            key={tabKey}
            onStartSession={handleStartSession}
            onStartWalkMode={handleStartWalkMode}
            onStartChallenge={handleStartChallenge}
            onStartSmallWin={handleStartSmallWin}
            onStartFocusCheck={handleStartFocusCheck}
            isPro={isPro}
            onPaywall={openPaywall}
          />
        )}
        {activeTab === 'Insights' && (
          <InsightsScreen
            key={tabKey}
            onNavigateToSettings={() => setActiveTab('Settings')}
          />
        )}
        {activeTab === 'Journey' && (
          <RewireScreen isPro={isPro} onPaywall={openPaywall} />
        )}
        {activeTab === 'Settings' && <SettingsScreen />}
      </View>
      <BottomTabBar
        activeTab={activeTab}
        onTabPress={handleTabPress}
        onCenterPress={() => setSessionScreen('GamePicker')}
      />
      <MilestoneModal
        visible={milestoneDay != null}
        dayNumber={milestoneDay ?? 0}
        onDismiss={() => setMilestoneDay(null)}
      />
      <PaywallModal
        visible={showPaywall}
        trigger={paywallTrigger}
        onDismiss={() => setShowPaywall(false)}
        onPurchaseComplete={() => {
          setShowPaywall(false);
          setIsPro(true);
          setTabKey(prev => prev + 1);
        }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  screenContainer: {
    flex: 1,
  },
  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  centerButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: -28,
    width: 72,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4820A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  centerLabel: {
    fontFamily: FONTS.body,
    fontSize: 9,
    color: COLORS.accent,
    marginTop: 4,
  },
  tabLabel: {
    fontFamily: FONTS.body,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  tabLabelActive: {
    color: COLORS.accent,
  },
});

// ─── App Entry ────────────────────────────────────────────
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppLoader>
          <AppRouter />
        </AppLoader>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
