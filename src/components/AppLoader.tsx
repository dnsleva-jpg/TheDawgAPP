import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as Font from 'expo-font';
import { FONT_FILES } from '../constants/fonts';
import { COLORS as DS_COLORS } from '../constants/designSystem';

interface AppLoaderProps {
  children: React.ReactNode;
}

/**
 * AppLoader - Handles font loading and displays splash screen
 * Shows loading screen until all custom fonts are loaded
 */
export function AppLoader({ children }: AppLoaderProps) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = async () => {
    try {
      await Font.loadAsync(FONT_FILES);
      setFontsLoaded(true);
    } catch (err) {
      setError('Failed to load fonts. Using system fonts as fallback.');
      // Continue anyway with system fonts as fallback
      setFontsLoaded(true);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingTitle}>D.A.W.G.</Text>
        <ActivityIndicator size="large" color={DS_COLORS.coral} style={styles.spinner} />
        <Text style={styles.loadingText}>Loading fonts...</Text>
      </View>
    );
  }

  

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: DS_COLORS.bgDeep,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loadingTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  spinner: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: DS_COLORS.textSecondary,
    fontWeight: '500',
  },
});
