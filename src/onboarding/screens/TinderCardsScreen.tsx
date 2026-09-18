import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder, Dimensions } from 'react-native';
import { COLORS, FONTS, RADIUS } from '../../constants/designSystem';
import { OnboardingLayout } from '../components/OnboardingLayout';
import { saveOnboardingData } from '../onboardingStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const CARDS = [
  "I've opened Instagram, closed it, then opened it again 10 seconds later.",
  'I check my phone first thing in the morning before I even get out of bed.',
  "I've tried to 'detox' before but lasted less than a day.",
  'I can feel my attention span getting shorter every year.',
  "I know I have a problem but I don't know how to measure if I'm getting better.",
];

interface TinderCardsScreenProps {
  onNext: () => void;
  screenIndex: number;
}

export function TinderCardsScreen({ onNext, screenIndex }: TinderCardsScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [agreements, setAgreements] = useState<string[]>([]);
  const position = useRef(new Animated.ValueXY()).current;

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;
  const agreementsRef = useRef(agreements);
  agreementsRef.current = agreements;

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp',
  });
  const leftOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const rightOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    const idx = currentIndexRef.current;
    const card = CARDS[idx];
    const newAgreements = direction === 'right' ? [...agreementsRef.current, card] : [...agreementsRef.current];
    setAgreements(newAgreements);
    agreementsRef.current = newAgreements;

    if (idx >= CARDS.length - 1) {
      saveOnboardingData({ tinderCardAgreements: newAgreements });
      onNext();
    } else {
      const nextIdx = idx + 1;
      setCurrentIndex(nextIdx);
      currentIndexRef.current = nextIdx;
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: SCREEN_WIDTH + 100, y: gesture.dy },
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            handleSwipeComplete('right');
          });
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.timing(position, {
            toValue: { x: -SCREEN_WIDTH - 100, y: gesture.dy },
            duration: 250,
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            handleSwipeComplete('left');
          });
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <OnboardingLayout screenIndex={screenIndex} scrollable={false}>
      <Text style={styles.headline}>Swipe right if this sounds like you.</Text>
      <Text style={styles.subheadline}>
        Swipe ✓ to agree, ✗ to dismiss
      </Text>

      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {currentIndex + 1} of {CARDS.length}
        </Text>
      </View>

      <View style={styles.cardArea}>
        {currentIndex < CARDS.length && (
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.card,
              {
                transform: [
                  { translateX: position.x },
                  { translateY: position.y },
                  { rotate },
                ],
              },
            ]}
          >
            <Animated.View style={[styles.indicatorLeft, { opacity: leftOpacity }]}>
              <Text style={styles.indicatorTextLeft}>✗</Text>
            </Animated.View>
            <Animated.View style={[styles.indicatorRight, { opacity: rightOpacity }]}>
              <Text style={styles.indicatorTextRight}>✓</Text>
            </Animated.View>

            <Text style={styles.quoteOpen}>"</Text>
            <Text style={styles.cardText}>{CARDS[currentIndex]}</Text>
            <Text style={styles.quoteClose}>"</Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.swipeHint}>
        <Text style={styles.hintLeft}>← Nope</Text>
        <Text style={styles.hintRight}>That's me →</Text>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subheadline: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  counter: {
    alignItems: 'center',
    marginBottom: 24,
  },
  counterText: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: SCREEN_WIDTH - 64,
    backgroundColor: COLORS.bgSurface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    borderWidth: 1,
    borderColor: 'rgba(28,18,8,0.06)',
  },
  indicatorLeft: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E74C3C',
  },
  indicatorTextLeft: {
    fontSize: 20,
    color: '#E74C3C',
    fontWeight: '700',
  },
  indicatorRight: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#2ECC71',
  },
  indicatorTextRight: {
    fontSize: 20,
    color: '#2ECC71',
    fontWeight: '700',
  },
  quoteOpen: {
    fontFamily: FONTS.display,
    fontSize: 48,
    color: COLORS.coral,
    opacity: 0.4,
    position: 'absolute',
    top: 12,
    left: 20,
  },
  quoteClose: {
    fontFamily: FONTS.display,
    fontSize: 48,
    color: COLORS.coral,
    opacity: 0.4,
    position: 'absolute',
    bottom: 4,
    right: 20,
  },
  cardText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 18,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 8,
  },
  swipeHint: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  hintLeft: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  hintRight: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
