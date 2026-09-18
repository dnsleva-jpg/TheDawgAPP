import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const REVIEWS = [
  { avatar: '👨🏻', name: 'Mike', age: '28', text: 'I was skeptical but after a week I could sit through a full meeting without checking my phone. Score went from 28 to 71.' },
  { avatar: '👩🏽', name: 'Tally', age: '24', text: "Seeing my blink rate improve week over week is wild. I didn't know attention was something you could actually measure." },
  { avatar: '👨🏾', name: 'Aaron', age: '31', text: "The camera test keeps me honest. My score doesn't lie and neither does the data." },
  { avatar: '👩🏻', name: 'Karina', age: '26', text: "Showed me my worst pickup times were 9–11pm. I had no idea until I saw the data." },
];

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen28({ goNext }: Props) {
  return (
    <ScrollView contentContainerStyle={st.container} showsVerticalScrollIndicator={false}>
      <Text style={st.title}>People are already seeing results.</Text>
      <Text style={st.sub}>4.8 ★★★★★ from early users</Text>

      {REVIEWS.map((r) => (
        <View key={r.name} style={st.card}>
          <View style={st.cardHeader}>
            <View style={st.avatarWrap}>
              <Text style={st.avatarEmoji}>{r.avatar}</Text>
            </View>
            <View style={st.nameCol}>
              <Text style={st.name}>{r.name}, {r.age}</Text>
              <Text style={st.stars}>★★★★★</Text>
            </View>
          </View>
          <Text style={st.review}>"{r.text}"</Text>
        </View>
      ))}

      <Text style={st.btn} onPress={goNext}>Continue</Text>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 24, color: '#1C1208', textAlign: 'center', marginBottom: 4 },
  sub: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#F4A000', textAlign: 'center', marginBottom: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatarWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDE9E0', alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 28 },
  nameCol: { flex: 1 },
  name: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#1C1208' },
  stars: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#F4A000', marginTop: 1 },
  review: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60', lineHeight: 21, fontStyle: 'italic' },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', marginTop: 8, overflow: 'hidden' },
});
