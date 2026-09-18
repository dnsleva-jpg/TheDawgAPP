import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { PawsMascot } from '../../components/PawsMascot';
import { TypewriterTitle } from '../../components/TypewriterTitle';
import { useOnboarding } from '../../context/OnboardingContext';

const COPY: Record<string, string> = {
  'Build something': 'What could you build with 2 extra focused hours a day?',
  'Learn a skill': 'What could you learn with 2 extra focused hours a day?',
  'Get fit': 'What could you achieve with 2 extra hours of clear-headed energy?',
  'Read and think': 'How many books could you finish with 2 extra focused hours a day?',
  'Be present': 'Who could you show up for with 2 extra focused hours a day?',
  'Create': 'What could you make with 2 extra focused hours a day?',
};

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen32A({ goNext }: Props) {
  const { data } = useOnboarding();
  const [showPaws, setShowPaws] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleDone = () => {
    setShowPaws(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => {
      setTimeout(goNext, 2200);
    });
  };

  const copy = COPY[data.userAmbition ?? ''] ?? COPY['Build something'];

  return (
    <View style={st.container}>
      <TypewriterTitle text={copy} style={st.title} speed={35} onComplete={handleDone} />
      {showPaws && (
        <Animated.View style={[st.pawsRow, { opacity: fadeAnim }]}>
          <PawsMascot mood="thinking" size={64} />
          <Text style={st.italic}>Paws already knows the answer.</Text>
        </Animated.View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 30, color: '#1C1208', textAlign: 'center' },
  pawsRow: { alignItems: 'center', marginTop: 24 },
  italic: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60', fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
});
