import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen24({ goNext }: Props) {
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const factsOpacity = useRef(new Animated.Value(0)).current;
  const hookOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(factsOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(hookOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [titleOpacity, factsOpacity, hookOpacity]);

  return (
    <View style={st.container}>
      <Animated.Text style={[st.title, { opacity: titleOpacity }]}>
        You're not addicted.{'\n'}You're outnumbered.
      </Animated.Text>

      <Animated.View style={[st.facts, { opacity: factsOpacity }]}>
        <View style={st.factRow}>
          <Text style={st.factText}>TikTok employs <Text style={st.bold}>10,000+ engineers</Text> to keep you scrolling</Text>
        </View>
        <View style={st.factRow}>
          <Text style={st.factText}>Their algorithm learns your brain in under <Text style={st.bold}>30 minutes</Text></Text>
        </View>
        <View style={st.factRow}>
          <Text style={st.factText}>Big Tech makes <Text style={st.bold}>$350 billion</Text> a year selling your attention</Text>
        </View>
        <View style={st.factRow}>
          <Text style={st.factText}>Your attention span has dropped to <Text style={st.bold}>8 seconds</Text> — less than a goldfish</Text>
        </View>
      </Animated.View>

      <Animated.View style={{ opacity: hookOpacity, width: '100%', alignItems: 'center' }}>
        <Text style={st.hook}>You were never supposed to win this fight alone.</Text>
        <Text style={st.btn} onPress={goNext}>Continue</Text>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#1C1208', textAlign: 'center', marginBottom: 28 },
  facts: { gap: 12, marginBottom: 24 },
  factRow: { backgroundColor: '#EDE9E0', borderRadius: 14, padding: 16 },
  factText: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#1C1208', lineHeight: 22 },
  bold: { fontFamily: 'Outfit_800ExtraBold', color: '#D4820A' },
  hook: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#E74C3C', textAlign: 'center', marginBottom: 20 },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', width: '100%', overflow: 'hidden' },
});
