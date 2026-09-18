import React from 'react';
import { QuestionScreen } from './QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen9({ goNext }: Props) {
  const { updateField } = useOnboarding();
  return (
    <QuestionScreen
      title="Which best describes you?"
      questionIndex={3}
      totalQuestions={6}
      options={[
        { emoji: '🤠', label: 'Builder / Creator' },
        { emoji: '🤓', label: 'Knowledge worker' },
        { emoji: '🏃', label: 'Athlete / Active' },
        { emoji: '🎓', label: 'Student' },
        { emoji: '👥', label: 'Just trying to live better' },
      ]}
      onSelect={(label) => { updateField('userIdentity', Array.isArray(label) ? label.join(', ') : label); goNext(); }}
    />
  );
}
