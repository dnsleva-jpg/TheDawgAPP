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
import { COLORS as DS_COLORS, FONTS, BRAND, RADIUS, SHADOWS } from '../constants/designSystem';
import { UserStats } from '../types';
import { getSessions } from '../utils/storage';
import { calculateStats, formatTotalTime } from '../utils/stats';
import { saveVideoToPhotos } from '../utils/videoProcessor';

interface ResultsScreenProps {
  completedSeconds: number;
  videoUri?: string;
  stillnessPercent?: number;
  blinksCount?: number;
  onGoHome: () => void;
}

export function ResultsScreen({ completedSeconds, videoUri, stillnessPercent = 0, blinksCount = 0, onGoHome }: ResultsScreenProps) {
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
  
  // Face tracking stats
  const hasStats = stillnessPercent > 0 || blinksCount > 0;
  
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
    return `I just Raw Dawg'd ${selectedLocation} 🐕 @TheRAWDAWGapp #rawdawg #dopaminedetox`;
  };

  const [captionCopied, setCaptionCopied] = useState(false);

  const handleCopyCaption = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const caption = getCaption();
    
    try {
      await Clipboard.setStringAsync(caption);
      console.log('📋 ✅ Caption copied:', caption);
      
      setCaptionCopied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset after 3 seconds
      setTimeout(() => setCaptionCopied(false), 3000);
    } catch (error) {
      console.error('📋 ❌ Copy failed:', error);
      Alert.alert('Copy Failed', 'Could not copy caption to clipboard');
    }
  };

  const handleShareToPlatform = async (platform: 'tiktok' | 'instagram') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    console.log(`📤 ========== SHARE TO ${platform.toUpperCase()} ==========`);
    
    try {
      setIsProcessingVideo(true);
      
      // Save video to camera roll if we have one
      if (videoUri) {
        console.log('📤 Saving video to camera roll...');
        await saveVideoToPhotos(videoUri);
        console.log('📤 ✅ Video saved!');
      }
      
      setIsProcessingVideo(false);
      
      // Give user clear instructions
      Alert.alert(
        '✅ Video Saved!',
        videoUri 
          ? `Video saved to camera roll!\n\n💡 TIP:\n1. Copy the caption again before opening ${platform === 'tiktok' ? 'TikTok' : 'Instagram'}\n2. Use their speed tool to speed it up 20x`
          : `Caption is ready! Copy it before opening ${platform === 'tiktok' ? 'TikTok' : 'Instagram'}.`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: `Open ${platform === 'tiktok' ? 'TikTok' : 'Instagram'}`,
            onPress: async () => {
              // Copy caption RIGHT before opening
              const caption = getCaption();
              await Clipboard.setStringAsync(caption);
              console.log('📋 ✅ Caption re-copied before opening app');
              
              // Small delay to ensure clipboard sync
              setTimeout(async () => {
                console.log(`📤 Opening ${platform}...`);
                
                if (platform === 'tiktok') {
                  // Try multiple TikTok URL schemes
                  const tiktokUrls = [
                    'tiktok://',
                    'snssdk1233://',
                    'https://www.tiktok.com/upload'
                  ];
                  
                  let opened = false;
                  for (const url of tiktokUrls) {
                    try {
                      console.log(`📤 Trying TikTok URL: ${url}`);
                      await Linking.openURL(url);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      setShowCaptionPreview(false);
                      opened = true;
                      break;
                    } catch (error) {
                      console.log(`📤 Failed with ${url}, trying next...`);
                      continue;
                    }
                  }
                  
                  if (!opened) {
                    console.log('📤 ❌ All TikTok URLs failed');
                  }
                } else {
                  // Instagram
                  try {
                    await Linking.openURL('instagram://camera');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setShowCaptionPreview(false);
                  } catch (error) {
                    console.log('📤 Instagram app couldn\'t be opened, using fallback...');
                    await Linking.openURL('https://www.instagram.com/');
                    setShowCaptionPreview(false);
                  }
                }
              }, 500); // 500ms delay for clipboard to sync
            }
          }
        ]
      );
      
      console.log('📤 ✅ Share flow completed');
      
    } catch (error: any) {
      setIsProcessingVideo(false);
      console.log('📤 ❌ Error:', error);
      Alert.alert(
        'Error', 
        `Could not save video. Error: ${error.message}`
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
      console.log('📹 Saving video...');
      
      // Save video to camera roll first
      await saveVideoToPhotos(videoUri);
      
      console.log('📹 ✅ Video saved! Opening location picker...');
      
      // Now show location picker, same as Share button
      setShowLocationPicker(true);
      
    } catch (error: any) {
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

        {/* Face Tracking Stats */}
        {hasStats && (
          <View style={styles.faceStatsContainer}>
            <View style={styles.faceStatsRow}>
              <View style={styles.faceStatItem}>
                <Text style={styles.faceStatValue}>{stillnessPercent}%</Text>
                <Text style={styles.faceStatLabel}>stillness</Text>
              </View>
              <View style={styles.faceStatDivider} />
              <View style={styles.faceStatItem}>
                <Text style={styles.faceStatValue}>{blinksCount}</Text>
                <Text style={styles.faceStatLabel}>blinks</Text>
              </View>
            </View>
          </View>
        )}

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
              {isProcessingVideo ? 'Saving Video... 📹' : 'Your Caption 📝'}
            </Text>
            
            {isProcessingVideo && (
              <View style={styles.processingContainer}>
                <Text style={styles.processingText}>
                  Saving video to camera roll...
                </Text>
                <Text style={styles.processingSubtext}>
                  Just a moment
                </Text>
              </View>
            )}
            
            {!isProcessingVideo && (
              <>
                <View style={styles.captionPreviewContainer}>
                  <Text style={styles.captionPreviewText}>{getCaption()}</Text>
                </View>
                
                {/* Copy Caption Button with Visual Feedback */}
                <TouchableOpacity
                  style={[
                    styles.copyButton,
                    captionCopied && styles.copyButtonSuccess
                  ]}
                  onPress={handleCopyCaption}
                  activeOpacity={0.8}
                >
                  <Text style={styles.copyButtonText}>
                    {captionCopied ? '✅ Copied!' : '📋 Copy Caption'}
                  </Text>
                </TouchableOpacity>
                
                <Text style={styles.instructionText}>
                  👆 Copy caption first, then open your app
                </Text>
                
                <View style={styles.platformButtons}>
                  <TouchableOpacity
                    style={[styles.platformButton, styles.tiktokButton]}
                    onPress={() => handleShareToPlatform('tiktok')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.platformButtonText}>📱 Open TikTok</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.platformButton, styles.instagramButton]}
                    onPress={() => handleShareToPlatform('instagram')}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.platformButtonText}>📸 Open Instagram</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowCaptionPreview(false);
                    setCaptionCopied(false);
                  }}
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
  // Brand Kit - Results Screen
  container: {
    flex: 1,
    backgroundColor: DS_COLORS.bgDeep, // Brand kit background
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
    fontSize: 48, // Reduced from 80 per brand kit
  },
  title: {
    fontSize: 24, // 1.5rem - reduced from 28
    fontFamily: FONTS.headingBold,
    color: DS_COLORS.verified, // Green for SESSION COMPLETE per brand kit
    letterSpacing: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 14, // 0.9rem - reduced from 16
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    textAlign: 'center',
  },
  timeContainer: {
    alignItems: 'center',
    gap: 8,
  },
  timeDisplay: {
    fontSize: 80, // 5rem - kept large but matching brand kit
    fontFamily: FONTS.display, // Bebas Neue for time!
    color: DS_COLORS.textPrimary, // Warm white per brand kit
    letterSpacing: 2,
  },
  timeLabel: {
    fontSize: 13, // 0.8rem - smaller
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  faceStatsContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  faceStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  faceStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  faceStatValue: {
    fontSize: 32,
    fontFamily: FONTS.display,
    color: DS_COLORS.coral,
  },
  faceStatLabel: {
    fontSize: 12,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  faceStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statsSection: {
    gap: 16,
  },
  statsTitle: {
    fontSize: 14,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textSecondary,
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
    backgroundColor: DS_COLORS.bgSurface, // Brand kit surface color
    padding: 12,
    borderRadius: RADIUS.card, // Brand kit card radius
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)', // Brand kit card border
    gap: 4,
  },
  miniStatEmoji: {
    fontSize: 16,
  },
  miniStatValue: {
    fontSize: 18,
    fontFamily: FONTS.monoBold,
    color: DS_COLORS.coral,
  },
  miniStatLabel: {
    fontSize: 10,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textMuted,
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
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
  },
  // Brand Kit - Primary CTA Button
  shareButton: {
    backgroundColor: DS_COLORS.coral,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: RADIUS.button, // 14px per brand kit
    alignItems: 'center',
    ...SHADOWS.coralButton, // Brand kit coral button shadow
  },
  shareButtonDisabled: {
    backgroundColor: DS_COLORS.textDisabled,
    shadowOpacity: 0,
  },
  shareButtonText: {
    fontSize: 16, // 1rem
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 0,
  },
  // Brand Kit - Secondary Button (Outline)
  goAgainButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 77, 106, 0.4)', // Brand kit secondary border
  },
  goAgainButtonText: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: DS_COLORS.coral,
    letterSpacing: 0,
  },
  doneButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textSecondary,
    letterSpacing: 1,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DS_COLORS.bgSurface, // Brand kit surface color
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: FONTS.headingBold,
    color: DS_COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  locationsList: {
    maxHeight: 400,
  },
  // Brand Kit - Location Picker Cards
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DS_COLORS.bgSurface, // Brand kit surface
    padding: 18,
    borderRadius: RADIUS.card,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)', // Brand kit card border
  },
  locationEmoji: {
    fontSize: 28,
    marginRight: 16,
  },
  locationText: {
    fontSize: 18,
    fontFamily: FONTS.headingMedium,
    color: DS_COLORS.textPrimary,
    textTransform: 'capitalize',
  },
  customInputContainer: {
    gap: 12,
  },
  customInput: {
    backgroundColor: DS_COLORS.bgDeep,
    color: DS_COLORS.textPrimary,
    fontSize: 18,
    fontFamily: FONTS.headingMedium,
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: DS_COLORS.coral,
  },
  customSubmitButton: {
    backgroundColor: DS_COLORS.coral,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  customSubmitButtonText: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 1,
  },
  customCancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  customCancelButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textSecondary,
  },
  modalCloseButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textSecondary,
  },
  processingContainer: {
    backgroundColor: DS_COLORS.bgDeep,
    padding: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DS_COLORS.coral,
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    textAlign: 'center',
  },
  // Brand Kit - Caption Card
  captionPreviewContainer: {
    backgroundColor: DS_COLORS.bgSurface,
    padding: 20,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)', // Brand kit card border
    marginBottom: 24,
  },
  captionPreviewText: {
    fontSize: 16,
    fontFamily: FONTS.body,
    color: DS_COLORS.textPrimary,
    lineHeight: 24,
    textAlign: 'center',
  },
  // Brand Kit - Copy Caption Button
  copyButton: {
    backgroundColor: DS_COLORS.coral,
    paddingVertical: 18,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    marginBottom: 8,
    ...SHADOWS.coralButton,
  },
  copyButtonSuccess: {
    backgroundColor: DS_COLORS.verified, // Brand kit verified green
  },
  copyButtonText: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 1,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textMuted, // Brand kit muted text
    textAlign: 'center',
    marginBottom: 16,
  },
  platformButtons: {
    gap: 12,
  },
  // Brand Kit - Platform Buttons
  platformButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: RADIUS.button,
    alignItems: 'center',
  },
  tiktokButton: {
    backgroundColor: DS_COLORS.coral, // Use brand coral for consistency
    ...SHADOWS.coralButton,
  },
  instagramButton: {
    backgroundColor: DS_COLORS.coral, // Use brand coral for consistency
    ...SHADOWS.coralButton,
  },
  platformButtonText: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 0,
  },
});
