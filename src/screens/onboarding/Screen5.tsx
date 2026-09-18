import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MotiView, MotiText } from 'moti';
import * as Haptics from 'expo-haptics';
import { AnimatedPaws } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen5({ goNext }: Props) {
  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    goNext();
  };

  return (
    <View style={st.container}>
      <View style={st.middle}>
        <MotiText
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 14, mass: 0.9, delay: 100 }}
          style={st.title}
        >
          Your brain isn't broken.
        </MotiText>
        <MotiText
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 14, mass: 0.9, delay: 320 }}
          style={st.subtitle}
        >
          It's never been measured.
        </MotiText>

        <MotiView
          from={{ opacity: 0, scale: 0.6, rotate: '-6deg' }}
          animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
          transition={{ type: 'spring', damping: 11, mass: 0.9, delay: 540 }}
          style={st.pawsWrap}
        >
          <AnimatedPaws state="notepad" size={200} />
        </MotiView>

        <MotiText
          from={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 9, mass: 0.7, delay: 880 }}
          style={st.body}
        >
          Until now.
        </MotiText>
      </View>

      <MotiView
        from={{ opacity: 0, translateY: 14 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 1200 }}
      >
        <TouchableOpacity activeOpacity={0.85} onPress={handleNext} style={st.btn}>
          <Text style={st.btnText}>Continue</Text>
        </TouchableOpacity>
      </MotiView>
    </View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 24,
    backgroundColor: '#F7F4EE',
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 32,
    color: '#1C1208',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 22,
    color: '#8A7A60',
    textAlign: 'center',
    marginTop: 6,
  },
  pawsWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 28,
  },
  body: {
    fontFamily: 'Outfit_800ExtraBold',
    fontSize: 26,
    color: '#D4820A',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  btn: {
    backgroundColor: '#D4820A',
    borderRadius: 100,
    paddingVertical: 18,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 16,
    color: '#F7F4EE',
    letterSpacing: 0.4,
  },
});
