import React from 'react';
import { QuestionScreen } from './QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen7({ goNext }: Props) {
  const { updateField } = useOnboarding();
  return (
    <QuestionScreen
      title="What's costing you the most right now?"
      questionIndex={1}
      totalQuestions={6}
      multiSelect
      options={[
        { emoji: '🧘', label: 'Improve focus' },
        { emoji: '⏰', label: 'Reclaim my time' },
        { emoji: '🚀', label: 'Sleep better' },
        { emoji: '🌙', label: 'Be more present' },
        { emoji: '📵', label: 'Stop doom scrolling' },
        { emoji: '👀', label: 'Just curious' },
      ]}
      onSelect={(labels) => { updateField('userGoal', Array.isArray(labels) ? labels.join(', ') : labels); goNext(); }}
    />
  );
}
