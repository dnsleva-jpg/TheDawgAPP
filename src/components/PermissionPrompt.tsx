import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedPaws } from './AnimatedPaws';

interface PermissionPromptProps {
  type: 'camera' | 'screenTime';
  onAllow: () => void;
  onSkip: () => void;
  denied?: boolean;
}

export function PermissionPrompt({ type, onAllow, onSkip, denied = false }: PermissionPromptProps) {
  const isCamera = type === 'camera';

  return (
    <View style={st.container}>
      <AnimatedPaws state="notepad" size={80} style={{ alignSelf: 'center' }} />

      <Text style={st.title}>
        {denied
          ? (isCamera ? 'Camera Access Needed' : 'Screen Time Access Needed')
          : (isCamera ? 'Enable Camera' : 'Enable Screen Time')}
      </Text>

      <Text style={st.body}>
        {isCamera
          ? 'Paws uses your front camera to track blinks and stillness during focus tests. This is how your Focus Score is calculated.'
          : 'Paws uses Screen Time to help you pause before opening doom scroll apps. You choose which apps to protect.'}
      </Text>

      {/* Privacy assurance */}
      <View style={st.privacyCard}>
        <View style={st.privacyRow}>
          <Ionicons name="lock-closed-outline" size={16} color="#4CAF50" />
          <Text style={st.privacyText}>100% on-device. Nothing is uploaded.</Text>
        </View>
        <View style={st.privacyRow}>
          <Ionicons name="eye-off-outline" size={16} color="#4CAF50" />
          <Text style={st.privacyText}>{isCamera ? 'No photos or videos are saved.' : 'No browsing data leaves your phone.'}</Text>
        </View>
        <View style={st.privacyRow}>
          <Ionicons name="trash-outline" size={16} color="#4CAF50" />
          <Text style={st.privacyText}>{isCamera ? 'Camera is only active during tests.' : 'You can revoke access anytime in Settings.'}</Text>
        </View>
      </View>

      {denied ? (
        <>
          <Text style={st.deniedText}>
            Access was previously denied. You'll need to enable it in Settings.
          </Text>
          <TouchableOpacity style={st.btn} onPress={() => {
            if (isCamera) {
              Linking.openURL('app-settings:');
            } else {
              Linking.openURL('App-prefs:SCREEN_TIME');
            }
          }} activeOpacity={0.8}>
            <Ionicons name="settings-outline" size={18} color="#F7F4EE" />
            <Text style={st.btnText}> Open Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.retryBtn} onPress={onAllow} activeOpacity={0.8}>
            <Text style={st.retryText}>I've enabled it — try again</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={st.btn} onPress={onAllow} activeOpacity={0.8}>
          <Text style={st.btnText}>
            {isCamera ? 'Allow Camera Access' : 'Allow Screen Time Access'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={onSkip} activeOpacity={0.7}>
        <Text style={st.skipText}>Not now</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Inline Banner (for home screen) ─────────────────────

interface PermissionBannerProps {
  type: 'camera' | 'screenTime';
  onPress: () => void;
  onDismiss: () => void;
}

export function PermissionBanner({ type, onPress, onDismiss }: PermissionBannerProps) {
  const isCamera = type === 'camera';

  return (
    <View style={st.banner}>
      <View style={st.bannerContent}>
        <Ionicons
          name={isCamera ? 'camera-outline' : 'shield-outline'}
          size={20}
          color="#D4820A"
        />
        <View style={st.bannerText}>
          <Text style={st.bannerTitle}>
            {isCamera ? 'Camera not enabled' : 'App blocking not enabled'}
          </Text>
          <Text style={st.bannerSub}>
            {isCamera
              ? 'Enable camera for accurate Focus Scores'
              : 'Enable Screen Time to block doom scroll apps'}
          </Text>
        </View>
      </View>
      <View style={st.bannerActions}>
        <TouchableOpacity style={st.bannerBtn} onPress={onPress} activeOpacity={0.8}>
          <Text style={st.bannerBtnText}>Enable</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDismiss} activeOpacity={0.7}>
          <Ionicons name="close" size={18} color="#B0A090" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  // Full screen prompt
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#F7F4EE' },
  title: { fontFamily: 'Outfit_800ExtraBold', fontSize: 26, color: '#1C1208', textAlign: 'center', marginTop: 16 },
  body: { fontFamily: 'Outfit_400Regular', fontSize: 15, color: '#8A7A60', textAlign: 'center', lineHeight: 22, marginTop: 12, marginBottom: 16 },
  privacyCard: { backgroundColor: '#EDE9E0', borderRadius: 14, padding: 14, gap: 10, marginBottom: 20 },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  privacyText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#1C1208', flex: 1 },
  deniedText: { fontFamily: 'Outfit_400Regular', fontSize: 13, color: '#E67E22', textAlign: 'center', marginBottom: 12 },
  btn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  btnText: { fontFamily: 'Outfit_700Bold', fontSize: 16, color: '#F7F4EE' },
  retryBtn: { backgroundColor: '#EDE9E0', borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  retryText: { fontFamily: 'Outfit_700Bold', fontSize: 15, color: '#1C1208' },
  skipText: { fontFamily: 'Outfit_400Regular', fontSize: 14, color: '#B0A090', textAlign: 'center', marginTop: 16 },

  // Banner
  banner: { backgroundColor: '#FFF8F0', borderRadius: 14, borderWidth: 1, borderColor: '#D4820A33', padding: 14, marginBottom: 12 },
  bannerContent: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  bannerText: { flex: 1 },
  bannerTitle: { fontFamily: 'Outfit_700Bold', fontSize: 14, color: '#1C1208' },
  bannerSub: { fontFamily: 'Outfit_400Regular', fontSize: 12, color: '#8A7A60', marginTop: 2 },
  bannerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerBtn: { backgroundColor: '#D4820A', borderRadius: 100, paddingVertical: 10, paddingHorizontal: 20 },
  bannerBtnText: { fontFamily: 'Outfit_700Bold', fontSize: 13, color: '#F7F4EE' },
});
