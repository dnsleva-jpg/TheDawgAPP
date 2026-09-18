import React, { useEffect, useState } from 'react';
import * as Font from 'expo-font';

interface AppLoaderProps {
  children: React.ReactNode;
}

export function AppLoader({ children }: AppLoaderProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      Outfit_400Regular: require('@expo-google-fonts/outfit/400Regular/Outfit_400Regular.ttf'),
      Outfit_700Bold: require('@expo-google-fonts/outfit/700Bold/Outfit_700Bold.ttf'),
      Outfit_800ExtraBold: require('@expo-google-fonts/outfit/800ExtraBold/Outfit_800ExtraBold.ttf'),
    })
      .then(() => setLoaded(true))
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  return <>{children}</>;
}
