import React from 'react';
import { QuestionScreen } from './QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen10({ goNext }: Props) {
  const { updateField } = useOnboarding();
  return (
    <QuestionScreen
      title="When do you lose focus the most?"
      questionIndex={4}
      totalQuestions={6}
      options={[
        { emoji: '🌅', label: 'Mornings' },
        { emoji: '☁️', label: 'During the day' },
        { emoji: '🌆', label: 'Evenings' },
        { emoji: '🌑', label: 'All day' },
        { emoji: '❓', label: 'Not sure' },
      ]}
      onSelect={(label) => { updateField('userWorstTime', Array.isArray(label) ? label.join(', ') : label); goNext(); }}
    />
  );
}
