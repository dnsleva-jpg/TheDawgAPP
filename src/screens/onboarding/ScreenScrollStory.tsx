import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { AnimatedPaws } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function ScreenScrollStory({ goNext }: Props) {
  const videoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(videoOpacity, { toValue: 1, duration: 500, delay: 300, useNativeDriver: true }),
      Animated.timing(textOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [videoOpacity, textOpacity, btnOpacity]);

  return (
    <View style={st.container}>
      {/* Paws stand-in until emotional video ships — state matches the "5min → 40min" overwhelm */}
      <Animated.View style={[st.pawsContainer, { opacity: videoOpacity }]}>
        <View style={st.pawsFrame}>
          <AnimatedPaws state="hooked" size={200} />
        </View>
      </Animated.View>

      <Animated.View style={[st.textArea, { opacity: textOpacity }]}>
        <Text style={st.headline}>You know this feeling.</Text>
        <Text style={st.body}>
          <Text style={st.bold}>5 minutes ago</Text> you picked up your phone.{'\n'}
          That was <Text style={st.bold}>40 minutes ago.</Text>{'\n\n'}
          Your brain is begging you to stop.{'\n'}
          <Text style={st.red}>You can't.</Text>{'\n\n'}
          They built it this way.
        </Text>
      </Animated.View>

      <Animated.View style={{ opacity: btnOpacity, width: '100%', paddingHorizontal: 24 }}>
        <TouchableOpacity style={st.btn} onPress={goNext} activeOpacity={0.8}>
          <Text style={st.btnText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#F7F4EE' },
  pawsContainer: { marginHorizontal: 24, marginBottom: 28 },
  pawsFrame: {
    height: 240,
    backgroundColor: '#F0EAD9',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: { paddingHorizontal: 24, marginBottom: 28 },
  headline: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: '#1C1208', marginBottom: 12 },
  body: { fontFamily: 'Outfit_400Regular', fontSize: 16, color: '#8A7A60', lineHeight: 26 },
  bold: { fontFamily: 'Outfit_700Bold', color: '#1C1208' },
  red: { fontFamily: 'Outfit_800ExtraBold', color: '#E74C3C' },
  btn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, alignItems: 'center' },
  btnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE' },
});
