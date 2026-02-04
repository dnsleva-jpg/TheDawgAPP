import * as MediaLibrary from 'expo-media-library';

/**
 * Simple video save - just save to camera roll, no processing
 */
export async function saveVideoToPhotos(
  videoUri: string
): Promise<void> {
  console.log('📹 Saving video to camera roll...');
  console.log('📹 Video URI:', videoUri);
  
  try {
    // Request permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Media library permission not granted');
    }
    
    // Save to Photos
    await MediaLibrary.createAssetAsync(videoUri);
    console.log('📹 ✅ Video saved to camera roll!');
    
  } catch (error: any) {
    console.error('📹 ❌ Save failed:', error);
    console.error('📹 Error message:', error?.message);
    throw error;
  }
}
