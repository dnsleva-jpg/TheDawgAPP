import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { PawsMascot } from '../../components/PawsMascot';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen31({ goNext }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }).start();
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -6, duration: 1200, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, [fadeAnim, floatAnim]);

  return (
    <View style={st.container}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
        <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
          <PawsMascot mood="celebrate" size={120} style={{ alignSelf: 'center' }} />
        </Animated.View>

        <Text style={st.title}>Your plan is ready.</Text>
        <Text style={st.body}>
          90 days of daily challenges, focus tests, and smart blockers — personalized for you.
        </Text>

        <View style={st.stats}>
          <View style={st.statCard}>
            <Text style={st.statNumber}>90</Text>
            <Text style={st.statLabel}>days</Text>
          </View>
          <View style={st.statCard}>
            <Text style={st.statNumber}>3</Text>
            <Text style={st.statLabel}>tools</Text>
          </View>
          <View style={st.statCard}>
            <Text style={st.statNumber}>1</Text>
            <Text style={st.statLabel}>Paws</Text>
          </View>
        </View>

        <Text style={st.btn} onPress={goNext}>See my plan</Text>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#1C1208', textAlign: 'center', marginTop: 16 },
  body: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: 24 },
  stats: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#EDE9E0', borderRadius: 16, padding: 16, alignItems: 'center' },
  statNumber: { fontFamily: 'Outfit_800ExtraBold', fontSize: 32, color: '#D4820A' },
  statLabel: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60', marginTop: 2 },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', width: '100%', overflow: 'hidden' },
});
