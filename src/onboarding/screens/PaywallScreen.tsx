import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOWS, BRAND } from '../../constants/designSystem';
import { OnboardingButton } from '../components/OnboardingButton';
import { getOfferings, purchasePackage, restorePurchases } from '../../utils/subscriptionService';
import type { PurchasesPackage } from 'react-native-purchases';

type PricingPlan = 'annual' | 'monthly';

interface PaywallScreenProps {
  onComplete: () => void;
}

export function PaywallScreen({ onComplete }: PaywallScreenProps) {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>('annual');
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    getOfferings().then(setPackages).catch(() => {});
  }, []);

  const handleStartTrial = async () => {
    const pkg = packages.find((p) =>
      selectedPlan === 'annual'
        ? p.packageType === 'ANNUAL'
        : p.packageType === 'MONTHLY'
    ) ?? packages[0];

    if (!pkg) {
      // No packages available (dev mode or API keys not configured)
      onComplete();
      return;
    }

    setIsPurchasing(true);
    try {
      const isPro = await purchasePackage(pkg);
      if (isPro) {
        onComplete();
      }
    } catch (error: any) {
      Alert.alert('Purchase Failed', error?.message ?? 'Something went wrong.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsPurchasing(true);
    try {
      const isPro = await restorePurchases();
      if (isPro) {
        Alert.alert('Restored!', 'Your subscription has been restored.', [
          { text: 'OK', onPress: onComplete },
        ]);
      } else {
        Alert.alert('No Subscription Found', 'We couldn\'t find an active subscription.');
      }
    } catch {
      Alert.alert('Restore Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const FEATURES = [
    'Full 90-day challenge program',
    'Brain Recovery Score tracking & charts',
    'Progress analytics & trends',
    'All protection levels',
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
      <Text style={styles.brand}>{BRAND.appName}</Text>
      <Text style={styles.headline}>Your brain recovery{'\n'}starts today.</Text>
      <Text style={styles.subheadline}>Join the program that actually proves it's working.</Text>

      {/* Testimonial */}
      <View style={styles.testimonial}>
        <Text style={styles.stars}>★★★★★</Text>
        <Text style={styles.testimonialText}>
          "By Day 30, my Screen Time was down 40% and my DO NOTHIN. Score was an A. This app is different."
        </Text>
        <Text style={styles.testimonialAuthor}>— Alex M., Day 47</Text>
        {/* TODO: Replace with real review before launch */}
      </View>

      {/* Features */}
      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={styles.featureCheck}>✅</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      {/* Pricing options */}
      <View style={styles.plans}>
        <TouchableOpacity
          style={[styles.plan, selectedPlan === 'annual' && styles.planSelected]}
          onPress={() => setSelectedPlan('annual')}
          activeOpacity={0.8}
        >
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>BEST VALUE</Text>
          </View>
          <View style={styles.planContent}>
            <Text style={[styles.planTitle, selectedPlan === 'annual' && styles.planTitleSelected]}>
              Annual
            </Text>
            <Text style={[styles.planPrice, selectedPlan === 'annual' && styles.planPriceSelected]}>
              $19.99/year
            </Text>
          </View>
          <Text style={[styles.planSave, selectedPlan === 'annual' && styles.planSaveSelected]}>
            Save 44%
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.plan, selectedPlan === 'monthly' && styles.planSelected]}
          onPress={() => setSelectedPlan('monthly')}
          activeOpacity={0.8}
        >
          <View style={styles.planContent}>
            <Text style={[styles.planTitle, selectedPlan === 'monthly' && styles.planTitleSelected]}>
              Monthly
            </Text>
            <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceSelected]}>
              $2.99/month
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* CTA */}
      <View style={styles.cta}>
        <OnboardingButton
          title={isPurchasing ? 'Processing...' : 'Start Your 7-Day Free Trial'}
          onPress={handleStartTrial}
          disabled={isPurchasing}
        />
        <View style={styles.secondaryLinks}>
          <TouchableOpacity onPress={handleRestore}>
            <Text style={styles.linkText}>Restore purchase</Text>
          </TouchableOpacity>
          <Text style={styles.linkDivider}>·</Text>
          <TouchableOpacity onPress={onComplete}>
            <Text style={styles.linkText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
    paddingHorizontal: 24,
  },
  brand: {
    fontFamily: FONTS.display,
    fontSize: 16,
    color: COLORS.coral,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
  },
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 28,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 8,
  },
  subheadline: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Testimonial
  testimonial: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(28,18,8,0.04)',
  },
  stars: {
    fontSize: 14,
    color: COLORS.amber,
    marginBottom: 8,
  },
  testimonialText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  testimonialAuthor: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  // Features
  features: {
    marginBottom: 20,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureCheck: {
    fontSize: 16,
  },
  featureText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  // Plans
  plans: {
    gap: 10,
    marginBottom: 20,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  planSelected: {
    borderColor: COLORS.coral,
    backgroundColor: 'rgba(255, 77, 106, 0.06)',
  },
  planBadge: {
    backgroundColor: COLORS.coral,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 12,
  },
  planBadgeText: {
    fontFamily: FONTS.monoBold,
    fontSize: 10,
    color: '#1C1208',
    letterSpacing: 0.5,
  },
  planContent: {
    flex: 1,
  },
  planTitle: {
    fontFamily: FONTS.heading,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  planTitleSelected: {
    color: COLORS.textPrimary,
  },
  planPrice: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  planPriceSelected: {
    color: COLORS.textSecondary,
  },
  planSave: {
    fontFamily: FONTS.monoBold,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  planSaveSelected: {
    color: COLORS.coral,
  },
  // CTA
  cta: {
    marginTop: 'auto',
    gap: 12,
  },
  secondaryLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  linkDivider: {
    fontSize: 14,
    color: COLORS.textDisabled,
  },
});
