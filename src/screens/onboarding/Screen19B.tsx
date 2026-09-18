import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AnimatedPaws } from '../../components/AnimatedPaws';
import { useOnboarding } from '../../context/OnboardingContext';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen19B({ goNext }: Props) {
  const { yearsOnPhone } = useOnboarding();
  const pawsFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fadeIn = setTimeout(() => {
      Animated.timing(pawsFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 900);
    const t = setTimeout(goNext, 4000);
    return () => { clearTimeout(fadeIn); clearTimeout(t); };
  }, [goNext, pawsFade]);

  return (
    <View style={st.container}>
      <Text style={st.text}>Do you understand{'\n'}what it means to spend</Text>
      <Text style={st.number}>{yearsOnPhone} years</Text>
      <Text style={st.text}>on your phone?</Text>
      <Animated.View style={{ opacity: pawsFade, marginTop: 28 }}>
        <AnimatedPaws state="severeRot" size={150} />
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F4EE', paddingHorizontal: 24 },
  text: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#1C1208', textAlign: 'center' },
  number: { fontFamily: 'Outfit_800ExtraBold', fontSize: 56, color: '#D4820A', textAlign: 'center', marginVertical: 8 },
});
