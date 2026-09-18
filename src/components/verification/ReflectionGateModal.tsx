import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, RADIUS, SHADOWS, SPACING } from '../../constants/designSystem';

const MIN_CHARACTERS = 50;

interface ReflectionGateModalProps {
  title: string;
  prompt: string;
  dayNumber: number;
  onComplete: (reflectionText: string) => void;
  onCancel: () => void;
}

export function ReflectionGateModal({
  title,
  prompt,
  dayNumber,
  onComplete,
  onCancel,
}: ReflectionGateModalProps) {
  const [text, setText] = useState('');

  const charCount = text.trim().length;
  const isValid = charCount >= MIN_CHARACTERS;

  const handleSubmit = () => {
    if (!isValid) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onComplete(text.trim());
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.dayLabel}>DAY {dayNumber}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.prompt}>{prompt}</Text>
          </View>

          {/* Text Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Write your reflection here..."
              placeholderTextColor={COLORS.textDisabled}
              multiline
              value={text}
              onChangeText={setText}
              autoFocus
              textAlignVertical="top"
            />
            <View style={styles.charCountRow}>
              <Text style={[
                styles.charCount,
                isValid && styles.charCountValid,
              ]}>
                {charCount}/{MIN_CHARACTERS} characters
              </Text>
              {isValid && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={!isValid}
            >
              <Text style={[styles.submitButtonText, !isValid && styles.submitButtonTextDisabled]}>
                COMPLETE CHALLENGE
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
    paddingTop: 24,
    paddingBottom: 16,
  },

  // Header
  header: {
    marginBottom: 20,
  },
  dayLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontFamily: FONTS.headingBold,
    fontSize: 24,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  prompt: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Input
  inputContainer: {
    flex: 1,
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  charCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  charCount: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  charCountValid: {
    color: COLORS.verified,
  },
  checkMark: {
    fontFamily: FONTS.monoBold,
    fontSize: 12,
    color: COLORS.verified,
  },

  // Actions
  actions: {
    gap: 8,
  },
  submitButton: {
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOWS.coralButton,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.bgSurfaceLight,
    shadowOpacity: 0,
  },
  submitButtonText: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: '#1C1208',
    letterSpacing: 1,
  },
  submitButtonTextDisabled: {
    color: COLORS.textDisabled,
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
