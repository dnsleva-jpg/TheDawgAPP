import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import { PawsMascot } from '../../components/PawsMascot';

interface Option {
  emoji?: string;
  label: string;
}

interface QuestionScreenProps {
  title: string;
  options: Option[];
  onSelect: (label: string | string[]) => void;
  multiSelect?: boolean;
  questionIndex?: number;   // 1-based
  totalQuestions?: number;
}

export function QuestionScreen({ title, options, onSelect, multiSelect = false, questionIndex, totalQuestions }: QuestionScreenProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [multiSelected, setMultiSelected] = useState<string[]>([]);
  const titleOpacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(titleOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [titleOpacity]);

  const handleSelect = (label: string) => {
    if (multiSelect) {
      setMultiSelected((prev) =>
        prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
      );
    } else {
      setSelected(label);
      setTimeout(() => onSelect(label), 300);
    }
  };

  const handleContinue = () => {
    if (multiSelected.length > 0) {
      onSelect(multiSelected);
    }
  };

  return (
    <ScrollView contentContainerStyle={st.container} showsVerticalScrollIndicator={false}>
      <PawsMascot mood="thinking" size={48} style={st.mascot} />

      <View style={st.assessmentHeader}>
        <Text style={st.assessmentBadge}>FOCUS ASSESSMENT</Text>
        {questionIndex && totalQuestions && (
          <Text style={st.assessmentCount}>Question {questionIndex} of {totalQuestions}</Text>
        )}
      </View>

      <Animated.Text style={[st.title, { opacity: titleOpacity }]}>{title}</Animated.Text>
      {multiSelect && <Text style={st.subtitle}>Select all that apply</Text>}

      <View style={st.options}>
        {options.map((opt) => {
          const isSelected = multiSelect
            ? multiSelected.includes(opt.label)
            : selected === opt.label;
          return (
            <TouchableOpacity
              key={opt.label}
              style={[st.option, isSelected && st.optionSelected]}
              onPress={() => handleSelect(opt.label)}
              activeOpacity={0.7}
            >
              {opt.emoji && <Text style={st.emoji}>{opt.emoji}</Text>}
              <Text style={[st.optionLabel, isSelected && st.optionLabelSelected]}>
                {opt.label}
              </Text>
              {multiSelect && (
                <View style={[st.checkbox, isSelected && st.checkboxSelected]}>
                  {isSelected && <Text style={st.checkmark}>✓</Text>}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {multiSelect && (
        <TouchableOpacity
          style={[st.continueBtn, multiSelected.length === 0 && st.continueBtnDisabled]}
          onPress={handleContinue}
          disabled={multiSelected.length === 0}
          activeOpacity={0.8}
        >
          <Text style={st.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40, backgroundColor: '#F7F4EE' },
  mascot: { position: 'absolute', top: 20, right: 24 },
  assessmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  assessmentBadge: { fontFamily: 'Outfit_800ExtraBold', fontSize: 11, color: '#D4820A', letterSpacing: 1.5, backgroundColor: '#FFF3E0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  assessmentCount: { fontFamily: 'Outfit_700Bold', fontSize: 12, color: '#8A7A60' },
  title: { fontFamily: 'Outfit_700Bold', fontSize: 22, color: '#1C1208', marginBottom: 20 },
  options: { gap: 10 },
  option: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9E0', borderRadius: 14,
    borderWidth: 1.5, borderColor: 'transparent', padding: 16, gap: 12,
  },
  optionSelected: { borderColor: '#D4820A', backgroundColor: '#FFF8F0' },
  emoji: { fontSize: 20 },
  optionLabel: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#1C1208', flex: 1 },
  optionLabelSelected: { fontFamily: 'Outfit_700Bold', color: '#D4820A' },
  subtitle: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#B0A090', marginBottom: 16 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: '#E0D8CC', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#D4820A', borderColor: '#D4820A' },
  checkmark: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  continueBtn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, alignItems: 'center', marginTop: 16, width: '100%' },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE' },
});
