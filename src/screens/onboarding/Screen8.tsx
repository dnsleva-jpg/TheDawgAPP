import React from 'react';
import { QuestionScreen } from './QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen8({ goNext }: Props) {
  const { updateField } = useOnboarding();
  return (
    <QuestionScreen
      title="How does screen time affect you?"
      questionIndex={2}
      totalQuestions={6}
      multiSelect
      options={[
        { emoji: '🤯', label: 'No focus / procrastination' },
        { emoji: '😤', label: 'Anxiety / overstimulation' },
        { emoji: '😴', label: 'Bad sleep' },
        { emoji: '📉', label: 'Productivity loss' },
        { emoji: '🔍', label: 'I feel mentally fried' },
        { emoji: '👥', label: 'Less time with people I care about' },
      ]}
      onSelect={(labels) => { updateField('userPainPoint', Array.isArray(labels) ? labels.join(', ') : labels); goNext(); }}
    />
  );
}
