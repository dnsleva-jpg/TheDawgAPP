import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  SafeAreaView,
  Linking,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../constants/designSystem';
import {
  saveInterception,
  createInterception,
  getAppInfo,
} from '../utils/shieldService';
import {
  pickIntervention,
  generateMathProblem,
  EMOTIONS,
  BODY_SCAN_STEPS,
  type Intervention,
  type InterventionType,
  type MathProblem,
} from '../utils/interventionService';

interface InterceptionScreenProps {
  appId: string;
  onDismiss: () => void;
}

export function InterceptionScreen({ appId, onDismiss }: InterceptionScreenProps) {
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [done, setDone] = useState(false);

  // Breathing state
  const [currentPhase, setCurrentPhase] = useState(0);
  const circleScale = useRef(new Animated.Value(0.6)).current;
  const circleOpacity = useRef(new Animated.Value(0.3)).current;

  // Math state
  const [mathProblem, setMathProblem] = useState<MathProblem | null>(null);
  const [mathAnswer, setMathAnswer] = useState('');
  const [mathCorrect, setMathCorrect] = useState(false);

  // Emotion state
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);

  // Intention state
  const [intention, setIntention] = useState('');

  // Body scan state
  const [bodyScanStep, setBodyScanStep] = useState(0);

  const appInfo = getAppInfo(appId);

  // ─── Initialize intervention ─────────────────────────

  useEffect(() => {
    pickIntervention().then((iv) => {
      setIntervention(iv);
      setSecondsLeft(iv.durationSec);
      if (iv.type === 'math_problem') {
        setMathProblem(generateMathProblem());
      }
    });
  }, []);

  // ─── Countdown timer ─────────────────────────────────

  useEffect(() => {
    if (!intervention || done) return;

    // Math and emotion don't use a timer — they're input-driven
    if (intervention.type === 'math_problem' || intervention.type === 'emotion_check') return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setDone(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }

        // Breathing phases
        if (intervention.type === 'breathing') {
          const elapsed = intervention.durationSec - (prev - 1);
          setCurrentPhase(Math.floor(elapsed / 4) % 4);
        }

        // Body scan steps
        if (intervention.type === 'body_scan') {
          const elapsed = intervention.durationSec - (prev - 1);
          const stepDuration = intervention.durationSec / BODY_SCAN_STEPS.length;
          setBodyScanStep(Math.min(
            Math.floor(elapsed / stepDuration),
            BODY_SCAN_STEPS.length - 1,
          ));
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [intervention, done]);

  // ─── Breathing circle animation ──────────────────────

  useEffect(() => {
    if (!intervention || intervention.type !== 'breathing' || done) return;

    const isExpanding = currentPhase === 0;
    const isShrinking = currentPhase === 2;

    if (isExpanding || isShrinking) {
      Animated.timing(circleScale, {
        toValue: isExpanding ? 1.0 : 0.6,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();

      Animated.timing(circleOpacity, {
        toValue: isExpanding ? 0.6 : 0.3,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [currentPhase, intervention, done, circleScale, circleOpacity]);

  // ─── Actions ──────────────────────────────────────────

  const handleProceed = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const interception = createInterception(appId, 'proceeded');
    await saveInterception(interception);

    if (appInfo.urlScheme) {
      try {
        const canOpen = await Linking.canOpenURL(appInfo.urlScheme);
        if (canOpen) await Linking.openURL(appInfo.urlScheme);
      } catch {}
    }
    onDismiss();
  }, [appId, appInfo.urlScheme, onDismiss]);

  const handleResist = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const interception = createInterception(appId, 'resisted');
    await saveInterception(interception);
    onDismiss();
  }, [appId, onDismiss]);

  // ─── Math check ───────────────────────────────────────

  const handleMathSubmit = useCallback(() => {
    if (!mathProblem) return;
    const parsed = parseInt(mathAnswer, 10);
    if (parsed === mathProblem.answer) {
      setMathCorrect(true);
      setDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setMathAnswer('');
      // Generate a new problem
      setMathProblem(generateMathProblem());
    }
  }, [mathAnswer, mathProblem]);

  // ─── Emotion select ───────────────────────────────────

  const handleEmotionSelect = useCallback((label: string) => {
    setSelectedEmotion(label);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      setDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 600);
  }, []);

  // ─── Intention submit ─────────────────────────────────

  const handleIntentionSubmit = useCallback(() => {
    if (intention.trim().length >= 3) {
      setDone(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [intention]);

  if (!intervention) return null;

  const BREATHING_PHASES = ['Breathe in...', 'Hold...', 'Breathe out...', 'Hold...'];

  // ─── Render intervention content ──────────────────────

  const renderIntervention = () => {
    switch (intervention.type) {
      case 'breathing':
        return (
          <View style={styles.circleContainer}>
            <Animated.View
              style={[
                styles.breathingCircle,
                { transform: [{ scale: circleScale }], opacity: circleOpacity },
              ]}
            />
            <View style={styles.circleInner}>
              {!done ? (
                <>
                  <Text style={styles.phaseText}>{BREATHING_PHASES[currentPhase]}</Text>
                  <Text style={styles.timerText}>{secondsLeft}s</Text>
                </>
              ) : (
                <>
                  <Text style={styles.doneEmoji}>✨</Text>
                  <Text style={styles.doneText}>Nice work</Text>
                </>
              )}
            </View>
          </View>
        );

      case 'emotion_check':
        return (
          <View style={styles.emotionContainer}>
            {!done ? (
              <>
                <Text style={styles.interventionTitle}>How are you feeling?</Text>
                <Text style={styles.interventionSub}>Be honest — no wrong answers</Text>
                <View style={styles.emotionGrid}>
                  {EMOTIONS.map((e) => (
                    <TouchableOpacity
                      key={e.label}
                      style={[
                        styles.emotionButton,
                        selectedEmotion === e.label && styles.emotionButtonSelected,
                      ]}
                      onPress={() => handleEmotionSelect(e.label)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.emotionEmoji}>{e.emoji}</Text>
                      <Text style={[
                        styles.emotionLabel,
                        selectedEmotion === e.label && styles.emotionLabelSelected,
                      ]}>{e.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emotionResult}>
                <Text style={styles.doneEmoji}>🪞</Text>
                <Text style={styles.doneText}>You feel {selectedEmotion?.toLowerCase()}</Text>
                <Text style={styles.interventionSub}>
                  {selectedEmotion === 'Good actually'
                    ? "Then you probably don't need this app right now."
                    : `Opening ${appInfo.label} won't fix that.`}
                </Text>
              </View>
            )}
          </View>
        );

      case 'math_problem':
        return (
          <View style={styles.mathContainer}>
            {!done ? (
              <>
                <Text style={styles.interventionTitle}>Solve to unlock</Text>
                <Text style={styles.mathQuestion}>{mathProblem?.question}</Text>
                <TextInput
                  style={styles.mathInput}
                  value={mathAnswer}
                  onChangeText={setMathAnswer}
                  keyboardType="number-pad"
                  placeholder="Your answer"
                  placeholderTextColor={COLORS.textDisabled}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleMathSubmit}
                />
                <TouchableOpacity
                  style={[styles.mathSubmit, !mathAnswer && styles.mathSubmitDisabled]}
                  onPress={handleMathSubmit}
                  disabled={!mathAnswer}
                  activeOpacity={0.8}
                >
                  <Text style={styles.mathSubmitText}>CHECK</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emotionResult}>
                <Text style={styles.doneEmoji}>✅</Text>
                <Text style={styles.doneText}>Correct</Text>
                <Text style={styles.interventionSub}>Your prefrontal cortex is awake now</Text>
              </View>
            )}
          </View>
        );

      case 'intention_prompt':
        return (
          <View style={styles.intentionContainer}>
            {!done ? (
              <>
                <Text style={styles.interventionTitle}>What do you need?</Text>
                <Text style={styles.interventionSub}>
                  Type what you actually need from {appInfo.label}
                </Text>
                <TextInput
                  style={styles.intentionInput}
                  value={intention}
                  onChangeText={setIntention}
                  placeholder={`"Check one message" or "Nothing, just bored"`}
                  placeholderTextColor={COLORS.textDisabled}
                  multiline
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.mathSubmit, intention.trim().length < 3 && styles.mathSubmitDisabled]}
                  onPress={handleIntentionSubmit}
                  disabled={intention.trim().length < 3}
                  activeOpacity={0.8}
                >
                  <Text style={styles.mathSubmitText}>CONTINUE</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.emotionResult}>
                <Text style={styles.doneEmoji}>🎯</Text>
                <Text style={styles.doneText}>Got it</Text>
                <Text style={styles.interventionSub}>
                  {intention.toLowerCase().includes('nothing') || intention.toLowerCase().includes('bored')
                    ? "Sounds like you don't actually need it."
                    : "Be intentional. Get in, get out."}
                </Text>
              </View>
            )}
          </View>
        );

      case 'body_scan':
        return (
          <View style={styles.bodyScanContainer}>
            {!done ? (
              <>
                <Text style={styles.interventionTitle}>{intervention.emoji}</Text>
                <Text style={styles.bodyScanPrompt}>
                  {BODY_SCAN_STEPS[bodyScanStep]}
                </Text>
                <Text style={styles.timerText}>{secondsLeft}s</Text>
                <View style={styles.bodyScanDots}>
                  {BODY_SCAN_STEPS.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.bodyScanDot,
                        i <= bodyScanStep && styles.bodyScanDotActive,
                      ]}
                    />
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emotionResult}>
                <Text style={styles.doneEmoji}>🧘</Text>
                <Text style={styles.doneText}>Present</Text>
                <Text style={styles.interventionSub}>You're back in your body</Text>
              </View>
            )}
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          {/* Shiba + App context */}
          <View style={styles.contextSection}>
            <Image
              source={require('../../assets/shiba/shiba-thriving.png')}
              style={styles.contextShiba}
              resizeMode="contain"
            />
            <View style={styles.contextCard}>
              <Text style={styles.contextEmoji}>{appInfo.emoji}</Text>
              <Text style={styles.contextText}>
                You were about to open{' '}
                <Text style={styles.contextAppName}>{appInfo.label}</Text>
              </Text>
            </View>
          </View>

          {/* Intervention */}
          <View style={styles.interventionArea}>
            {renderIntervention()}
          </View>

          {/* Action buttons */}
          {done ? (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.resistButton}
                onPress={handleResist}
                activeOpacity={0.8}
              >
                <Text style={styles.resistButtonText}>I DON'T NEED IT</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.proceedButton}
                onPress={handleProceed}
                activeOpacity={0.7}
              >
                <Text style={styles.proceedButtonText}>
                  Continue to {appInfo.label}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.waitText}>
              {intervention.type === 'math_problem'
                ? 'Solve the problem to continue'
                : intervention.type === 'emotion_check'
                  ? 'Tap how you feel'
                  : intervention.type === 'intention_prompt'
                    ? 'Type your intention to continue'
                    : `Take a moment. You'll have a choice in ${secondsLeft}s.`}
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: 40,
  },

  // Context
  contextSection: {
    alignItems: 'center',
    gap: 12,
  },
  contextShiba: {
    width: 64,
    height: 64,
  },
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.pill,
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 10,
  },
  contextEmoji: { fontSize: 20 },
  contextText: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  contextAppName: {
    fontFamily: FONTS.bodyBold,
    color: COLORS.textPrimary,
  },

  // Intervention area
  interventionArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  // Shared
  interventionTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 24,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  interventionSub: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },

  // Breathing
  circleContainer: {
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingCircle: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: COLORS.coral,
  },
  circleInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseText: {
    fontFamily: FONTS.headingMedium,
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  timerText: {
    fontFamily: FONTS.display,
    fontSize: 48,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  doneEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  doneText: {
    fontFamily: FONTS.headingBold,
    fontSize: 22,
    color: COLORS.textPrimary,
  },

  // Emotion
  emotionContainer: {
    alignItems: 'center',
    width: '100%',
  },
  emotionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  emotionButton: {
    width: '30%',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emotionButtonSelected: {
    borderColor: COLORS.coral,
    backgroundColor: COLORS.coral + '15',
  },
  emotionEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  emotionLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emotionLabelSelected: {
    color: COLORS.coral,
  },
  emotionResult: {
    alignItems: 'center',
  },

  // Math
  mathContainer: {
    alignItems: 'center',
    width: '100%',
  },
  mathQuestion: {
    fontFamily: FONTS.display,
    fontSize: 48,
    color: COLORS.textPrimary,
    marginBottom: 24,
    letterSpacing: 2,
  },
  mathInput: {
    width: '60%',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.input,
    paddingVertical: 14,
    paddingHorizontal: 20,
    fontFamily: FONTS.monoBold,
    fontSize: 24,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  mathSubmit: {
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    paddingHorizontal: 40,
    ...SHADOWS.coralButton,
  },
  mathSubmitDisabled: {
    backgroundColor: COLORS.bgSurfaceLight,
  },
  mathSubmitText: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    color: '#1C1208',
    letterSpacing: 1,
  },

  // Intention
  intentionContainer: {
    alignItems: 'center',
    width: '100%',
  },
  intentionInput: {
    width: '100%',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },

  // Body scan
  bodyScanContainer: {
    alignItems: 'center',
  },
  bodyScanPrompt: {
    fontFamily: FONTS.headingMedium,
    fontSize: 20,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 28,
  },
  bodyScanDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  bodyScanDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bgSurfaceLight,
  },
  bodyScanDotActive: {
    backgroundColor: COLORS.coral,
  },

  // Wait text
  waitText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },

  // Actions
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  resistButton: {
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.button,
    paddingVertical: 18,
    alignItems: 'center',
    ...SHADOWS.coralButton,
  },
  resistButtonText: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: '#1C1208',
    letterSpacing: 1.5,
  },
  proceedButton: {
    backgroundColor: 'transparent',
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.bgSurfaceLight,
  },
  proceedButtonText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
