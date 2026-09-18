import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { AnimatedPaws } from '../../components/AnimatedPaws';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

interface IfThen {
  id: string;
  ifText: string;
  thenText: string;
  match?: RegExp;  // triggers which painPoints this card prioritizes
}

// Pool of plans. Paws picks 3 based on user answers — if-then plans (Gollwitzer's implementation
// intentions) have ~2-3x follow-through vs. vague goals.
const PLANS: IfThen[] = [
  {
    id: 'anxiety-breathe',
    ifText: 'I feel anxious or overstimulated',
    thenText: 'I breathe for 30 seconds before I open any app.',
    match: /anxiety|overstimulation|fried/i,
  },
  {
    id: 'boredom-outside',
    ifText: "I'm bored and reach for my phone",
    thenText: 'I stand up and step outside for 2 minutes.',
    match: /focus|procrastination|productivity/i,
  },
  {
    id: 'sleep-roomaway',
    ifText: "I can't sleep and grab my phone",
    thenText: 'I move it to another room and try again.',
    match: /sleep/i,
  },
  {
    id: 'morning-nophone',
    ifText: 'I wake up',
    thenText: "I don't touch my phone for the first 30 minutes.",
    match: /morning|presence/i,
  },
  {
    id: 'evening-sunset',
    ifText: 'The sun sets',
    thenText: 'I put my phone on its charger in another room.',
    match: /evening|presence/i,
  },
  {
    id: 'people-facedown',
    ifText: "I'm with people I care about",
    thenText: 'My phone goes face-down until we part.',
    match: /people|present/i,
  },
];

export function ScreenIfThen({ goNext }: Props) {
  const { data, updateField } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);

  // Pick 3 plans best-matched to the user's answers.
  const picks = useMemo(() => {
    const signals = [data.userPainPoint, data.userGoal, data.userWorstTime].filter(Boolean).join(' ');
    const scored = PLANS.map((p) => ({
      plan: p,
      score: p.match && signals ? (p.match.test(signals) ? 10 : 0) : 0,
    }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3).map((s) => s.plan);
    // If fewer than 3 matched, pad from remaining
    if (top.length < 3) {
      const remainder = PLANS.filter((p) => !top.includes(p)).slice(0, 3 - top.length);
      return [...top, ...remainder];
    }
    return top;
  }, [data]);

  const handleSelect = (id: string) => {
    setSelected(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const pick = PLANS.find((p) => p.id === id);
    if (pick) updateField('userCommitment', `IF ${pick.ifText}, THEN ${pick.thenText}`);
  };

  const handleContinue = () => {
    if (!selected) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    goNext();
  };

  return (
    <View style={st.container}>
      <AnimatedPaws state="focus" size={64} style={{ alignSelf: 'center', marginBottom: 8 }} />

      <Text style={st.eyebrow}>YOUR IF-THEN PLAN</Text>
      <Text style={st.title}>Pick your commitment.</Text>
      <Text style={st.body}>
        When the urge hits, you'll do one thing instead. Choose the one you can actually keep.
      </Text>

      <View style={st.cards}>
        {picks.map((p, i) => {
          const isSel = selected === p.id;
          return (
            <MotiView
              key={p.id}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 320, delay: 200 + i * 120 }}
            >
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleSelect(p.id)}
                style={[st.card, isSel && st.cardSelected]}
              >
                <View style={st.row}>
                  <Text style={[st.tag, st.tagIf, isSel && st.tagIfSelected]}>IF</Text>
                  <Text style={[st.clause, isSel && st.clauseSelected]}>{p.ifText}</Text>
                </View>
                <View style={st.row}>
                  <Text style={[st.tag, st.tagThen, isSel && st.tagThenSelected]}>THEN</Text>
                  <Text style={[st.clause, isSel && st.clauseSelected]}>{p.thenText}</Text>
                </View>
              </TouchableOpacity>
            </MotiView>
          );
        })}
      </View>

      <TouchableOpacity
        style={[st.continueBtn, !selected && st.continueBtnDisabled]}
        onPress={handleContinue}
        disabled={!selected}
        activeOpacity={0.85}
      >
        <Text style={st.continueText}>{selected ? "That's my commitment" : 'Pick one to continue'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, backgroundColor: '#F7F4EE' },
  eyebrow: { fontFamily: 'Outfit_800ExtraBold', fontSize: 11, color: '#D4820A', letterSpacing: 1.5, textAlign: 'center', marginBottom: 6 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: '#1C1208', textAlign: 'center' },
  body: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60', textAlign: 'center', lineHeight: 20, marginTop: 6, marginBottom: 20, paddingHorizontal: 10 },

  cards: { gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6 },
  cardSelected: { borderColor: '#D4820A', backgroundColor: '#FFF8F0' },

  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginVertical: 3 },
  tag: { fontFamily: 'Outfit_800ExtraBold', fontSize: 10, color: '#FFF', letterSpacing: 1, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, overflow: 'hidden', marginTop: 2, width: 40, textAlign: 'center' },
  tagIf: { backgroundColor: '#B0A090' },
  tagIfSelected: { backgroundColor: '#8A7A60' },
  tagThen: { backgroundColor: '#D4820A' },
  tagThenSelected: { backgroundColor: '#B8680A' },
  clause: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#1C1208', flex: 1, lineHeight: 19 },
  clauseSelected: { color: '#1C1208' },

  continueBtn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, alignItems: 'center', marginTop: 20 },
  continueBtnDisabled: { opacity: 0.35 },
  continueText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE' },
});
