import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPaws } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen30({ goNext }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -6, duration: 1200, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, [floatAnim]);

  return (
    <View style={st.container}>
      <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
        <AnimatedPaws state="focus" size={140} style={{ alignSelf: 'center' }} />
      </Animated.View>

      <Text style={st.title}>Time for your first test.</Text>
      <Text style={st.body}>
        Paws needs your camera to measure your blinks and stillness. Nothing is recorded or stored.
      </Text>

      <View style={st.featureRow}>
        <Ionicons name="eye-outline" size={20} color="#D4820A" />
        <Text style={st.featureText}>Tracks blink rate in real time</Text>
      </View>
      <View style={st.featureRow}>
        <Ionicons name="body-outline" size={20} color="#D4820A" />
        <Text style={st.featureText}>Detects micro-movements</Text>
      </View>
      <View style={st.featureRow}>
        <Ionicons name="lock-closed-outline" size={20} color="#D4820A" />
        <Text style={st.featureText}>100% on-device. Nothing leaves your phone.</Text>
      </View>

      <TouchableOpacity style={st.btn} onPress={goNext} activeOpacity={0.8}>
        <Ionicons name="camera-outline" size={20} color="#F7F4EE" />
        <Text style={st.btnText}>Enable Camera & Start</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={goNext} activeOpacity={0.7}>
        <Text style={st.skip}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: '#1C1208', textAlign: 'center', marginTop: 16 },
  body: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, paddingLeft: 8 },
  featureText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#1C1208' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, marginTop: 24 },
  btnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE' },
  skip: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#B0A090', textAlign: 'center', marginTop: 16 },
});
