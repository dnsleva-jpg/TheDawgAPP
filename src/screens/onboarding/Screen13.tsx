import React from 'react';
import { QuestionScreen } from './QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen13({ goNext }: Props) {
  const { updateField } = useOnboarding();
  return (
    <QuestionScreen
      title="How old are you?"
      questionIndex={6}
      totalQuestions={6}
      options={[
        { label: 'Under 18' },
        { label: '18–24' },
        { label: '25–34' },
        { label: '35–44' },
        { label: '45–54' },
        { label: '55+' },
      ]}
      onSelect={(label) => { updateField('userAge', Array.isArray(label) ? label.join(', ') : label); goNext(); }}
    />
  );
}
