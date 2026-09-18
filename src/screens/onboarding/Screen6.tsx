import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AnimatedPaws } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen6({ goNext }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -6, duration: 1200, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ])).start();
  }, [floatAnim]);

  return (
    <View style={st.container}>
      <AnimatedPaws state="notepad" size={180} style={{ alignSelf: 'center' }} />
      <Text style={st.title}>Paws needs to know a few things first.</Text>
      <Text style={st.sub}>Your answers help Paws map your attention patterns.</Text>
      <Text style={st.btn} onPress={goNext}>Let's do it!</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: '#1C1208', textAlign: 'center', marginTop: 12 },
  sub: { fontFamily: 'Outfit_400Regular', fontSize: 16, color: '#8A7A60', textAlign: 'center', marginTop: 8 },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', marginTop: 24, width: '100%', overflow: 'hidden' },
});
