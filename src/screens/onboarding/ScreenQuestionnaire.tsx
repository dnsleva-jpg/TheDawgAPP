import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

interface Question {
  id: 'identity' | 'steal' | 'worst_time' | 'prior' | 'day90';
  field: 'userIdentity' | 'userPainPoint' | 'userWorstTime' | 'userPriorAttempt' | 'userGoal';
  label: string;
  options: string[];
}

const QUESTIONS: Question[] = [
  {
    id: 'identity',
    field: 'userIdentity',
    label: 'Who are you when the phone is closed?',
    options: ['Creator', 'Parent', 'Leader', 'Athlete', 'Explorer'],
  },
  {
    id: 'steal',
    field: 'userPainPoint',
    label: "What's the phone stealing most?",
    options: ['Focus', 'Sleep', 'Connection', 'Creativity', 'Time'],
  },
  {
    id: 'worst_time',
    field: 'userWorstTime',
    label: 'When do you lose the most time?',
    options: ['Morning', 'Midday', 'Evening', 'Late night'],
  },
  {
    id: 'prior',
    field: 'userPriorAttempt',
    label: 'Tried to quit before?',
    options: ['Never', '1–3 times', 'Many times'],
  },
  {
    id: 'day90',
    field: 'userGoal',
    label: 'Day 90 — what does it feel like?',
    options: ['Calm', 'Sharp', 'Connected', 'Creative', 'Free'],
  },
];

export function ScreenQuestionnaire({ goNext }: Props) {
  const insets = useSafeAreaInsets();
  const { updateField } = useOnboarding();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const handleSelect = (qid: string, field: Question['field'], value: string) => {
    Haptics.selectionAsync().catch(() => {});
    setAnswers((a) => ({ ...a, [qid]: value }));
    updateField(field, value);
  };

  const allAnswered = QUESTIONS.every((q) => answers[q.id]);

  const handleContinue = () => {
    if (!allAnswered) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    goNext();
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <View
      style={[
        st.container,
        { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom, 16) + 12 },
      ]}
    >
      <View style={st.headerWrap}>
        <Text style={st.kicker}>{answeredCount}/{QUESTIONS.length} · ALMOST READY</Text>
        <Text style={st.title}>Tell Paws who you are.</Text>
        <Text style={st.sub}>5 taps. Then we build your plan.</Text>
      </View>

      <ScrollView
        contentContainerStyle={st.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {QUESTIONS.map((q, qIdx) => {
          const selected = answers[q.id];
          return (
            <MotiView
              key={q.id}
              from={{ opacity: 0, translateY: 14 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 320, delay: 80 + qIdx * 70 }}
              style={st.qBlock}
            >
              <View style={st.qHeaderRow}>
                <Text style={st.qNumber}>{String(qIdx + 1).padStart(2, '0')}</Text>
                <Text style={st.qLabel}>{q.label}</Text>
              </View>

              <View style={st.chipRow}>
                {q.options.map((opt) => {
                  const isSelected = selected === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.75}
                      onPress={() => handleSelect(q.id, q.field, opt)}
                      style={[st.chip, isSelected && st.chipSelected]}
                    >
                      <Text style={[st.chipText, isSelected && st.chipTextSelected]}>{opt}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </MotiView>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={!allAnswered}
        onPress={handleContinue}
        style={[st.cta, !allAnswered && st.ctaDisabled]}
      >
        <Text style={[st.ctaText, !allAnswered && st.ctaTextDisabled]}>
          {allAnswered ? 'Build my plan →' : `${answeredCount}/${QUESTIONS.length} answered`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
    paddingHorizontal: 22,
  },
  headerWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  kicker: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 11,
    color: '#D4820A',
    letterSpacing: 1.8,
    marginBottom: 6,
  },
  title: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 26,
    color: '#1C1208',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  sub: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
    color: '#8A7A60',
    textAlign: 'center',
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  qBlock: {
    marginBottom: 16,
  },
  qHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  qNumber: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 14,
    color: '#D4820A',
    letterSpacing: 0.4,
    width: 22,
  },
  qLabel: {
    flex: 1,
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 16,
    color: '#1C1208',
    lineHeight: 21,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingLeft: 30,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1.5,
    borderColor: '#E0D8CC',
  },
  chipSelected: {
    backgroundColor: '#FFF1D9',
    borderColor: '#D4820A',
  },
  chipText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 13,
    color: '#8A7A60',
    letterSpacing: 0.2,
  },
  chipTextSelected: {
    color: '#D4820A',
  },

  cta: {
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  ctaDisabled: {
    backgroundColor: '#E0D8CC',
  },
  ctaText: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  ctaTextDisabled: {
    color: '#8A7A60',
  },
});
