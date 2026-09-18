import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';
import { PawsMascot } from '../../components/PawsMascot';
import { TypewriterTitle } from '../../components/TypewriterTitle';
import { useOnboarding } from '../../context/OnboardingContext';

const AMBITIONS = [
  { emoji: '🏗️', label: 'Build something', desc: 'A business, a product, a side project' },
  { emoji: '🎸', label: 'Learn a skill', desc: 'A language, instrument, or craft' },
  { emoji: '💪', label: 'Get fit', desc: 'Health, energy, and physical strength' },
  { emoji: '📚', label: 'Read and think', desc: 'Books, ideas, and deep thinking' },
  { emoji: '👨‍👩‍👧', label: 'Be present', desc: 'With people who matter to you' },
  { emoji: '🎨', label: 'Create', desc: 'Music, art, writing, content' },
];

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen1A({ goNext }: Props) {
  const { updateField } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(null);
  const [headerDone, setHeaderDone] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);

  React.useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -6, duration: 1200, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, [floatAnim]);

  const handleChar = useCallback((_index: number, char: string) => {
    if (char === ' ' || char === '?') return;
    Haptics.selectionAsync().catch(() => {});
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const handleHeaderComplete = useCallback(() => {
    setHeaderDone(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, []);

  const handleSelect = useCallback((label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelected(label);
    updateField('userAmbition', label);
    setTimeout(goNext, 250);
  }, [updateField, goNext]);

  return (
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={st.container}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <PawsMascot mood="meditating" size={120} style={{ alignSelf: 'center' }} />
      </Animated.View>

      <View style={st.titleWrap}>
        <TypewriterTitle
          text="What do you most want to do with your time?"
          style={st.title}
          delay={250}
          speed={45}
          onChar={handleChar}
          onComplete={handleHeaderComplete}
        />
      </View>

      <View style={st.grid}>
        {AMBITIONS.map((a, i) => (
          <MotiView
            key={a.label}
            style={st.cardWrap}
            from={{ opacity: 0, translateY: 24 }}
            animate={{
              opacity: headerDone ? 1 : 0,
              translateY: headerDone ? 0 : 24,
            }}
            transition={{
              type: 'timing',
              duration: 320,
              delay: headerDone ? 80 + i * 70 : 0,
            }}
          >
            <TouchableOpacity
              style={[st.card, selected === a.label && st.cardSelected]}
              onPress={() => handleSelect(a.label)}
              activeOpacity={0.7}
              disabled={!headerDone}
            >
              <Text style={st.cardEmoji}>{a.emoji}</Text>
              <Text style={[st.cardLabel, selected === a.label && st.cardLabelSelected]}>{a.label}</Text>
              <Text style={st.cardDesc}>{a.desc}</Text>
            </TouchableOpacity>
          </MotiView>
        ))}
      </View>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  titleWrap: { minHeight: 80, justifyContent: 'center', marginTop: 16, marginBottom: 24 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#1C1208', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  cardWrap: { width: '47%' },
  card: { backgroundColor: '#EDE9E0', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  cardSelected: { borderColor: '#D4820A', backgroundColor: '#FFF8F0' },
  cardEmoji: { fontSize: 28, marginBottom: 8 },
  cardLabel: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#1C1208', textAlign: 'center' },
  cardLabelSelected: { color: '#D4820A' },
  cardDesc: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#8A7A60', textAlign: 'center', marginTop: 4 },
});
