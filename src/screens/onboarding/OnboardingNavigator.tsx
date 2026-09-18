import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// On-screen error boundary so a crash inside an onboarding screen surfaces
// the actual JS error instead of just whitescreening. Logs to console too.
class OnboardingErrorBoundary extends React.Component<
  { screenId: string; onReset: () => void; children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: any) {
    // eslint-disable-next-line no-console
    console.log('[OnboardingErrorBoundary] CRASH on', this.props.screenId, '\n', error?.message, '\n', error?.stack, '\n', info?.componentStack);
  }
  componentDidUpdate(prev: any) {
    if (prev.screenId !== this.props.screenId && this.state.error) {
      this.setState({ error: null });
    }
  }
  render() {
    if (this.state.error) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#1C1208' }} contentContainerStyle={{ padding: 24, paddingTop: 80 }}>
          <Text style={{ color: '#DC2626', fontFamily: 'Outfit_800ExtraBold', fontSize: 20, marginBottom: 8 }}>
            Crash on screen: {this.props.screenId}
          </Text>
          <Text selectable style={{ color: '#FAF6EE', fontFamily: 'Outfit_700Bold', fontSize: 14, marginBottom: 12 }}>
            {this.state.error.message}
          </Text>
          <Text selectable style={{ color: '#FAF6EE', fontFamily: 'Outfit_400Regular', fontSize: 11, lineHeight: 16 }}>
            {this.state.error.stack}
          </Text>
          <TouchableOpacity
            onPress={() => { this.setState({ error: null }); this.props.onReset(); }}
            style={{ marginTop: 24, backgroundColor: '#D4820A', borderRadius: 12, padding: 16 }}
          >
            <Text style={{ color: '#FAF6EE', fontFamily: 'Outfit_700Bold', textAlign: 'center' }}>Back to previous screen</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }
    return this.props.children as any;
  }
}

// Screen imports
import { ScreenIntro } from './ScreenIntro';
import { ScreenHealthyApps } from './ScreenHealthyApps';
import { Screen1A } from './Screen1A';
import { Screen2 } from './Screen2';
import { Screen2B } from './Screen2B';
import { Screen2C } from './Screen2C';
import { Screen2D } from './Screen2D';
import { Screen3 } from './Screen3';
import { Screen4 } from './Screen4';
import { Screen5 } from './Screen5';
import { Screen6 } from './Screen6';
import { Screen7 } from './Screen7';
import { Screen8 } from './Screen8';
import { Screen9 } from './Screen9';
import { Screen10 } from './Screen10';
import { Screen11 } from './Screen11';
import { Screen12 } from './Screen12';
import { Screen12M } from './Screen12M';
import { Screen12A } from './Screen12A';
import { Screen12B } from './Screen12B';
import { Screen12C } from './Screen12C';
import { Screen13 } from './Screen13';
import { Screen14 } from './Screen14';
import { Screen15 } from './Screen15';
import { Screen16 } from './Screen16';
import { ScreenScrollStory } from './ScreenScrollStory';
import { Screen17 } from './Screen17';
import { Screen18 } from './Screen18';
import { Screen19 } from './Screen19';
import { Screen19B } from './Screen19B';
import { Screen20 } from './Screen20';
import { Screen21 } from './Screen21';
import { Screen22 } from './Screen22';
import { Screen22T } from './Screen22T';
import { Screen24 } from './Screen24';
import { Screen25 } from './Screen25';
import { Screen26 } from './Screen26';
import { Screen27 } from './Screen27';
import { Screen28 } from './Screen28';
import { Screen29 } from './Screen29';
import { ScreenIfThen } from './ScreenIfThen';
import { ScreenGuidedDemo } from './ScreenGuidedDemo';
import { ScreenBuildingPlan } from './ScreenBuildingPlan';
import { ScreenStuckPaws } from './ScreenStuckPaws';
import { Screen32B } from './Screen32B';
import { ScreenHowItWorks } from './ScreenHowItWorks';
import { ScreenTimeReveal } from './ScreenTimeReveal';
import { ScreenQuestionnaire } from './ScreenQuestionnaire';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SCREEN_ORDER = [
  // Phase 1: Hook
  'Intro',
  // Phase 2: Engage → Chain climax (Screen2C tap captures hours anchor)
  '2', '2B', '2C',
  // Phase 3: YIKES (personalized to their 2C tap) → counter → video-style dots → real Apple data → vision pivot
  '17', '19', '21', 'ScreenTimeReveal', '22',
  // Phase 4: Reframe — "brain isn't broken / Until now"
  '5',
  // Phase 5: Solution — Measure deep-dive, then 4-pillar auto-play
  '12M', 'HowItWorks',
  // Phase 6: Personalize — single-page 5-question questionnaire
  'Questionnaire',
  // Phase 7: Analyze ("Building your plan...") + paywall
  'BuildingPlan', '32B',
] as const;

type ScreenId = (typeof SCREEN_ORDER)[number];

const HIDE_PROGRESS = new Set<ScreenId>(['Intro', '1A', '2', '2B', 'ScrollStory', '17', '18', '19B', '10', 'BuildingPlan', '32B']);
const HIDE_BACK = new Set<ScreenId>(['Intro', '2', '2B']);

interface Props {
  onComplete: () => void;
}

export function OnboardingNavigator({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [currentIdx, setCurrentIdx] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const currentScreen = SCREEN_ORDER[currentIdx];
  const totalScreens = SCREEN_ORDER.length;

  const animateTransition = useCallback((cb: () => void, forward = true) => {
    // Fade out + slight slide + scale down
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: forward ? -30 : 30, duration: 150, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      cb();
      // Reset position for incoming screen
      slideAnim.setValue(forward ? 30 : -30);
      scaleAnim.setValue(0.97);
      // Fade in + slide in + scale up
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 65, friction: 11, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim, scaleAnim]);

  const goNext = useCallback((targetId?: ScreenId) => {
    if (targetId) {
      const idx = SCREEN_ORDER.indexOf(targetId);
      if (idx >= 0) {
        animateTransition(() => setCurrentIdx(idx), true);
        return;
      }
    }
    if (currentIdx < totalScreens - 1) {
      animateTransition(() => setCurrentIdx((i) => i + 1), true);
    }
  }, [currentIdx, totalScreens, animateTransition]);

  const goBack = useCallback(() => {
    if (currentIdx > 0) {
      animateTransition(() => setCurrentIdx((i) => i - 1), false);
    }
  }, [currentIdx, animateTransition]);

  const showProgress = !HIDE_PROGRESS.has(currentScreen);
  const showBack = !HIDE_BACK.has(currentScreen) && currentIdx > 0;
  const progress = (currentIdx + 1) / totalScreens;

  const renderScreen = () => {
    const props = { goNext, goBack, onComplete };
    switch (currentScreen) {
      case 'Intro': return <ScreenIntro {...props} />;
      case '1A': return <Screen1A {...props} />;
      case '2': return <Screen2 {...props} />;
      case '2B': return <Screen2B {...props} />;
      case '2C': return <Screen2C {...props} />;
      case '2D': return <Screen2D {...props} />;
      case '3': return <Screen3 {...props} />;
      case '4': return <Screen4 {...props} />;
      case '5': return <Screen5 {...props} />;
      case '6': return <Screen6 {...props} />;
      case '7': return <Screen7 {...props} />;
      case '8': return <Screen8 {...props} />;
      case 'HealthyApps': return <ScreenHealthyApps {...props} />;
      case '9': return <Screen9 {...props} />;
      case '10': return <Screen10 {...props} />;
      case '11': return <Screen11 {...props} />;
      case '12': return <Screen12 {...props} />;
      case '12M': return <Screen12M {...props} />;
      case '12A': return <Screen12A {...props} />;
      case '12B': return <Screen12B {...props} />;
      case '12C': return <Screen12C {...props} />;
      case '13': return <Screen13 {...props} />;
      case '14': return <Screen14 {...props} />;
      case '15': return <Screen15 {...props} />;
      case '16': return <Screen16 {...props} />;
      case 'ScrollStory': return <ScreenScrollStory {...props} />;
      case '17': return <Screen17 {...props} />;
      case '18': return <Screen18 {...props} />;
      case '19': return <Screen19 {...props} />;
      case '19B': return <Screen19B {...props} />;
      case '20': return <Screen20 {...props} />;
      case '21': return <Screen21 {...props} />;
      case '22': return <Screen22 {...props} />;
      case '22T': return <Screen22T {...props} />;
      case '24': return <Screen24 {...props} />;
      case '25': return <Screen25 {...props} />;
      case '26': return <Screen26 {...props} />;
      case '27': return <Screen27 {...props} />;
      case '28': return <Screen28 {...props} />;
      case '29': return <Screen29 {...props} />;
      case 'IfThen': return <ScreenIfThen {...props} />;
      case 'GuidedDemo': return <ScreenGuidedDemo {...props} />;
      case 'StuckPaws': return <ScreenStuckPaws {...props} />;
      case 'HowItWorks': return <ScreenHowItWorks {...props} />;
      case 'ScreenTimeReveal': return <ScreenTimeReveal {...props} />;
      case 'Questionnaire': return <ScreenQuestionnaire {...props} />;
      case 'BuildingPlan': return <ScreenBuildingPlan {...props} />;
      case '32B': return <Screen32B {...props} />;
      default: return null;
    }
  };

  return (
    <View style={[st.root, { paddingTop: insets.top }]}>
      {/* Progress bar */}
      {showProgress && (
        <View style={st.progressTrack}>
          <View style={[st.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      )}

      {/* Back arrow */}
      {showBack && (
        <TouchableOpacity style={st.backButton} onPress={goBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color="#1C1208" />
        </TouchableOpacity>
      )}

      {/* Screen content with slide + fade + scale transition */}
      <Animated.View style={[st.screenContainer, {
        opacity: fadeAnim,
        transform: [
          { translateX: slideAnim },
          { scale: scaleAnim },
        ],
      }]}>
        <OnboardingErrorBoundary screenId={currentScreen} onReset={goBack}>
          {renderScreen()}
        </OnboardingErrorBoundary>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F7F4EE',
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#EDE9E0',
    borderRadius: 100,
    marginHorizontal: 24,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4820A',
    borderRadius: 100,
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  screenContainer: {
    flex: 1,
  },
});
