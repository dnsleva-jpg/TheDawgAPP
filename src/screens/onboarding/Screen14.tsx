import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

function getMessage(h: number): string {
  if (h < 2) return "Not bad. Paws is cautiously optimistic.";
  if (h < 4) return "That adds up faster than Paws expected.";
  if (h < 6) return "Paws has calculated what that costs you.";
  if (h < 8) return "That's nearly half your waking hours. Paws is concerned.";
  return "Paws needs a moment. Your attention needs serious recovery.";
}

export function Screen14({ goNext }: Props) {
  const { updateField } = useOnboarding();
  const [value, setValue] = useState(6);

  const handleContinue = () => {
    updateField('userScreenTime', value);
    goNext();
  };

  return (
    <View style={st.container}>
      <Text style={st.title}>How much time do you spend on screens daily?</Text>
      <Text style={st.sub}>You can tell the truth</Text>

      <Text style={st.bigNumber}>{value} hours</Text>

      <Slider
        style={st.slider}
        minimumValue={0}
        maximumValue={12}
        step={0.5}
        value={value}
        onValueChange={setValue}
        minimumTrackTintColor="#D4820A"
        maximumTrackTintColor="#EDE9E0"
        thumbTintColor="#FFFFFF"
      />

      <Text style={st.message}>{getMessage(value)}</Text>

      <Text style={st.btn} onPress={handleContinue}>Continue</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#1C1208', textAlign: 'center' },
  sub: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  bigNumber: { fontFamily: 'Outfit_800ExtraBold', fontSize: 56, color: '#1C1208', textAlign: 'center', marginBottom: 16 },
  slider: { width: '100%', height: 40 },
  message: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#D4820A', textAlign: 'center', marginTop: 16, minHeight: 40 },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', marginTop: 24, overflow: 'hidden' },
});
