import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen26({ goNext }: Props) {
  return (
    <View style={st.container}>
      <Text style={st.title}>Science-backed by leading institutions.</Text>

      <View style={st.logos}>
        <View style={st.logoBadge}><Text style={st.logoText}>CEDARS-SINAI</Text></View>
        <View style={st.logoBadge}><Text style={st.logoText}>HARVARD</Text></View>
        <View style={st.logoBadge}><Text style={st.logoText}>STANFORD</Text></View>
        <View style={st.logoBadge}><Text style={st.logoText}>NATURE</Text></View>
      </View>

      <Text style={st.body}>
        Our focus measurement is built on <Text style={st.bold}>peer-reviewed research</Text> in blink rate and sustained attention from the world's top research institutions.
      </Text>

      <View style={st.divider} />

      <Text style={st.stat}>
        <Text style={st.statNumber}>47+</Text> published studies confirm blink rate as a reliable marker of attention.
      </Text>

      <Text style={st.btn} onPress={goNext}>Continue</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 24, color: '#1C1208', textAlign: 'center', marginBottom: 24 },
  logos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 24 },
  logoBadge: { backgroundColor: '#1C1208', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 16 },
  logoText: { fontFamily: 'Outfit_800ExtraBold', fontSize: 11, color: '#F7F4EE', letterSpacing: 1.5 },
  body: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  bold: { fontFamily: 'Outfit_700Bold', color: '#1C1208' },
  divider: { height: 1, backgroundColor: '#E0D8CC', marginBottom: 20 },
  stat: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  statNumber: { fontFamily: 'Outfit_800ExtraBold', fontSize: 22, color: '#D4820A' },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', overflow: 'hidden' },
});
