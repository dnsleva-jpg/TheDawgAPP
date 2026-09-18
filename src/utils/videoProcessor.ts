import * as MediaLibrary from 'expo-media-library';

/**
 * Simple video save - just save to camera roll, no processing
 */
export async function saveVideoToPhotos(
  videoUri: string
): Promise<void> {
  // Request permissions
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Media library permission not granted');
  }
  
  // Save to Photos
  await MediaLibrary.createAssetAsync(videoUri);
}
