import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Camera, CameraView } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../constants/colors';

interface PrepareScreenProps {
  durationMinutes: number;
  onReady: () => void;
  onCancel: () => void;
}

export function PrepareScreen({ 
  durationMinutes, 
  onReady,
  onCancel,
}: PrepareScreenProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  // Request camera permission when screen loads
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onReady();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, onReady]);

  const handleReady = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCountdown(3);
  };

  if (countdown !== null) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        {hasPermission ? (
          <CameraView style={styles.camera} facing="front">
            <View style={styles.cameraOverlay}>
              <SafeAreaView style={styles.countdownContainer}>
                <Text style={styles.countdownText}>{countdown}</Text>
                <Text style={styles.countdownLabel}>Get ready...</Text>
              </SafeAreaView>
            </View>
          </CameraView>
        ) : (
          <SafeAreaView style={styles.countdownContainer}>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.countdownLabel}>Get ready...</Text>
          </SafeAreaView>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Prepare Your Space</Text>
          <Text style={styles.duration}>{durationMinutes} minute session</Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <InstructionItem text="Find a quiet spot with no distractions" />
          <InstructionItem text="Turn off TV, music, and notifications" />
          <InstructionItem text="Prop your phone up so it can see you" />
          <InstructionItem text="Sit or stand comfortably - you'll stay still" />
          <InstructionItem text="No phone, no scrolling, no fidgeting" />
          <InstructionItem text="Just exist for the next few minutes" />
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.readyButton}
            onPress={handleReady}
            activeOpacity={0.8}
          >
            <Text style={styles.readyButtonText}>I'M READY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface InstructionItemProps {
  text: string;
}

function InstructionItem({ text }: InstructionItemProps) {
  return (
    <View style={styles.instructionItem}>
      <View style={styles.bullet} />
      <Text style={styles.instructionText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.coral,
    letterSpacing: 1,
    textAlign: 'center',
  },
  duration: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
    textAlign: 'center',
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    paddingVertical: 40,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.coral,
    marginTop: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.white,
    lineHeight: 26,
  },
  buttonsContainer: {
    gap: 12,
  },
  readyButton: {
    backgroundColor: COLORS.coral,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.coral,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  readyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 2,
  },
  backButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  countdownContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '900',
    color: COLORS.coral,
    letterSpacing: 4,
  },
  countdownLabel: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
});
