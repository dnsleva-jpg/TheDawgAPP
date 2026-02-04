import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Linking,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { formatTimeDisplay, formatRecordTime } from '../utils/formatTime';
import { COLORS } from '../constants/colors';
import { UserStats } from '../types';
import { getSessions } from '../utils/storage';
import { calculateStats, formatTotalTime } from '../utils/stats';
import { saveVideoToPhotos } from '../utils/videoProcessor';

interface ResultsScreenProps {
  completedSeconds: number;
  videoUri?: string;
  onGoHome: () => void;
}

export function ResultsScreen({ completedSeconds, videoUri, onGoHome }: ResultsScreenProps) {
  // Safety check: ensure completedSeconds is valid
  const safeCompletedSeconds = (completedSeconds >= 0 && !isNaN(completedSeconds)) 
    ? completedSeconds 
    : 0;
  
  // Debug logging
  console.log('🏆 ResultsScreen received:');
  console.log('  completedSeconds (raw):', completedSeconds);
  console.log('  safeCompletedSeconds:', safeCompletedSeconds);
  console.log('  videoUri:', videoUri);
  console.log('  formatted time:', formatTimeDisplay(safeCompletedSeconds));
  
  // Generate random percentage (80-99%)
  const [randomPercentage] = useState(Math.floor(Math.random() * 20) + 80);
  
  // Location picker state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showCaptionPreview, setShowCaptionPreview] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [customLocation, setCustomLocation] = useState<string>('');
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  
  // Location options
  const locations = [
    { emoji: '✈️', text: 'on a plane' },
    { emoji: '🏠', text: 'at home' },
    { emoji: '💼', text: 'at work' },
    { emoji: '🏫', text: 'in class' },
    { emoji: '🚌', text: 'on the bus' },
    { emoji: '🛋️', text: 'on the couch' },
    { emoji: '🛏️', text: 'in bed' },
    { emoji: '☕', text: 'at a cafe' },
    { emoji: '🏋️', text: 'at the gym' },
    { emoji: '🧘', text: 'meditating' },
    { emoji: '📍', text: 'custom' },
  ];
  
  // Load stats
  const [stats, setStats] = useState<UserStats>({
    totalSessions: 0,
    totalTimeSeconds: 0,
    longestSessionSeconds: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const sessions = await getSessions();
      const calculatedStats = calculateStats(sessions);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };


  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLocationPicker(true);
  };

  const handleLocationSelect = (location: { emoji: string; text: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (location.text === 'custom') {
      // Show custom input
      setSelectedLocation('custom');
      return;
    }
    
    setSelectedLocation(`${location.text} ${location.emoji}`);
    setShowLocationPicker(false);
    setShowCaptionPreview(true);
  };

  const handleCustomLocationSubmit = () => {
    if (!customLocation.trim()) {
      Alert.alert('Enter Location', 'Please enter a location');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLocation(`${customLocation.trim()} 📍`);
    setShowLocationPicker(false);
    setShowCaptionPreview(true);
  };

  const getCaption = () => {
    return `I just Raw Dawg'd ${selectedLocation} 🐕 Speed up 20x for the full effect! @TheRAWDAWGapp #rawdawg #dopaminedetox`;
  };

  const handleShareToPlatform = async (platform: 'tiktok' | 'instagram') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    console.log(`📤 ========== SHARE TO ${platform.toUpperCase()} ==========`);
    
    const caption = getCaption();
    
    try {
      setIsProcessingVideo(true);
      
      // Copy caption to clipboard
      await Clipboard.setStringAsync(caption);
      console.log('📤 ✅ Caption copied:', caption);
      
      // Save video to camera roll if we have one
      if (videoUri) {
        console.log('📤 Saving video to camera roll...');
        await saveVideoToPhotos(videoUri);
        console.log('📤 ✅ Video saved!');
      }
      
      setIsProcessingVideo(false);
      setShowCaptionPreview(false);
      
      // Show success message with platform-specific button
      Alert.alert(
        '✅ Ready to Share!',
        videoUri 
          ? 'Video saved to camera roll!\n\nCaption copied to clipboard.\n\n💡 TIP: Use the speed tool in TikTok/Instagram to speed it up 20x!'
          : 'Caption copied to clipboard!',
        [
          {
            text: `Open ${platform === 'tiktok' ? 'TikTok' : 'Instagram'}`,
            onPress: async () => {
              const url = platform === 'tiktok' 
                ? 'https://www.tiktok.com/upload'
                : 'instagram://camera';
              
              console.log(`📤 Opening ${platform}...`);
              
              try {
                await Linking.openURL(url);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (error) {
                if (platform === 'instagram') {
                  await Linking.openURL('https://www.instagram.com/');
                }
              }
            }
          }
        ]
      );
      
      console.log('📤 ✅ Share flow completed');
      
    } catch (error: any) {
      setIsProcessingVideo(false);
      console.log('📤 ❌ Error:', error);
      Alert.alert(
        'Caption Copied!', 
        `Caption copied to clipboard! Open ${platform === 'tiktok' ? 'TikTok' : 'Instagram'} manually and upload from camera roll. 📋`
      );
    }
  };

  const handleCreateTimelapse = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!videoUri) {
      Alert.alert('No Video', 'No video was recorded during this session.');
      return;
    }
    
    try {
      setIsProcessingVideo(true);
      console.log('📹 Saving video...');
      
      // Save video to camera roll
      await saveVideoToPhotos(videoUri);
      
      // Copy caption (but only if location is selected for SHARE flow)
      // For SAVE VIDEO button, skip caption
      
      setIsProcessingVideo(false);
      
      Alert.alert(
        '✅ Saved!',
        'Video saved to camera roll!\n\n💡 TIP: Use the speed tool in TikTok/Instagram to speed it up 20x!',
        [
          { text: 'Done', style: 'cancel' },
          {
            text: 'Open TikTok',
            onPress: () => Linking.openURL('https://www.tiktok.com/upload')
          },
          {
            text: 'Open Instagram',
            onPress: () => Linking.openURL('instagram://camera').catch(() => 
              Linking.openURL('https://www.instagram.com/')
            )
          }
        ]
      );
      
      console.log('📹 ✅ Video + Stats card saved!');
      
    } catch (error: any) {
      setIsProcessingVideo(false);
      console.error('📹 ❌ Save failed:', error);
      Alert.alert('Error', `Failed to save: ${error.message}`);
    }
  };

  const handleGoAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onGoHome();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        {/* Success Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>🏆</Text>
          <Text style={styles.title}>SESSION COMPLETE</Text>
          <Text style={styles.subtitle}>
            You did it. You literally did nothing.
          </Text>
        </View>

        {/* Time Completed */}
        <View style={styles.timeContainer}>
          <Text style={styles.timeDisplay}>{formatTimeDisplay(safeCompletedSeconds)}</Text>
          <Text style={styles.timeLabel}>completed</Text>
        </View>

        {/* Fun Stat */}
        <View style={styles.statContainer}>
          <Text style={styles.statText}>
            You out-relaxed {randomPercentage}% of humans
          </Text>
        </View>

        {/* Stats Grid */}
        {stats.totalSessions > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            <View style={styles.statsGrid}>
              <View style={styles.miniStatCard}>
                <Text style={styles.miniStatEmoji}>✓</Text>
                <Text style={styles.miniStatValue}>{stats.totalSessions}</Text>
                <Text style={styles.miniStatLabel}>Done</Text>
              </View>
              
              <View style={styles.miniStatCard}>
                <Text style={styles.miniStatEmoji}>⏱️</Text>
                <Text style={styles.miniStatValue}>
                  {formatTotalTime(stats.totalTimeSeconds)}
                </Text>
                <Text style={styles.miniStatLabel}>Total</Text>
              </View>
              
              <View style={styles.miniStatCard}>
                <Text style={styles.miniStatEmoji}>🔥</Text>
                <Text style={styles.miniStatValue}>{stats.currentStreak}</Text>
                <Text style={styles.miniStatLabel}>Streak</Text>
              </View>
              
              <View style={styles.miniStatCard}>
                <Text style={styles.miniStatEmoji}>🏆</Text>
                <Text style={styles.miniStatValue}>
                  {formatRecordTime(stats.longestSessionSeconds)}
                </Text>
                <Text style={styles.miniStatLabel}>Record</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          {videoUri && (
            <TouchableOpacity
              style={styles.timelapseButton}
              onPress={handleCreateTimelapse}
              activeOpacity={0.8}
              disabled={isProcessingVideo}
            >
              <Text style={styles.timelapseButtonText}>
                {isProcessingVideo ? 'SAVING...' : '📹 SAVE VIDEO'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Text style={styles.shareButtonText}>SHARE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.goAgainButton}
            onPress={handleGoAgain}
            activeOpacity={0.8}
          >
            <Text style={styles.goAgainButtonText}>GO AGAIN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={onGoHome}
            activeOpacity={0.8}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Where did you Raw Dawg? 🐕</Text>
            
            <ScrollView style={styles.locationsList} showsVerticalScrollIndicator={false}>
              {selectedLocation === 'custom' ? (
                <View style={styles.customInputContainer}>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Enter location..."
                    placeholderTextColor={COLORS.gray}
                    value={customLocation}
                    onChangeText={setCustomLocation}
                    autoFocus
                    onSubmitEditing={handleCustomLocationSubmit}
                  />
                  <TouchableOpacity
                    style={styles.customSubmitButton}
                    onPress={handleCustomLocationSubmit}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.customSubmitButtonText}>Done</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.customCancelButton}
                    onPress={() => {
                      setSelectedLocation('');
                      setCustomLocation('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.customCancelButtonText}>Back</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {locations.map((location, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.locationOption}
                      onPress={() => handleLocationSelect(location)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.locationEmoji}>{location.emoji}</Text>
                      <Text style={styles.locationText}>{location.text}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
            
            {selectedLocation !== 'custom' && (
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowLocationPicker(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Caption Preview Modal */}
      <Modal
        visible={showCaptionPreview}
        animationType="slide"
        transparent={true}
        onRequestClose={() => !isProcessingVideo && setShowCaptionPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isProcessingVideo ? 'Creating 20x Timelapse... 🎬' : 'Your Caption 📝'}
            </Text>
            
            {isProcessingVideo && (
              <View style={styles.processingContainer}>
                <Text style={styles.processingText}>
                  Processing your video with 20x speedup...
                </Text>
                <Text style={styles.processingSubtext}>
                  This will take just a few seconds
                </Text>
              </View>
            )}
            
            {!isProcessingVideo && (
              <>
                <View style={styles.captionPreviewContainer}>
                  <Text style={styles.captionPreviewText}>{getCaption()}</Text>
                </View>
                
                <View style={styles.platformButtons}>
                  <TouchableOpacity
                    style={[styles.platformButton, styles.tiktokButton]}
                    onPress={() => handleShareToPlatform('tiktok')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.platformButtonText}>📱 Copy & Open TikTok</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.platformButton, styles.instagramButton]}
                    onPress={() => handleShareToPlatform('instagram')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.platformButtonText}>📸 Copy & Open Instagram</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowCaptionPreview(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalCloseButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    justifyContent: 'center',
    gap: 48,
  },
  header: {
    alignItems: 'center',
    gap: 12,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.coral,
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.gray,
    textAlign: 'center',
  },
  timeContainer: {
    alignItems: 'center',
    gap: 8,
  },
  timeDisplay: {
    fontSize: 72,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 2,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  statContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.lightGray,
    textAlign: 'center',
  },
  statsSection: {
    gap: 16,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  miniStatCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: COLORS.darkSecondary,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    gap: 4,
  },
  miniStatEmoji: {
    fontSize: 16,
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.coral,
  },
  miniStatLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actions: {
    gap: 12,
  },
  timelapseButton: {
    backgroundColor: '#9B59B6', // Purple for timelapse
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#9B59B6',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  timelapseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 2,
  },
  shareButton: {
    backgroundColor: COLORS.coral,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.coral,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  shareButtonDisabled: {
    backgroundColor: COLORS.darkGray,
    shadowOpacity: 0,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 2,
  },
  goAgainButton: {
    backgroundColor: 'transparent',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.coral,
  },
  goAgainButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.coral,
    letterSpacing: 2,
  },
  doneButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
    letterSpacing: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.darkSecondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 24,
  },
  locationsList: {
    maxHeight: 400,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark,
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
  },
  locationEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  locationText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    textTransform: 'capitalize',
  },
  customInputContainer: {
    gap: 12,
  },
  customInput: {
    backgroundColor: COLORS.dark,
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.coral,
  },
  customSubmitButton: {
    backgroundColor: COLORS.coral,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  customSubmitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
  customCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  customCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
  modalCloseButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray,
  },
  processingContainer: {
    backgroundColor: COLORS.dark,
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.coral,
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray,
    textAlign: 'center',
  },
  captionPreviewContainer: {
    backgroundColor: COLORS.dark,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.darkGray,
    marginBottom: 24,
  },
  captionPreviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    lineHeight: 24,
    textAlign: 'center',
  },
  platformButtons: {
    gap: 12,
  },
  platformButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  tiktokButton: {
    backgroundColor: COLORS.coral,
  },
  instagramButton: {
    backgroundColor: '#E1306C', // Instagram pink
  },
  platformButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 1,
  },
});
