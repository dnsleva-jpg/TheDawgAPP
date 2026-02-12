import React, { useState } from 'react';
import { HomeScreen } from './src/screens/HomeScreen';
import { PrepareScreen } from './src/screens/PrepareScreen';
import { TimerScreen } from './src/screens/TimerScreen';
import { SelfieScreen } from './src/screens/SelfieScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { Screen, Session } from './src/types';
import { saveSession } from './src/utils/storage';
import { getDateString } from './src/utils/stats';
import { updateStreakAfterSession } from './src/utils/streakManager';
import { AppLoader } from './src/components/AppLoader';
import type { SessionResults } from './src/scoring/scoringEngine';

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Home');
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [completedSeconds, setCompletedSeconds] = useState<number>(0);
  const [videoUri, setVideoUri] = useState<string | undefined>(undefined);
  const [stillnessPercent, setStillnessPercent] = useState<number>(0);
  const [blinksCount, setBlinksCount] = useState<number>(0);
  const [homeKey, setHomeKey] = useState<number>(0);
  const [incognitoMode, setIncognitoMode] = useState<boolean>(false);
  const [scoringResults, setScoringResults] = useState<SessionResults | null>(null);

  const handleStartSession = (durationSeconds: number) => {
    setSessionDuration(durationSeconds);
    setVideoUri(undefined); // Reset video from previous session
    setStillnessPercent(0); // Reset stats from previous session
    setBlinksCount(0);
    setScoringResults(null);
    setCurrentScreen('Prepare');
  };

  const handleReady = (incognito?: boolean) => {
    setIncognitoMode(incognito || false);
    setCurrentScreen('Timer');
  };

  const handleSessionComplete = async (
    seconds: number,
    videoUri?: string,
    stillness?: number,
    blinks?: number,
    sessionScoringResults?: SessionResults
  ) => {
    setCompletedSeconds(seconds);
    setVideoUri(videoUri);
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
    };
    
    try {
      await saveSession(session);
      await updateStreakAfterSession();
    } catch (_) {
      // Storage failed — continue to selfie screen regardless
    }
    
    // Go to Selfie screen
    setCurrentScreen('Selfie');
  };

  const handleSelfieComplete = () => {
    setCurrentScreen('Results');
  };

  const handleCancelPrepare = () => {
    setCurrentScreen('Home');
  };

  const handleCancelSession = () => {
    setVideoUri(undefined);
    setHomeKey(prev => prev + 1);
    setCurrentScreen('Home');
  };

  const handleGoHome = () => {
    setVideoUri(undefined);
    setHomeKey(prev => prev + 1); // Force HomeScreen to reload stats
    setCurrentScreen('Home');
  };

  return (
    <>
      {currentScreen === 'Home' && (
        <HomeScreen key={homeKey} onStartSession={handleStartSession} />
      )}
      
      {currentScreen === 'Prepare' && (
        <PrepareScreen
          durationMinutes={Math.floor(sessionDuration / 60)}
          onReady={handleReady}
          onCancel={handleCancelPrepare}
        />
      )}
      
      {currentScreen === 'Timer' && (
        <TimerScreen
          durationSeconds={sessionDuration}
          onComplete={handleSessionComplete}
          onCancel={handleCancelSession}
          incognitoMode={incognitoMode}
        />
      )}
      
      {currentScreen === 'Selfie' && (
        <SelfieScreen
          completedSeconds={completedSeconds}
          stillnessPercent={stillnessPercent}
          blinksCount={blinksCount}
          scoringResults={scoringResults}
          onComplete={handleSelfieComplete}
        />
      )}
      
      {currentScreen === 'Results' && (
        <ResultsScreen
          completedSeconds={completedSeconds}
          videoUri={videoUri}
          stillnessPercent={stillnessPercent}
          blinksCount={blinksCount}
          scoringResults={scoringResults}
          onGoHome={handleGoHome}
        />
      )}
    </>
  );
}

// Main App component with font loader
export default function App() {
  return (
    <AppLoader>
      <AppContent />
    </AppLoader>
  );
}
