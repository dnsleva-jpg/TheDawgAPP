import { useState, useEffect, useRef } from 'react';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface UseTimerReturn {
  timeRemaining: number;
  status: TimerStatus;
  progress: number; // 0 to 1
  isRogueMode: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  finish: () => void;
}

/**
 * Custom hook for managing countdown timer (or count-up for Rogue Mode)
 */
export function useTimer(initialSeconds: number): UseTimerReturn {
  const isRogueMode = initialSeconds === -1;
  const [timeRemaining, setTimeRemaining] = useState(isRogueMode ? 0 : initialSeconds);
  const [status, setStatus] = useState<TimerStatus>('idle');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalDurationRef = useRef(initialSeconds);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const start = () => {
    if (status !== 'idle') return;
    
    totalDurationRef.current = initialSeconds;
    setTimeRemaining(isRogueMode ? 0 : initialSeconds);
    setStatus('running');
  };

  const pause = () => {
    if (status === 'running') {
      clearTimer();
      setStatus('paused');
    }
  };

  const resume = () => {
    if (status === 'paused') {
      setStatus('running');
    }
  };

  const reset = () => {
    clearTimer();
    setTimeRemaining(isRogueMode ? 0 : initialSeconds);
    setStatus('idle');
  };

  const finish = () => {
    if (status === 'running' || status === 'paused') {
      clearTimer();
      setStatus('completed');
    }
  };

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (isRogueMode) {
            // Count UP for Rogue Mode
            return prev + 1;
          } else {
            // Count DOWN for normal mode
            if (prev <= 1) {
              clearTimer();
              setStatus('completed');
              return 0;
            }
            return prev - 1;
          }
        });
      }, 1000);
    }

    return () => clearTimer();
  }, [status, isRogueMode]);

  const progress = totalDurationRef.current > 0 
    ? 1 - (timeRemaining / totalDurationRef.current)
    : 0;

  return {
    timeRemaining,
    status,
    progress,
    isRogueMode,
    start,
    pause,
    resume,
    reset,
    finish,
  };
}
