import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AnimatedPaws } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen25({ goNext }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }).start();
  }, [fadeAnim]);

  return (
    <View style={st.container}>
      <Animated.View style={{ opacity: fadeAnim, width: '100%', alignItems: 'center' }}>
        <Text style={st.title}>Blocking doesn't work.{'\n'}Measuring does.</Text>

        <View style={st.comparison}>
          <View style={st.badRow}>
            <Text style={st.badX}>✕</Text>
            <Text style={st.badText}><Text style={st.badBold}>App blockers</Text> — you unblock them</Text>
          </View>
          <View style={st.badRow}>
            <Text style={st.badX}>✕</Text>
            <Text style={st.badText}><Text style={st.badBold}>Screen time</Text> — knowing doesn't change behavior</Text>
          </View>
          <View style={st.badRow}>
            <Text style={st.badX}>✕</Text>
            <Text style={st.badText}><Text style={st.badBold}>Willpower</Text> — you're outgunned by design</Text>
          </View>
        </View>

        <View style={st.goodCard}>
          <AnimatedPaws state="focus" size={56} />
          <View style={st.goodText}>
            <Text style={st.goodTitle}>Do Nothin' measures your focus.</Text>
            <Text style={st.goodBody}>Camera-verified. Science-backed. Then retrains it with daily challenges.</Text>
          </View>
        </View>

        <Text style={st.btn} onPress={goNext}>Continue</Text>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: '#1C1208', textAlign: 'center', marginBottom: 28 },
  comparison: { width: '100%', gap: 12, marginBottom: 24 },
  badRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  badX: { fontFamily: 'Outfit_800ExtraBold', fontSize: 18, color: '#E74C3C', marginTop: 1 },
  badText: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', flex: 1, lineHeight: 22 },
  badBold: { fontFamily: 'Outfit_700Bold', color: '#1C1208' },
  goodCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFF8F0', borderRadius: 16, borderWidth: 1.5, borderColor: '#D4820A', padding: 16, width: '100%', marginBottom: 24 },
  goodText: { flex: 1 },
  goodTitle: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#D4820A' },
  goodBody: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60', marginTop: 4, lineHeight: 18 },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', width: '100%', overflow: 'hidden' },
});
