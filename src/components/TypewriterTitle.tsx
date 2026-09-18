import React, { useState, useEffect, useRef } from 'react';
import { Text, type TextStyle } from 'react-native';

interface TypewriterTitleProps {
  text: string;
  style?: TextStyle;
  delay?: number;
  speed?: number;
  onComplete?: () => void;
  onChar?: (index: number, char: string) => void;
}

export function TypewriterTitle({ text, style, delay = 0, speed = 40, onComplete, onChar }: TypewriterTitleProps) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  // Keep callbacks in refs so their identity doesn't retrigger the interval effect.
  const onCompleteRef = useRef(onComplete);
  const onCharRef = useRef(onChar);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);
  useEffect(() => { onCharRef.current = onChar; }, [onChar]);

  useEffect(() => {
    const delayTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(delayTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      onCharRef.current?.(i - 1, text.charAt(i - 1));
      if (i >= text.length) {
        clearInterval(interval);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [started, text, speed]);

  if (!started) return null;

  return <Text style={style}>{displayed}</Text>;
}
