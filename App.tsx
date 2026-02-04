import React, { useState } from 'react';
import { HomeScreen } from './src/screens/HomeScreen';
import { PrepareScreen } from './src/screens/PrepareScreen';
import { TimerScreen } from './src/screens/TimerScreen';
import { SelfieScreen } from './src/screens/SelfieScreen';
import { ResultsScreen } from './src/screens/ResultsScreen';
import { Screen, Session } from './src/types';
import { saveSession } from './src/utils/storage';
import { getDateString } from './src/utils/stats';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('Home');
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [completedSeconds, setCompletedSeconds] = useState<number>(0);
  const [videoUri, setVideoUri] = useState<string | undefined>(undefined);
  const [stillnessPercent, setStillnessPercent] = useState<number>(0);
  const [blinksCount, setBlinksCount] = useState<number>(0);
  const [homeKey, setHomeKey] = useState<number>(0);

  const handleStartSession = (durationSeconds: number) => {
    setSessionDuration(durationSeconds);
    setVideoUri(undefined); // Reset video from previous session
    setStillnessPercent(0); // Reset stats from previous session
    setBlinksCount(0);
    setCurrentScreen('Prepare');
  };

  const handleReady = () => {
    setCurrentScreen('Timer');
  };

  const handleSessionComplete = async (
    seconds: number,
    videoUri?: string,
    stillness?: number,
    blinks?: number
  ) => {
    setCompletedSeconds(seconds);
    setVideoUri(videoUri);
    setStillnessPercent(stillness || 0);
    setBlinksCount(blinks || 0);
    
    // Save session to storage
    const session: Session = {
      id: Date.now().toString(),
      duration: seconds,
      date: getDateString(new Date()),
      timestamp: Date.now(),
      isRogueMode: sessionDuration === -1,
      completed: true,
    };
    
    await saveSession(session);
    
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
        />
      )}
      
      {currentScreen === 'Selfie' && (
        <SelfieScreen
          completedSeconds={completedSeconds}
          stillnessPercent={stillnessPercent}
          blinksCount={blinksCount}
          onComplete={handleSelfieComplete}
        />
      )}
      
      {currentScreen === 'Results' && (
        <ResultsScreen
          completedSeconds={completedSeconds}
          videoUri={videoUri}
          onGoHome={handleGoHome}
        />
      )}
    </>
  );
}
