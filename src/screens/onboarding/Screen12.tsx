import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AnimatedPaws } from '../../components/AnimatedPaws';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen12({ goNext }: Props) {
  return (
    <View style={st.container}>
      <AnimatedPaws state="focus" size={72} style={{ alignSelf: 'center' }} />
      <Text style={st.title}>4 ways Do Nothin' works</Text>

      <View style={st.pillars}>
        <View style={st.pillar}>
          <Text style={st.pillarNumber}>1</Text>
          <View style={st.pillarContent}>
            <Text style={st.pillarTitle}>Measure</Text>
            <Text style={st.pillarBody}>Daily Focus Score — 30 seconds, 5 questions</Text>
          </View>
        </View>

        <View style={st.pillar}>
          <Text style={st.pillarNumber}>2</Text>
          <View style={st.pillarContent}>
            <Text style={st.pillarTitle}>Test</Text>
            <Text style={st.pillarBody}>Camera-verified focus checks — blinks don't lie</Text>
          </View>
        </View>

        <View style={st.pillar}>
          <Text style={st.pillarNumber}>3</Text>
          <View style={st.pillarContent}>
            <Text style={st.pillarTitle}>Protect</Text>
            <Text style={st.pillarBody}>Pause before doom scrolling with smart blockers</Text>
          </View>
        </View>

        <View style={st.pillar}>
          <Text style={st.pillarNumber}>4</Text>
          <View style={st.pillarContent}>
            <Text style={st.pillarTitle}>Train</Text>
            <Text style={st.pillarBody}>Daily challenges that rebuild your attention</Text>
          </View>
        </View>
      </View>

      <Text style={st.hook}>Measure. Test. Protect. Train.</Text>

      <Text style={st.btn} onPress={goNext}>Continue</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: '#1C1208', textAlign: 'center', marginTop: 12, marginBottom: 24 },

  pillars: { gap: 12 },
  pillar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9E0', borderRadius: 14, padding: 16, gap: 14 },
  pillarNumber: { fontFamily: 'Outfit_800ExtraBold', fontSize: 24, color: '#D4820A', width: 32, textAlign: 'center' },
  pillarContent: { flex: 1 },
  pillarTitle: { fontFamily: 'Outfit_700Bold', fontSize: 17, color: '#1C1208' },
  pillarBody: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60', marginTop: 2 },

  hook: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#D4820A', textAlign: 'center', marginTop: 24 },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', marginTop: 20, overflow: 'hidden' },
});
