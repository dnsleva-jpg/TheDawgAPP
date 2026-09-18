import React from 'react';
import { QuestionScreen } from './QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen11({ goNext }: Props) {
  const { updateField } = useOnboarding();
  return (
    <QuestionScreen
      title="Have you tried to improve your focus before?"
      questionIndex={5}
      totalQuestions={6}
      options={[
        { emoji: '💪', label: "Yes, didn't stick" },
        { emoji: '👍', label: 'Yes, briefly worked' },
        { emoji: '🙏', label: 'No, first time' },
      ]}
      onSelect={(label) => { updateField('userPriorAttempt', Array.isArray(label) ? label.join(', ') : label); goNext(); }}
    />
  );
}
