import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import useAuth from '../hooks/useAuth';

export default function AuthTestScreen() {
  const { user, loading, signInWithApple, signOut } = useAuth();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Signed in as {user.email ?? user.id}</Text>
        <Text style={styles.signOutBtn} onPress={signOut}>
          Sign Out
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.heading}>Auth Test</Text>
      {Platform.OS === 'ios' ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={{ width: 280, height: 44 }}
          onPress={async () => {
            try {
              await signInWithApple();
            } catch (err) {
              // user cancelled or error — already logged in context
            }
          }}
        />
      ) : (
        <Text style={styles.text}>Apple Sign-In is only available on iOS</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#0d0d12',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heading: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  text: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  signOutBtn: {
    color: '#e94560',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    padding: 12,
  },
});
