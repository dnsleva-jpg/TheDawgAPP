import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { PawsMascot } from '../../components/PawsMascot';
import { useOnboarding } from '../../context/OnboardingContext';

const HEALTHY_APPS = [
  { emoji: '📞', label: 'FaceTime / Calls', desc: 'Connecting with people' },
  { emoji: '💬', label: 'Messages', desc: 'Texting friends and family' },
  { emoji: '📚', label: 'Learning apps', desc: 'Duolingo, Coursera, Kindle' },
  { emoji: '🏋️', label: 'Fitness & Health', desc: 'Workouts, meditation, sleep' },
  { emoji: '🗺️', label: 'Maps & Travel', desc: 'Getting places' },
  { emoji: '💼', label: 'Work tools', desc: 'Email, Slack, productivity' },
  { emoji: '🎵', label: 'Music & Podcasts', desc: 'Listening, not scrolling' },
  { emoji: '📸', label: 'Camera / Creating', desc: 'Making, not consuming' },
];

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function ScreenHealthyApps({ goNext }: Props) {
  const { updateField } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (label: string) => {
    setSelected((prev) => prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]);
  };

  const handleContinue = () => {
    updateField('userHealthyApps' as any, selected.join(', '));
    goNext();
  };

  return (
    <ScrollView contentContainerStyle={st.container} showsVerticalScrollIndicator={false}>
      <PawsMascot mood="meditating" size={64} style={{ alignSelf: 'center' }} />
      <Text style={st.title}>Not all screen time is bad.</Text>
      <Text style={st.sub}>Paws won't count these against you. Which apps help you?</Text>

      <View style={st.grid}>
        {HEALTHY_APPS.map((app) => {
          const isSelected = selected.includes(app.label);
          return (
            <TouchableOpacity
              key={app.label}
              style={[st.card, isSelected && st.cardSelected]}
              onPress={() => toggle(app.label)}
              activeOpacity={0.7}
            >
              <Text style={st.cardEmoji}>{app.emoji}</Text>
              <Text style={[st.cardLabel, isSelected && st.cardLabelSelected]}>{app.label}</Text>
              <Text style={st.cardDesc}>{app.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[st.btn, selected.length === 0 && st.btnDisabled]}
        onPress={handleContinue}
        disabled={selected.length === 0}
        activeOpacity={0.8}
      >
        <Text style={st.btnText}>Continue</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: '#1C1208', textAlign: 'center', marginTop: 12 },
  sub: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', textAlign: 'center', marginTop: 6, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  card: { width: '47%', backgroundColor: '#EDE9E0', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  cardSelected: { borderColor: '#2ECC71', backgroundColor: '#F0FFF4' },
  cardEmoji: { fontSize: 24, marginBottom: 6 },
  cardLabel: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#1C1208', textAlign: 'center' },
  cardLabelSelected: { color: '#2ECC71' },
  cardDesc: { fontFamily: 'Outfit_400Regular', fontSize: 11, color: '#B0A090', textAlign: 'center', marginTop: 2 },
  btn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, width: '100%', alignItems: 'center', marginTop: 20 },
  btnDisabled: { opacity: 0.4 },
  btnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE' },
});
