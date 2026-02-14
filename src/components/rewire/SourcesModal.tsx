import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS as DS_COLORS, FONTS } from '../../constants/designSystem';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

const SOURCES = [
  'Clayton, Leshner & Almond — University of Missouri, 2015',
  'Vanman, Baker & Tobin — University of Queensland, 2018',
  'Castelo, Kushlev et al. — PNAS Nexus, 2025',
  'Tang et al. — PNAS, 2012',
  'Deng et al. — Addiction Biology, 2022',
  'reSTART Life — Internet Addiction Treatment Center',
  'Zeidan et al. — Wake Forest University, 2010',
  'Zald et al. — Vanderbilt University, 2004',
  'Wilson et al. — Science, 2014',
  'Kim et al. — NeuroReport, 2011',
  'Fox et al. — University of British Columbia, 2014',
  'Blehm et al. — Survey of Ophthalmology, 2005',
  'Maffei & Angrilli — University of Padova, 2018',
  'Bentivoglio et al. — Movement Disorders, 1997',
];

export function SourcesModal({ visible, onDismiss }: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Research Sources</Text>
            <TouchableOpacity onPress={onDismiss} activeOpacity={0.7}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            <Text style={styles.intro}>
              The claims on this screen are based on peer-reviewed neuroscience
              research. Here are the primary sources:
            </Text>
            {SOURCES.map((source, i) => (
              <View key={i} style={styles.sourceRow}>
                <Text style={styles.sourceNum}>{i + 1}.</Text>
                <Text style={styles.sourceText}>{source}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
  },
  closeButton: {
    fontSize: 20,
    color: DS_COLORS.textMuted,
    padding: 4,
  },
  listContent: {
    padding: 20,
    gap: 14,
  },
  intro: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sourceNum: {
    fontSize: 13,
    fontFamily: FONTS.mono,
    color: DS_COLORS.textMuted,
    width: 22,
  },
  sourceText: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: DS_COLORS.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
});
