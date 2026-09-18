import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, RADIUS, SHADOWS } from '../../constants/designSystem';

interface PhotoProofCaptureProps {
  title: string;
  description: string;
  dayNumber: number;
  onComplete: (photoUri: string) => void;
  onCancel: () => void;
}

export function PhotoProofCapture({
  title,
  description,
  dayNumber,
  onComplete,
  onCancel,
}: PhotoProofCaptureProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        setPhotoUri(photo.uri);
      }
    } catch {
      // Photo capture failed — stay on capture screen
    }
  };

  const handleConfirm = () => {
    if (photoUri) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(photoUri);
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
  };

  // Permission not granted
  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission needed for photo proof</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Photo preview
  if (photoUri) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Text style={styles.previewTitle}>Photo Proof</Text>
          <Text style={styles.previewSubtitle}>Day {dayNumber}: {title}</Text>

          <View style={styles.imageContainer}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          </View>

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm} activeOpacity={0.8}>
              <Text style={styles.confirmButtonText}>LOOKS GOOD</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleRetake} style={styles.retakeButton}>
              <Text style={styles.retakeText}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Camera capture
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.captureContainer}>
        <View style={styles.infoBar}>
          <Text style={styles.infoTitle}>{title}</Text>
          <Text style={styles.infoDescription}>{description}</Text>
        </View>

        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          />
        </View>

        <View style={styles.captureActions}>
          <TouchableOpacity style={styles.captureButton} onPress={handleCapture} activeOpacity={0.8}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDeep,
  },

  // Permission
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  permissionText: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  permissionButtonText: {
    fontFamily: FONTS.headingBold,
    fontSize: 15,
    color: '#1C1208',
  },

  // Capture
  captureContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  infoBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 4,
  },
  infoTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  infoDescription: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  cameraContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  captureActions: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
  },

  // Preview
  previewContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  previewTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 22,
    color: COLORS.textPrimary,
  },
  previewSubtitle: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  imageContainer: {
    flex: 1,
    borderRadius: RADIUS.card,
    overflow: 'hidden',
    marginBottom: 20,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  previewActions: {
    gap: 8,
  },
  confirmButton: {
    backgroundColor: COLORS.coral,
    borderRadius: RADIUS.button,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOWS.coralButton,
  },
  confirmButtonText: {
    fontFamily: FONTS.headingBold,
    fontSize: 16,
    color: '#1C1208',
    letterSpacing: 1,
  },
  retakeButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  retakeText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    color: COLORS.textMuted,
  },

  // Shared
  cancelButton: {
    paddingVertical: 8,
  },
  cancelText: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
