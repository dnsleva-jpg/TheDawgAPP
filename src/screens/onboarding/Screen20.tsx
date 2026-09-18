import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { TypewriterTitle } from '../../components/TypewriterTitle';
import { AnimatedPaws } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen20({ goNext }: Props) {
  const [typed, setTyped] = useState(false);
  const pawsFade = useRef(new Animated.Value(0)).current;
  const tagFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(goNext, 5200);
    return () => clearTimeout(t);
  }, [goNext]);

  useEffect(() => {
    if (!typed) return;
    Animated.sequence([
      Animated.timing(pawsFade, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(tagFade, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [typed, pawsFade, tagFade]);

  return (
    <View style={st.container}>
      <TypewriterTitle
        text="This is your life"
        style={st.title}
        speed={50}
        delay={400}
        onComplete={() => setTyped(true)}
      />
      <Animated.View style={{ opacity: pawsFade, marginTop: 24 }}>
        <AnimatedPaws state="fullRot" size={170} />
      </Animated.View>
      <Animated.Text style={[st.tag, { opacity: tagFade }]}>if nothing changes.</Animated.Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F4EE', paddingHorizontal: 24 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 38, color: '#1C1208', textAlign: 'center' },
  tag: { fontFamily: 'Outfit_400Regular', fontSize: 17, color: '#8A7A60', fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
});
