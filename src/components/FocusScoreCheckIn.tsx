import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/designSystem';
import {
  FOCUS_SCORE_QUESTIONS,
  computeFocusScore,
  getSmartSuggestion,
  saveDailyCheckIn,
  gradeColor,
  type CheckInAnswers,
  type CheckInAnswer,
  type DailyCheckIn,
  type SmartSuggestion,
} from '../utils/focusScoreService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FocusScoreCheckInProps {
  completedSessionYesterday: boolean;
  onComplete: (checkIn: DailyCheckIn) => void;
  onSkip: () => void;
}

type PartialAnswers = Partial<CheckInAnswers>;

export function FocusScoreCheckIn({
  completedSessionYesterday,
  onComplete,
  onSkip,
}: FocusScoreCheckInProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<PartialAnswers>({});
  const [result, setResult] = useState<{ score: number; grade: string; suggestion: SmartSuggestion } | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleAnswer = useCallback(
    (value: CheckInAnswer) => {
      if (transitioning) return; // Prevent double-tap during animation
      setTransitioning(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const question = FOCUS_SCORE_QUESTIONS[currentQ];
      const newAnswers = { ...answers, [question.key]: value };
      setAnswers(newAnswers);

      // Auto-advance after 200ms
      setTimeout(() => {
        if (currentQ < FOCUS_SCORE_QUESTIONS.length - 1) {
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => setTransitioning(false));

          setCurrentQ(currentQ + 1);
        } else {
          // All questions answered — compute score
          const fullAnswers = newAnswers as CheckInAnswers;
          const { score, grade } = computeFocusScore(fullAnswers, completedSessionYesterday);
          const suggestion = getSmartSuggestion(fullAnswers);

          setResult({ score, grade, suggestion });

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.timing(scoreAnim, {
            toValue: score,
            duration: 1200,
            useNativeDriver: false,
          }).start();
        }
      }, 200);
    },
    [currentQ, answers, completedSessionYesterday, fadeAnim, scoreAnim, transitioning],
  );

  const handleDone = useCallback(async () => {
    if (!result) return;

    const fullAnswers = answers as CheckInAnswers;
    const today = new Date().toISOString().split('T')[0];

    const checkIn: DailyCheckIn = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: today,
      completedAt: Date.now(),
      ...fullAnswers,
      focusScore: result.score,
      grade: result.grade,
      completedSessionYesterday,
    };

    await saveDailyCheckIn(checkIn);
    onComplete(checkIn);
  }, [result, answers, completedSessionYesterday, onComplete]);

  // ─── Result Screen ──────────────────────────────────────

  if (result) {
    const color = gradeColor(result.grade);

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>YOUR FOCUS SCORE</Text>

          <AnimatedScore targetScore={result.score} color={color} />

          <View style={[styles.gradeBadge, { backgroundColor: color + '22', borderColor: color }]}>
            <Text style={[styles.gradeText, { color }]}>{result.grade}</Text>
          </View>

          {completedSessionYesterday && (
            <Text style={styles.bonusText}>+5 session bonus applied</Text>
          )}

          <View style={styles.suggestionCard}>
            <Text style={styles.suggestionEmoji}>{result.suggestion.emoji}</Text>
            <Text style={styles.suggestionText}>{result.suggestion.text}</Text>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={handleDone} activeOpacity={0.8}>
            <Text style={styles.doneButtonText}>GOT IT</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Question Screen ────────────────────────────────────

  const question = FOCUS_SCORE_QUESTIONS[currentQ];
  const selectedValue = answers[question.key];

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progressRow}>
        {FOCUS_SCORE_QUESTIONS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i <= currentQ && styles.progressDotActive,
              i < currentQ && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>

      <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
        <Text style={styles.questionNumber}>
          {currentQ + 1} of {FOCUS_SCORE_QUESTIONS.length}
        </Text>
        <Text style={styles.questionText}>{question.question}</Text>

        <View style={styles.optionsContainer}>
          {question.options.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleAnswer(option.value)}
              activeOpacity={0.7}
              style={[
                styles.optionCard,
                selectedValue === option.value && styles.optionCardSelected,
              ]}
            >
              <Text
                style={[
                  styles.optionLabel,
                  selectedValue === option.value && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip for now</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Animated Score Counter ───────────────────────────────

function AnimatedScore({ targetScore, color }: { targetScore: number; color: string }) {
  const [displayScore, setDisplayScore] = useState(0);
  const animRef = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const listener = animRef.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });

    Animated.timing(animRef, {
      toValue: targetScore,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    return () => animRef.removeListener(listener);
  }, [targetScore, animRef]);

  return (
    <Text style={[styles.scoreNumber, { color }]}>{displayScore}</Text>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },

  // Progress
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bgSurfaceLight,
  },
  progressDotActive: {
    backgroundColor: COLORS.coral,
    width: 24,
  },
  progressDotCompleted: {
    backgroundColor: COLORS.coral,
    width: 8,
    opacity: 0.5,
  },

  // Question
  questionContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 40,
  },
  questionNumber: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  questionText: {
    fontFamily: FONTS.headingBold,
    fontSize: 26,
    color: COLORS.textPrimary,
    lineHeight: 34,
    marginBottom: 32,
  },

  // Options
  optionsContainer: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: COLORS.coral,
    backgroundColor: 'rgba(255, 77, 106, 0.08)',
  },
  optionLabel: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  optionLabelSelected: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.bodyMedium,
  },

  // Skip
  skipButton: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  skipText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // Result
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  resultLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  scoreNumber: {
    fontFamily: FONTS.display,
    fontSize: 96,
    lineHeight: 96,
    marginBottom: 8,
  },
  gradeBadge: {
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  gradeText: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
  },
  bonusText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.verified,
    marginBottom: 32,
  },

  // Suggestion
  suggestionCard: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 20,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 32,
  },
  suggestionEmoji: {
    fontSize: 28,
  },
  suggestionText: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },

  // Done button
  doneButton: {
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    paddingHorizontal: 48,
    ...SHADOWS.coralButton,
  },
  doneButtonText: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: '#1C1208',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
