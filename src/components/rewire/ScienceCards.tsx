import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS as DS_COLORS, FONTS } from '../../constants/designSystem';

const CARDS = [
  'Your phone is designed like a slot machine. It targets the same reward pathways. Same loop.',
  "Most people would rather be electrocuted than sit alone with their thoughts. You're training yourself to do what most can't.",
  'The average person picks up their phone 144 times a day. Each pickup reinforces a habit loop your brain is learning to depend on.',
  'Research suggests heavy phone use can affect the same reward pathways as addictive substances.',
  'In one study, 4 days of sitting still for 20 minutes improved attention on difficult tasks.',
  'Research suggests regular mindfulness practice can positively affect multiple areas of the brain. Your brain adapts based on what you do.',
  'When you scroll, your eyes literally forget to blink. Screen use drops blink rate by 60%. That\'s how deep the trance goes.',
  '91% of people in one study who cut phone use for 2 weeks reported improvements in focus, sleep, or well-being.',
];

export function ScienceCards() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>THE SCIENCE</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CARDS.map((text, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.accentLine} />
            <Text style={styles.cardText}>{text}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    fontSize: 22,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
  },
  scrollContent: {
    gap: 12,
    paddingRight: 24,
  },
  card: {
    width: 200,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    paddingLeft: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
    backgroundColor: DS_COLORS.coral,
  },
  cardText: {
    fontSize: 14,
    fontFamily: FONTS.headingMedium,
    color: DS_COLORS.textPrimary,
    lineHeight: 20,
  },
});
