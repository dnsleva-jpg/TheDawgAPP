import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS as DS_COLORS, FONTS, RADIUS } from '../constants/designSystem';

interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
  onProActivated?: () => void;
  features?: string[];
}

const DEFAULT_FEATURES = [
  'Full score history & charts',
  'Week-over-week progress tracking',
  'Best streak & advanced stats',
  'Ruthless Mode (no escape)',
  'Watermark-free share cards',
  'All future Pro features',
];

export function PaywallModal({ visible, onDismiss, onProActivated, features }: PaywallModalProps) {
  const FEATURES = features ?? DEFAULT_FEATURES;
  const handlePriceTap = (plan: 'monthly' | 'yearly') => {
    console.log(`[Paywall] User tapped ${plan} plan`);
    Alert.alert(
      'Coming Soon!',
      'In-app purchases will be available in the next update.',
      [{ text: 'OK' }],
    );
  };

  const handleRestore = () => {
    console.log('[Paywall] User tapped Restore Purchase');
    Alert.alert(
      'Restore Purchase',
      'Purchase restoration will be available in the next update.',
      [{ text: 'OK' }],
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <LinearGradient
          colors={['#0D0D12', '#16213e', '#0D0D12']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Shiba emoji */}
          <Text style={styles.heroEmoji}>🐕</Text>

          {/* Title */}
          <Text style={styles.title}>RAW DAWG PRO</Text>
          <Text style={styles.subtitle}>Unlock the full experience</Text>

          {/* Feature list */}
          <View style={styles.featureList}>
            {FEATURES.map((feature) => (
              <View key={feature} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Pricing buttons */}
          <View style={styles.pricingRow}>
            {/* Monthly */}
            <TouchableOpacity
              style={styles.monthlyButton}
              onPress={() => handlePriceTap('monthly')}
              activeOpacity={0.8}
            >
              <Text style={styles.monthlyPrice}>$4.99</Text>
              <Text style={styles.monthlyPeriod}>/ month</Text>
            </TouchableOpacity>

            {/* Yearly */}
            <TouchableOpacity
              style={styles.yearlyButton}
              onPress={() => handlePriceTap('yearly')}
              activeOpacity={0.8}
            >
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>SAVE 50%</Text>
              </View>
              <Text style={styles.yearlyPrice}>$29.99</Text>
              <Text style={styles.yearlyPeriod}>/ year</Text>
            </TouchableOpacity>
          </View>

          {/* Restore */}
          <TouchableOpacity onPress={handleRestore} activeOpacity={0.7} style={styles.restoreButton}>
            <Text style={styles.restoreText}>Restore Purchase</Text>
          </TouchableOpacity>

          {/* Dismiss */}
          <TouchableOpacity onPress={onDismiss} activeOpacity={0.7} style={styles.dismissButton}>
            <Text style={styles.dismissText}>Not now</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: DS_COLORS.bgDeep,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
    gap: 8,
  },

  heroEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 44,
    fontFamily: FONTS.display,
    color: DS_COLORS.coral,
    letterSpacing: 3,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Feature list
  featureList: {
    width: '100%',
    gap: 14,
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureCheck: {
    fontSize: 18,
    color: DS_COLORS.coral,
    fontFamily: FONTS.heading,
    width: 24,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 16,
    fontFamily: FONTS.headingMedium,
    color: DS_COLORS.textPrimary,
    flex: 1,
  },

  // Pricing
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 20,
  },
  monthlyButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: DS_COLORS.coral,
    borderRadius: RADIUS.card,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 2,
  },
  monthlyPrice: {
    fontSize: 22,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
  },
  monthlyPeriod: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
  },
  yearlyButton: {
    flex: 1,
    backgroundColor: DS_COLORS.coral,
    borderRadius: RADIUS.card,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 2,
    overflow: 'visible',
  },
  yearlyPrice: {
    fontSize: 22,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
  },
  yearlyPeriod: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: -4,
    backgroundColor: '#27AE60',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  saveBadgeText: {
    fontSize: 9,
    fontFamily: FONTS.heading,
    color: '#fff',
    letterSpacing: 1,
  },

  // Restore
  restoreButton: {
    paddingVertical: 12,
  },
  restoreText: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textMuted,
    textDecorationLine: 'underline',
  },

  // Dismiss
  dismissButton: {
    paddingVertical: 12,
    marginTop: 4,
  },
  dismissText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: DS_COLORS.textDisabled,
  },
});
