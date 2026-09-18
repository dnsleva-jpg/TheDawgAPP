import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Slider from '@react-native-community/slider';
import { AnimatedPaws, type PawsAnimState } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

const SLIDER_STATES: { max: number; state: PawsAnimState; label: string; color: string }[] = [
  { max: 7,   state: 'focus',      label: 'Pure focus 🧘',       color: '#4CAF50' },
  { max: 14,  state: 'celebrating', label: 'Phone mastery',      color: '#7ED957' },
  { max: 21,  state: 'calm',       label: 'Calm & present',      color: '#66BB6A' },
  { max: 28,  state: 'tempted',    label: 'Slightly tempted',    color: '#FFC107' },
  { max: 35,  state: 'pickingUp',  label: 'Picking it up...',    color: '#D4820A' },
  { max: 42,  state: 'hooked',     label: 'Hooked',              color: '#E67E22' },
  { max: 49,  state: 'cantStop',   label: "Can't stop",          color: '#E74C3C' },
  { max: 56,  state: 'brainFog',   label: 'Brain fog',           color: '#C0392B' },
  { max: 63,  state: 'melting',    label: 'Melting...',          color: '#A93226' },
  { max: 70,  state: 'severeRot',  label: 'Severe rot',          color: '#8B0000' },
  { max: 77,  state: 'fullRot',    label: 'Full brainrot 💀',    color: '#5C0000' },
  { max: 84,  state: 'deadRot',    label: 'Gooey chaos',         color: '#4A0000' },
  { max: 90,  state: 'dissolved',  label: 'Dissolved',           color: '#380000' },
  { max: 96,  state: 'decaying',   label: 'Decaying',            color: '#260000' },
  { max: 100, state: 'grave',      label: 'Terminal 🪦',          color: '#1a0000' },
];

function getSliderState(val: number) {
  for (const s of SLIDER_STATES) {
    if (val <= s.max) return s;
  }
  return SLIDER_STATES[SLIDER_STATES.length - 1];
}

export function Screen4({ goNext }: Props) {
  const [value, setValue] = useState(50);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastState = useRef(getSliderState(50).state);

  const handleChange = (v: number) => {
    const newState = getSliderState(v).state;
    if (newState !== lastState.current) {
      lastState.current = newState;
      // Soft pop on state change — gentle enough not to stutter on fast drags
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 140, friction: 7, useNativeDriver: true }),
      ]).start();
    }
    setValue(v);
  };

  const current = getSliderState(value);
  const trackColor = value <= 30 ? '#4CAF50' : value <= 60 ? '#D4820A' : '#E74C3C';

  return (
    <View style={st.container}>
      <Text style={st.title}>See for yourself</Text>

      <Animated.View style={[st.pawsWrap, { transform: [{ scale: scaleAnim }] }]}>
        <AnimatedPaws state={current.state} size={200} />
      </Animated.View>

      <View style={st.card}>
        <Text style={[st.label, { color: current.color }]}>{current.label}</Text>
        <Slider
          style={st.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={value}
          onValueChange={handleChange}
          minimumTrackTintColor={trackColor}
          maximumTrackTintColor="#E0D8CC"
          thumbTintColor="#FFFFFF"
        />
        <View style={st.captionRow}>
          <Text style={st.caption}>Focused</Text>
          <Text style={st.caption}>Full brainrot</Text>
        </View>
      </View>

      <Text style={st.btn} onPress={goNext}>Continue</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 30, color: '#1C1208', textAlign: 'center', marginBottom: 8 },
  pawsWrap: { alignSelf: 'center', marginBottom: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  label: { fontFamily: 'Outfit_700Bold', fontSize: 17, textAlign: 'center', marginBottom: 12 },
  slider: { width: '100%', height: 40 },
  captionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  caption: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#B0A090' },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', marginTop: 24, overflow: 'hidden' },
});
