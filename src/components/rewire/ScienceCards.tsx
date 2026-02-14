import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS as DS_COLORS, FONTS } from '../../constants/designSystem';

const CARDS = [
  'Your phone is designed like a slot machine. Same brain chemicals. Same addiction loop.',
  "Most people would rather be electrocuted than sit alone with their thoughts. You're training yourself to do what most can't.",
  'The average person picks up their phone 144 times a day. Each pickup is a hit of dopamine your brain is learning to depend on.',
  'Heavy phone users have the same brain changes as drug addicts. Not similar. The same.',
  '4 days of sitting still for 20 minutes improved attention by up to 10x on hard tasks.',
  '8 weeks of stillness practice physically changes 8 regions of your brain. Your brain is not fixed — it rebuilds based on what you do.',
  'When you scroll, your eyes literally forget to blink. Screen use drops blink rate by 60%. That\'s how deep the trance goes.',
  '91% of people who cut phone use for 2 weeks improved their focus, sleep, or mental health. 91%.',
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
