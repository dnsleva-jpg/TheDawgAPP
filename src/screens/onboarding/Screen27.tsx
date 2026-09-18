import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as StoreReview from 'expo-store-review';
import { PawsMascot } from '../../components/PawsMascot';

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen27({ goNext }: Props) {
  useEffect(() => {
    StoreReview.isAvailableAsync().then((ok) => { if (ok) StoreReview.requestReview(); }).catch(() => {});
  }, []);

  return (
    <View style={st.container}>
      <Text style={st.title}>Give us a rating</Text>
      <PawsMascot mood="celebrate" size={48} style={st.mascot} />

      <View style={st.reviewCard}>
        <Text style={st.stars}>4.7 ★★★★★</Text>
        <Text style={st.reviewSub}>Early Do Nothin' users</Text>
      </View>

      <Text style={st.body}>Do Nothin' was made for people like you</Text>

      <View style={st.avatarRow}>
        {['M', 'T', 'A', 'K'].map((l, i) => (
          <View key={l} style={[st.avatar, i > 0 && { marginLeft: -8 }]}>
            <Text style={st.avatarLetter}>{l}</Text>
          </View>
        ))}
      </View>
      <Text style={st.joinText}>Join our early community</Text>

      <Text style={st.btn} onPress={goNext}>Continue</Text>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 28, color: '#1C1208', marginBottom: 8 },
  mascot: { position: 'absolute', top: 60, right: 24 },
  reviewCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, marginBottom: 20, width: '100%' },
  stars: { fontFamily: 'Outfit_700Bold', fontSize: 20, color: '#F4A000' },
  reviewSub: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60', marginTop: 4 },
  body: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#1C1208', textAlign: 'center', marginBottom: 16 },
  avatarRow: { flexDirection: 'row', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EDE9E0', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#8A7A60' },
  joinText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60', marginBottom: 24 },
  btn: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE', backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, textAlign: 'center', width: '100%', overflow: 'hidden' },
});
