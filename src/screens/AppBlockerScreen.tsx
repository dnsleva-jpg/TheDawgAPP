import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPaws } from '../components/AnimatedPaws';

let DA: any = null;
try {
  DA = require('react-native-device-activity');
} catch {}

const SELECTION_ID = 'donothin_blocked_apps';

// Common doom scroll apps — fallback UI
const DOOM_APPS = [
  { id: 'instagram', emoji: '📸', label: 'Instagram' },
  { id: 'tiktok', emoji: '🎵', label: 'TikTok' },
  { id: 'twitter', emoji: '𝕏', label: 'Twitter / X' },
  { id: 'reddit', emoji: '🤖', label: 'Reddit' },
  { id: 'youtube', emoji: '▶️', label: 'YouTube' },
  { id: 'snapchat', emoji: '👻', label: 'Snapchat' },
  { id: 'facebook', emoji: '📘', label: 'Facebook' },
  { id: 'threads', emoji: '🧵', label: 'Threads' },
];

interface AppBlockerScreenProps {
  onDone: () => void;
}

export function AppBlockerScreen({ onDone }: AppBlockerScreenProps) {
  const [authStatus, setAuthStatus] = useState<any>('unknown');
  const [monitoring, setMonitoring] = useState(false);
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [appCount, setAppCount] = useState(0);

  useEffect(() => {
    if (!DA) { setAuthStatus('unavailable'); return; }
    try {
      const status = DA.getAuthorizationStatus();
      setAuthStatus(status);
      try { setMonitoring(DA.isShieldActive()); } catch {}
    } catch { setAuthStatus(0); }
  }, []);

  const handleAuthorize = useCallback(async () => {
    if (!DA) return;
    try {
      await DA.requestAuthorization('individual');
      setAuthStatus(DA.getAuthorizationStatus());
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not request access.');
    }
  }, []);

  const toggleApp = (id: string) => {
    setSelectedApps(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedApps(DOOM_APPS.map(a => a.id));
  const deselectAll = () => setSelectedApps([]);

  const handleActivate = useCallback(() => {
    if (!DA) return;
    try {
      // Block using the persisted selection from the native picker
      DA.blockSelection({ activitySelectionId: SELECTION_ID }, 'user_activate');
      setMonitoring(true);
      Alert.alert('Shield Active!', 'Try opening one of the blocked apps now.');
    } catch (e: any) {
      // Fallback to block all if individual fails
      try {
        DA.enableBlockAllMode('user_activate_fallback');
        setMonitoring(true);
        Alert.alert('Shield Active!', 'All apps blocked. Come back here to disable.');
      } catch (e2: any) {
        Alert.alert('Error', e2?.message || 'Could not activate.');
      }
    }
  }, []);

  const handleDisable = useCallback(() => {
    if (!DA) return;
    try {
      try { DA.disableBlockAllMode('user_disable'); } catch {}
      try { DA.resetBlocks('user_disable'); } catch {}
      try { DA.clearAllManagedSettingsStoreSettings(); } catch {}
      setMonitoring(false);
      Alert.alert('Shield Disabled', 'All blocks removed.');
    } catch {}
  }, []);

  // ─── Not Available ─────────────────────────────────────
  if (authStatus === 'unavailable') {
    return (
      <SafeAreaView style={st.container} edges={['top']}>
        <TouchableOpacity style={st.closeBtn} onPress={onDone}><Ionicons name="close" size={24} color="#1C1208" /></TouchableOpacity>
        <AnimatedPaws state="notepad" size={120} style={{ alignSelf: 'center' }} />
        <Text style={st.title}>App Blocking</Text>
        <Text style={st.body}>Requires a development or App Store build.</Text>
        <TouchableOpacity style={st.btn} onPress={onDone}><Text style={st.btnText}>Got it</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Need Auth ─────────────────────────────────────────
  if (authStatus === 0 || authStatus === '0' || authStatus === 'notDetermined') {
    return (
      <SafeAreaView style={st.container} edges={['top']}>
        <TouchableOpacity style={st.closeBtn} onPress={onDone}><Ionicons name="close" size={24} color="#1C1208" /></TouchableOpacity>
        <AnimatedPaws state="notepad" size={120} style={{ alignSelf: 'center' }} />
        <Text style={st.title}>Enable Screen Time</Text>
        <Text style={st.body}>Paws needs Screen Time access to block doom scroll apps.</Text>
        <View style={st.privacyCard}>
          <View style={st.privacyRow}><Ionicons name="lock-closed-outline" size={16} color="#4CAF50" /><Text style={st.privacyText}>100% on-device. Nothing uploaded.</Text></View>
          <View style={st.privacyRow}><Ionicons name="eye-off-outline" size={16} color="#4CAF50" /><Text style={st.privacyText}>No data leaves your phone.</Text></View>
        </View>
        <TouchableOpacity style={st.btn} onPress={handleAuthorize}><Text style={st.btnText}>Allow Screen Time Access</Text></TouchableOpacity>
        <TouchableOpacity onPress={onDone}><Text style={st.skipText}>Skip for now</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Denied ────────────────────────────────────────────
  if (authStatus === 1 || authStatus === '1') {
    return (
      <SafeAreaView style={st.container} edges={['top']}>
        <TouchableOpacity style={st.closeBtn} onPress={onDone}><Ionicons name="close" size={24} color="#1C1208" /></TouchableOpacity>
        <AnimatedPaws state="cantStop" size={120} style={{ alignSelf: 'center' }} />
        <Text style={st.title}>Access Denied</Text>
        <Text style={st.body}>Enable Screen Time in Settings first.</Text>
        <TouchableOpacity style={st.btn} onPress={handleAuthorize}><Text style={st.btnText}>Try Again</Text></TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ─── Approved ──────────────────────────────────────────
  return (
    <SafeAreaView style={st.root} edges={['top']}>
      <TouchableOpacity style={st.closeBtn} onPress={onDone}><Ionicons name="close" size={24} color="#1C1208" /></TouchableOpacity>

      <ScrollView contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>
        <AnimatedPaws state={monitoring ? 'focus' : 'hooked'} size={80} style={{ alignSelf: 'center' }} />
        <Text style={st.title}>{monitoring ? 'Shield Active' : 'Block Doom Scroll Apps'}</Text>

        {!monitoring && (
          <>
            <Text style={st.body}>Select the apps you want Paws to block.</Text>

            {/* Native Apple FamilyActivityPicker with showNavigationBar for modal sheet */}
            {DA.DeviceActivitySelectionViewPersisted ? (
              <View style={st.pickerContainer}>
                <DA.DeviceActivitySelectionViewPersisted
                  style={st.picker}
                  familyActivitySelectionId={SELECTION_ID}
                  showNavigationBar={true}
                  headerText="Choose apps to block"
                  footerText="Paws will show a shield when you open these"
                  onSelectionChange={(event: any) => {
                    const count = event?.nativeEvent?.applicationCount ?? 0;
                    setAppCount(count);
                    // Auto-block on selection
                    try {
                      DA.blockSelection({ activitySelectionId: SELECTION_ID }, 'selection_changed');
                    } catch {}
                  }}
                />
              </View>
            ) : DA.DeviceActivitySelectionView ? (
              <View style={st.pickerContainer}>
                <DA.DeviceActivitySelectionView
                  style={st.picker}
                  showNavigationBar={true}
                  headerText="Choose apps to block"
                  footerText="Paws will show a shield when you open these"
                  onSelectionChange={(event: any) => {
                    const count = event?.nativeEvent?.applicationCount ?? 0;
                    setAppCount(count);
                  }}
                />
              </View>
            ) : null}

            {appCount > 0 && <Text style={st.selectedText}>{appCount} app{appCount > 1 ? 's' : ''} selected</Text>}

            <TouchableOpacity style={st.btn} onPress={handleActivate} activeOpacity={0.8}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#FFF" />
              <Text style={st.btnText}> Activate Shield</Text>
            </TouchableOpacity>
          </>
        )}

        {monitoring && (
          <>
            <View style={st.activeCard}>
              <Ionicons name="shield-checkmark" size={32} color="#4CAF50" />
              <Text style={st.activeTitle}>Paws is protecting you</Text>
              <Text style={st.activeBody}>Distracting apps are blocked. You'll see a shield screen when you try to open them.</Text>
            </View>
            <TouchableOpacity style={st.btn} onPress={onDone}><Text style={st.btnText}>Done</Text></TouchableOpacity>
            <TouchableOpacity style={[st.btn, { backgroundColor: '#EDE9E0', marginTop: 10 }]} onPress={handleDisable}>
              <Text style={[st.btnText, { color: '#E74C3C' }]}>Disable Shield</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F4EE' },
  container: { flex: 1, backgroundColor: '#F7F4EE', paddingHorizontal: 24, justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 80, paddingBottom: 40 },
  closeBtn: { position: 'absolute', top: 60, left: 20, zIndex: 10, padding: 8 },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 24, color: '#1C1208', textAlign: 'center', marginTop: 12 },
  body: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', textAlign: 'center', lineHeight: 22, marginTop: 8, marginBottom: 16 },
  btn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginTop: 8 },
  btnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE' },
  skipText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#B0A090', textAlign: 'center', marginTop: 16 },
  privacyCard: { backgroundColor: '#EDE9E0', borderRadius: 14, padding: 14, gap: 10, marginBottom: 16 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  privacyText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#1C1208', flex: 1 },

  // App list
  selectRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  selectLink: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#D4820A' },
  appList: { gap: 8, marginBottom: 16 },
  appRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9E0', borderRadius: 14, padding: 14, gap: 12, borderWidth: 1.5, borderColor: 'transparent' },
  appRowSelected: { borderColor: '#D4820A', backgroundColor: '#FFF8F0' },
  appEmoji: { fontSize: 22 },
  appLabel: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#1C1208', flex: 1 },
  appLabelSelected: { fontFamily: 'Outfit_700Bold', color: '#D4820A' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, borderColor: '#E0D8CC', alignItems: 'center', justifyContent: 'center' },
  checkboxSelected: { backgroundColor: '#D4820A', borderColor: '#D4820A' },
  note: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#B0A090', textAlign: 'center', marginTop: 12 },

  // Native picker
  pickerContainer: { height: 420, borderRadius: 14, overflow: 'hidden', backgroundColor: '#EDE9E0', marginBottom: 12 },
  picker: { flex: 1 },
  selectedText: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#D4820A', textAlign: 'center', marginBottom: 12 },

  // Active
  activeCard: { alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 16, padding: 24, marginVertical: 20, gap: 8 },
  activeTitle: { fontFamily: 'Outfit_700Bold', fontSize: 18, color: '#4CAF50' },
  activeBody: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#8A7A60', textAlign: 'center', lineHeight: 20 },
});
