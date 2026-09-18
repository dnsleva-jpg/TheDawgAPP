import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { MOTIVATIONAL_MESSAGES } from '../constants/messages';
import { COLORS } from '../constants/colors';

export function MotivationalMessage() {
  const [currentMessage, setCurrentMessage] = useState(
    MOTIVATIONAL_MESSAGES[0]
  );
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Change message
        const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length);
        setCurrentMessage(MOTIVATIONAL_MESSAGES[randomIndex]);
        
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.Text
      style={[
        styles.message,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      {currentMessage}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  message: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.lightGray,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 26,
  },
});
