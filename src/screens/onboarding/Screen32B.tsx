import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Animated, Easing, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PawsMascot } from '../../components/PawsMascot';
import { TypewriterTitle } from '../../components/TypewriterTitle';
import { useOnboarding } from '../../context/OnboardingContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Peer-matched testimonials by userIdentity answer from Screen 9.
// Cialdini peer-proof research: specific matching doubles credibility of social proof.
const TESTIMONIALS: Record<string, { quote: string; name: string }> = {
  'Builder / Creator':          { quote: "I ship 2x more now. The shield is unreal.",             name: 'Marcus, builder' },
  'Knowledge worker':           { quote: "First job in 10 years I can actually focus through.",   name: 'Priya, PM' },
  'Athlete / Active':           { quote: "Morning workouts are back. No scroll before training.", name: 'Jamie, runner' },
  'Student':                    { quote: "My study hours tripled. Blink score doesn't lie.",      name: 'Alex, junior' },
  'Just trying to live better': { quote: "Dinners without the phone. That's the whole thing.",    name: 'Sam, 34' },
};

const DEFAULT_TESTIMONIAL = { quote: "The camera doesn't lie. Neither does Paws.", name: 'Early user' };

interface Props { goNext: () => void; goBack: () => void; onComplete: () => void }

export function Screen32B({ onComplete }: Props) {
  const { data } = useOnboarding();
  const testimonial = (data.userIdentity && TESTIMONIALS[data.userIdentity]) || DEFAULT_TESTIMONIAL;
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'weekly'>('yearly');
  const [showDiscount, setShowDiscount] = useState(false);
  const hasShownDiscount = useRef(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const discountFade = useRef(new Animated.Value(0)).current;

  const complete = useCallback(async () => {
    await AsyncStorage.setItem('@donothin:onboarding_complete', 'true');
    onComplete();
  }, [onComplete]);

  const handlePurchase = useCallback(async () => {
    // TODO: wire RevenueCat yearly product ID ($48.99/year) and weekly product ID ($3.99/week) here.
    // Use Purchases.purchasePackage() with the selected plan.
    await complete();
  }, [complete]);

  const handleDismiss = useCallback(() => {
    if (!hasShownDiscount.current) {
      hasShownDiscount.current = true;
      setTimeout(() => {
        setShowDiscount(true);
        Animated.timing(slideAnim, { toValue: 0, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      }, 800);
    } else {
      complete();
    }
  }, [slideAnim, complete]);

  const handleRedeemDiscount = useCallback(async () => {
    // TODO: wire RevenueCat discounted yearly product ID ($24.49/year) here.
    await complete();
  }, [complete]);

  return (
    <View style={st.root}>
      <ScrollView contentContainerStyle={st.container} showsVerticalScrollIndicator={false}>
        {/* Paws mood grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.moodGrid}>
          {(['meditating', 'thinking', 'sideeye', 'worried', 'celebrate', 'meditating', 'thinking', 'sideeye', 'worried'] as const).map((mood, i) => (
            <View key={i} style={st.moodCell}><PawsMascot mood={mood} size={50} /></View>
          ))}
        </ScrollView>

        <Text style={st.title}>Choose your</Text>
        <Text style={st.titleAccent}>Do Nothin' plan</Text>

        {/* Yearly card */}
        <TouchableOpacity
          style={[st.planCard, selectedPlan === 'yearly' && st.planSelected]}
          onPress={() => setSelectedPlan('yearly')}
          activeOpacity={0.7}
        >
          {selectedPlan === 'yearly' && <View style={st.badge}><Text style={st.badgeText}>LOWEST PRICE EVER</Text></View>}
          <View style={st.planRow}>
            <View>
              <Text style={st.planName}>Yearly Plan</Text>
              <Text style={st.planDetail}>12mo • $48.99</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={st.planPrice}>$0.94/week</Text>
              <View style={[st.radio, selectedPlan === 'yearly' && st.radioFilled]}>
                {selectedPlan === 'yearly' && <Text style={st.radioCheck}>✓</Text>}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Weekly card */}
        <TouchableOpacity
          style={[st.planCard, selectedPlan === 'weekly' && st.planSelected]}
          onPress={() => setSelectedPlan('weekly')}
          activeOpacity={0.7}
        >
          <View style={st.planRow}>
            <View>
              <Text style={st.planName}>Weekly Plan</Text>
              <Text style={st.planDetail}>billed weekly</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[st.planPrice, { color: '#8A7A60' }]}>$3.99/week</Text>
              <View style={[st.radio, selectedPlan === 'weekly' && st.radioFilled]}>
                {selectedPlan === 'weekly' && <Text style={st.radioCheck}>✓</Text>}
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <Text style={st.reviewStars}>★★★★★</Text>
        <Text style={st.reviewQuote}>"{testimonial.quote}"</Text>
        <Text style={st.reviewAttribution}>— {testimonial.name}</Text>

        <View style={st.cancelRow}>
          <PawsMascot mood="meditating" size={24} />
          <Text style={st.cancelText}>Cancel anytime</Text>
        </View>
        <Text style={st.pawsNote}>Paws has been free this whole time. The plan is what costs money.</Text>

        <TouchableOpacity style={st.ctaButton} onPress={handlePurchase} activeOpacity={0.8}>
          <Text style={st.ctaText}>Start Do Nothin'</Text>
        </TouchableOpacity>
        <Text style={st.ctaSub}>Then $48.99/year or $3.99/week. Cancel anytime.</Text>

        <TouchableOpacity onPress={handleDismiss} style={st.skipBtn}>
          <Text style={st.skipText}>Not now</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Discount bottom sheet */}
      <Modal visible={showDiscount} transparent animationType="none">
        <View style={st.modalOverlay}>
          <TouchableOpacity style={st.modalBackdrop} activeOpacity={1} onPress={() => { setShowDiscount(false); complete(); }} />
          <Animated.View style={[st.discountSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={st.handle} />
            <View style={st.discountBadge}><Text style={st.discountBadgeText}>50% OFF FOREVER</Text></View>
            <PawsMascot mood="celebrate" size={80} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <TypewriterTitle text="Limited time offer" style={st.discountTitle} delay={200} onComplete={() => {
              Animated.timing(discountFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
            }} />
            <Animated.View style={{ opacity: discountFade, alignItems: 'center' }}>
              <View style={st.priceRow}>
                <Text style={st.priceStrike}>$48.99</Text>
                <Text style={st.priceNew}> $2.04/mo</Text>
              </View>
              <Text style={st.priceBilling}>Billed as <Text style={st.priceStrike}>$48.99</Text> $24.49/year</Text>
              <Text style={st.priceMonthly}>That's $2.04/month.</Text>
              <Text style={st.pawsOpinion}>Paws thinks that's a good deal. Paws is also biased.</Text>
              <TouchableOpacity style={st.ctaButton} onPress={handleRedeemDiscount} activeOpacity={0.8}>
                <Text style={st.ctaText}>Redeem Offer</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowDiscount(false); complete(); }} style={st.noThanks}>
                <Text style={st.noThanksText}>Pay in App</Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F4EE' },
  container: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, alignItems: 'center' },
  moodGrid: { marginBottom: 16 },
  moodCell: { width: 70, height: 70, backgroundColor: '#EDE9E0', borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: '#1C1208', textAlign: 'center' },
  titleAccent: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: '#D4820A', textAlign: 'center', marginBottom: 16 },

  planCard: { width: '100%', borderWidth: 1, borderColor: '#E0D8CC', backgroundColor: '#F7F4EE', borderRadius: 16, padding: 16, marginBottom: 10 },
  planSelected: { borderWidth: 2, borderColor: '#D4820A', backgroundColor: '#FFF8F0' },
  badge: { backgroundColor: '#D4820A', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'center', marginBottom: 10 },
  badgeText: { fontFamily: 'Outfit_700Bold', fontSize: 10, color: '#FFF', letterSpacing: 1 },
  planRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#1C1208' },
  planDetail: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60', marginTop: 2 },
  planPrice: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#D4820A' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#E0D8CC', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  radioFilled: { backgroundColor: '#D4820A', borderColor: '#D4820A' },
  radioCheck: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  reviewStars: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#F4A000', marginTop: 12 },
  reviewQuote: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60', fontStyle: 'italic', textAlign: 'center', marginBottom: 4 },
  reviewAttribution: { fontFamily: 'Outfit_700Bold', fontSize: 11, color: '#B0A090', textAlign: 'center', marginBottom: 12 },
  cancelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cancelText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60' },
  pawsNote: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60', fontStyle: 'italic', textAlign: 'center', marginBottom: 16 },

  ctaButton: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, width: '100%', alignItems: 'center' },
  ctaText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#FFF' },
  ctaSub: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#B0A090', textAlign: 'center', marginTop: 8 },
  skipBtn: { paddingVertical: 16 },
  skipText: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#B0A090' },

  // Discount modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  discountSheet: { backgroundColor: '#F7F4EE', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 48 },
  handle: { width: 40, height: 4, backgroundColor: '#E0D8CC', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  discountBadge: { backgroundColor: '#D4820A', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'center', transform: [{ rotate: '-3deg' }], marginBottom: 14 },
  discountBadgeText: { fontFamily: 'Outfit_700Bold', fontSize: 12, color: '#FFF' },
  discountTitle: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#D4820A', textAlign: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 12 },
  priceStrike: { fontFamily: 'Outfit_400Regular', fontSize: 18, color: '#B0A090', textDecorationLine: 'line-through' },
  priceNew: { fontFamily: 'Outfit_800ExtraBold', fontSize: 40, color: '#1C1208' },
  priceBilling: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60', textAlign: 'center', marginTop: 4 },
  priceMonthly: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', textAlign: 'center', marginTop: 4 },
  pawsOpinion: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#8A7A60', fontStyle: 'italic', textAlign: 'center', marginVertical: 20 },
  noThanks: { paddingVertical: 12 },
  noThanksText: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#B0A090', textAlign: 'center' },
});
