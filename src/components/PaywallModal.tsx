import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../constants/designSystem';
import {
  PRICING,
  PRO_FEATURES_LIST,
  type PaywallTrigger,
  setProStatus,
} from '../utils/proService';
import { restorePurchases } from '../utils/subscriptionService';

interface PaywallModalProps {
  visible: boolean;
  trigger?: PaywallTrigger | null;
  onDismiss: () => void;
  onPurchaseComplete: () => void;
}

export function PaywallModal({ visible, trigger, onDismiss, onPurchaseComplete }: PaywallModalProps) {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      // TODO: Wire to RevenueCat purchasePackage
      await setProStatus(true);
      onPurchaseComplete();
    } catch {
      Alert.alert('Error', 'Could not complete purchase. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const isPro = await restorePurchases();
      if (isPro) {
        await setProStatus(true);
        onPurchaseComplete();
      } else {
        Alert.alert('No Subscription', 'No active subscription found.');
      }
    } catch {
      Alert.alert('Error', 'Could not restore purchases.');
    } finally {
      setLoading(false);
    }
  };

  const plan = PRICING[selectedPlan];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        {/* Close */}
        <TouchableOpacity style={styles.closeButton} onPress={onDismiss} activeOpacity={0.7}>
          <Ionicons name="close" size={24} color={COLORS.textMuted} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          {trigger && (
            <View style={styles.triggerBadge}>
              <Ionicons name="lock-closed" size={12} color={COLORS.coral} />
              <Text style={styles.triggerText}>{trigger.title}</Text>
            </View>
          )}
          <Text style={styles.headline}>Unlock Your{'\n'}Full Potential</Text>
          <Text style={styles.subheadline}>
            {trigger?.subtitle || 'Get everything DO NOTHIN. has to offer'}
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresList}>
          {PRO_FEATURES_LIST.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Ionicons name={f.icon as any} size={18} color={COLORS.coral} />
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Plan toggles */}
        <View style={styles.plansRow}>
          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('annual')}
            activeOpacity={0.7}
          >
            {selectedPlan === 'annual' && (
              <View style={styles.bestValue}>
                <Text style={styles.bestValueText}>BEST VALUE</Text>
              </View>
            )}
            <Text style={styles.planPrice}>{PRICING.annual.price}</Text>
            <Text style={styles.planPeriod}>per year</Text>
            <Text style={styles.planSavings}>Save {PRICING.annual.savings}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelectedPlan('monthly')}
            activeOpacity={0.7}
          >
            <Text style={styles.planPrice}>{PRICING.monthly.price}</Text>
            <Text style={styles.planPeriod}>per month</Text>
          </TouchableOpacity>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
          onPress={handlePurchase}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaText}>
            {loading ? 'Processing...' : `Start ${plan.trialDays}-Day Free Trial`}
          </Text>
        </TouchableOpacity>

        <Text style={styles.trialNote}>
          Free for {plan.trialDays} days, then {plan.price}/{plan.period}. Cancel anytime.
        </Text>

        {/* Restore */}
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} activeOpacity={0.7}>
          <Text style={styles.restoreText}>Restore Purchase</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
    paddingHorizontal: 24,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  triggerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.coral + '18',
    borderRadius: RADIUS.pill,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  triggerText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.coral,
  },
  headline: {
    fontFamily: FONTS.headingBold,
    fontSize: 32,
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 8,
  },
  subheadline: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  featuresList: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    gap: 14,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  plansRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: COLORS.coral,
  },
  bestValue: {
    position: 'absolute',
    top: -10,
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  bestValueText: {
    fontFamily: FONTS.monoBold,
    fontSize: 9,
    color: '#1C1208',
    letterSpacing: 1,
  },
  planPrice: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  planPeriod: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  planSavings: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    color: COLORS.verified,
    marginTop: 6,
  },
  ctaButton: {
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.button,
    paddingVertical: 18,
    alignItems: 'center',
    ...SHADOWS.coralButton,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: '#1C1208',
    letterSpacing: 0.5,
  },
  trialNote: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 10,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  restoreText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
