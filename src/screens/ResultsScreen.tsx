import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import ViewShot from 'react-native-view-shot';
import { formatTimeDisplay, formatRecordTime } from '../utils/formatTime';
import { COLORS } from '../constants/colors';
import { COLORS as DS_COLORS, FONTS, BRAND, RADIUS, SHADOWS } from '../constants/designSystem';
import { UserStats } from '../types';
import { getSessions } from '../utils/storage';
import { calculateStats, formatTotalTime } from '../utils/stats';
import { saveVideoToPhotos } from '../utils/videoProcessor';
import { ShareCard } from '../components/ShareCard';
import type { SessionResults } from '../scoring/scoringEngine';

interface ResultsScreenProps {
  completedSeconds: number;
  videoUri?: string;
  stillnessPercent?: number;
  blinksCount?: number;
  scoringResults?: SessionResults | null;
  onGoHome: () => void;
}

export function ResultsScreen({ completedSeconds, videoUri, stillnessPercent = 0, blinksCount = 0, scoringResults, onGoHome }: ResultsScreenProps) {
  // Safety check: ensure completedSeconds is valid
  const safeCompletedSeconds = (completedSeconds >= 0 && !isNaN(completedSeconds)) 
    ? completedSeconds 
    : 0;
  
  // Face tracking stats
  const hasStats = stillnessPercent > 0 || blinksCount > 0;
  
  // Share card state
  const shareCardRef = useRef<ViewShot>(null);
  const [showShareCard, setShowShareCard] = useState(false);
  const [isSharingCard, setIsSharingCard] = useState(false);

  // Location picker state (old share flow fallback)
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
      // Stats failed to load — defaults remain
    }
  };


  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (scoringResults) {
      // New share flow: show premium achievement card
      setShowShareCard(true);
    } else {
      // Old share flow: location picker → caption → platform
      setShowLocationPicker(true);
    }
  };

  const captureShareCard = async (): Promise<string | null> => {
    if (!shareCardRef.current?.capture) return null;
    try {
      return await shareCardRef.current.capture();
    } catch {
      return null;
    }
  };

  const handleShareCard = async () => {
    setIsSharingCard(true);
    try {
      const uri = await captureShareCard();
      if (uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share your Raw Dawg score' });
      }
    } catch (error: any) {
      Alert.alert('Share Failed', error?.message ?? 'Could not share the card.');
    } finally {
      setIsSharingCard(false);
    }
  };

  const handleSaveCard = async () => {
    setIsSharingCard(true);
    try {
      const uri = await captureShareCard();
      if (!uri) throw new Error('Could not capture card');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please allow photo library access to save the card.');
        return;
      }
      await MediaLibrary.createAssetAsync(uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved!', 'Card saved to your camera roll.');
    } catch (error: any) {
      Alert.alert('Save Failed', error?.message ?? 'Could not save the card.');
    } finally {
      setIsSharingCard(false);
    }
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
      setCaptionCopied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset after 3 seconds
      setTimeout(() => setCaptionCopied(false), 3000);
    } catch (error) {
      Alert.alert('Copy Failed', 'Could not copy caption to clipboard');
    }
  };

  const handleShareToPlatform = async (platform: 'tiktok' | 'instagram') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (__DEV__) console.log(`📤 Share to ${platform}`);
    
    try {
      setIsProcessingVideo(true);
      
      // Save video to camera roll if we have one
      if (videoUri) {
        await saveVideoToPhotos(videoUri);
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
              
              
              // Small delay to ensure clipboard sync
              setTimeout(async () => {
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
                      await Linking.openURL(url);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      setShowCaptionPreview(false);
                      opened = true;
                      break;
                    } catch (error) {
                      continue;
                    }
                  }
                  
                  if (!opened) {
                    Alert.alert('TikTok Not Found', 'Could not open TikTok. Make sure it is installed.');
                  }
                } else {
                  // Instagram
                  try {
                    await Linking.openURL('instagram://camera');
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setShowCaptionPreview(false);
                  } catch (error) {
                    try {
                      await Linking.openURL('https://www.instagram.com/');
                    } catch (_) {
                      Alert.alert('Instagram Not Found', 'Could not open Instagram.');
                    }
                    setShowCaptionPreview(false);
                  }
                }
              }, 500); // 500ms delay for clipboard to sync
            }
          }
        ]
      );
      
    } catch (error: any) {
      setIsProcessingVideo(false);
      Alert.alert(
        'Error', 
        `Could not save video. Error: ${error?.message ?? 'Unknown error'}`
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
      // Save video to camera roll first
      await saveVideoToPhotos(videoUri);
      
      // Now show location picker, same as Share button
      setShowLocationPicker(true);
      
    } catch (error: any) {
      Alert.alert('Error', `Failed to save: ${error?.message ?? 'Unknown error'}`);
    }
  };

  const handleGoAgain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onGoHome();
  };

  // Motivational copy — pick once on mount so it doesn't change on re-render
  const motivationalCopy = useMemo(() => {
    const score = scoringResults?.rawDawgScore ?? 0;
    const high = ['Locked in.', 'Built different.', 'Monk mode activated.'];
    const mid = ['Getting there.', 'Room to grow.', 'Solid foundation.'];
    const low = ['Everyone starts somewhere.', 'Come back tomorrow.', 'The score doesn\'t lie.'];
    const pool = score >= 80 ? high : score >= 50 ? mid : low;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [scoringResults]);

  // Format duration as M:SS
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Grade modifier: turns "B" into "B+", "B", or "B-" based on where the score
  // falls within that grade band.
  const getGradeWithModifier = (score: number, baseGrade: string): string => {
    const bands: { grade: string; min: number; max: number }[] = [
      { grade: 'S', min: 90, max: 100 },
      { grade: 'A', min: 80, max: 89 },
      { grade: 'B', min: 65, max: 79 },
      { grade: 'C', min: 50, max: 64 },
      { grade: 'D', min: 30, max: 49 },
    ];
    const band = bands.find((b) => b.grade === baseGrade);
    if (!band) return baseGrade; // F or unknown — no modifier
    const range = band.max - band.min + 1;
    const third = range / 3;
    if (score >= band.min + 2 * third) return `${baseGrade}+`;
    if (score < band.min + third) return `${baseGrade}-`;
    return baseGrade;
  };

  // Color for a score value using the same grade color scale
  const scoreColor = (value: number): string => {
    if (value >= 90) return '#8E44AD';
    if (value >= 80) return '#27AE60';
    if (value >= 65) return '#2980B9';
    if (value >= 50) return '#F39C12';
    if (value >= 30) return '#E67E22';
    return '#E74C3C';
  };

  // Sub-score bar helper
  const SubScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <View style={styles.subScoreRow}>
      <View style={styles.subScoreLabelRow}>
        <Text style={styles.subScoreLabel}>{label}</Text>
        <Text style={[styles.subScoreValue, { color: scoreColor(Math.round(value)) }]}>{Math.round(value)}</Text>
      </View>
      <View style={styles.subScoreBarTrack}>
        <View style={[styles.subScoreBarFill, { width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── Scoring Layout (when scoringResults exists) ── */}
        {scoringResults ? (
          <>
            {/* 1. Status Header */}
            <View style={styles.header}>
              <Text style={styles.title}>SESSION COMPLETE</Text>
            </View>

            {/* 2. Hero Raw Dawg Score */}
            <View style={styles.heroContainer}>
              <View style={styles.heroScoreRow}>
                <Text style={styles.heroScore}>{Math.round(scoringResults.rawDawgScore)}</Text>
                <Text style={[styles.heroGrade, { color: scoringResults.color }]}>
                  {getGradeWithModifier(scoringResults.rawDawgScore, scoringResults.grade)}
                </Text>
              </View>
              <Text style={[styles.heroGradeLabel, { color: scoringResults.color }]}>
                {scoringResults.label}
              </Text>
            </View>

            {/* 3. Sub-Score Progress Bars */}
            <View style={styles.subScoreCard}>
              <SubScoreBar label="STILLNESS" value={scoringResults.stillnessScore} color="#e94560" />
              <SubScoreBar label="FOCUS" value={scoringResults.blinkScore} color="#F39C12" />
              <SubScoreBar label="DURATION" value={scoringResults.durationScore} color="#27AE60" />
            </View>

            {/* 4. Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>STILLNESS</Text>
                <Text style={[styles.statValue, { color: scoreColor(scoringResults.stillnessScore) }]}>
                  {Math.round(scoringResults.stillnessPercent)}%
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>BLINKS</Text>
                <Text style={[styles.statValue, { color: scoreColor(scoringResults.blinkScore) }]}>
                  {scoringResults.blinksPerMinute.toFixed(1)}/min
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>DURATION</Text>
                <Text style={[styles.statValue, { color: scoreColor(scoringResults.durationScore) }]}>
                  {formatDuration(safeCompletedSeconds)}
                </Text>
              </View>
            </View>

            {/* 5. Camera Verified Badge */}
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>CAMERA VERIFIED</Text>
            </View>

            {/* 6. Motivational Copy */}
            <Text style={styles.motivationalText}>{motivationalCopy}</Text>
          </>
        ) : (
          <>
            {/* ── Fallback Layout (no scoring results) ── */}
            <View style={styles.header}>
              <Text style={styles.title}>SESSION COMPLETE</Text>
              <Text style={styles.timeDisplay}>{formatTimeDisplay(safeCompletedSeconds)}</Text>
              <Text style={styles.subtitle}>
                You did absolutely nothing {'\u2014'} and feel better because of it.
              </Text>
            </View>

            {hasStats && (
              <View style={styles.fallbackStatsContainer}>
                <View style={styles.fallbackStatsRow}>
                  <View style={styles.fallbackStatItem}>
                    <Text style={styles.fallbackStatValue}>{stillnessPercent}%</Text>
                    <Text style={styles.fallbackStatLabel}>stillness</Text>
                  </View>
                  <View style={styles.fallbackStatDivider} />
                  <View style={styles.fallbackStatItem}>
                    <Text style={styles.fallbackStatValue}>{blinksCount}</Text>
                    <Text style={styles.fallbackStatLabel}>blinks</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {/* Stats Grid (always shown) */}
        {stats.totalSessions > 0 && (
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Your Progress</Text>
            {stats.totalScoredSessions != null && stats.totalScoredSessions > 0 ? (
              /* ── Scoring-aware layout: BEST | AVG | STREAK | SESSIONS ── */
              <View style={styles.statsGrid}>
                <View style={styles.miniStatCard}>
                  <Text style={styles.miniStatEmoji}>🏆</Text>
                  <View style={styles.miniStatScoreRow}>
                    <Text style={[styles.miniStatValue, { color: scoreColor(stats.bestRawDawgScore ?? 0) }]}>
                      {Math.round(stats.bestRawDawgScore ?? 0)}
                    </Text>
                    {stats.bestGrade && (
                      <Text style={[styles.miniStatGrade, { color: scoreColor(stats.bestRawDawgScore ?? 0) }]}>
                        {stats.bestGrade}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.miniStatLabel}>Best</Text>
                </View>

                <View style={styles.miniStatCard}>
                  <Text style={styles.miniStatEmoji}>⌀</Text>
                  <Text style={[styles.miniStatValue, { color: scoreColor(stats.avgRawDawgScore7d ?? 0) }]}>
                    {stats.avgRawDawgScore7d != null ? Math.round(stats.avgRawDawgScore7d) : '—'}
                  </Text>
                  <Text style={styles.miniStatLabel}>Avg 7d</Text>
                </View>

                <View style={styles.miniStatCard}>
                  <Text style={styles.miniStatEmoji}>🔥</Text>
                  <Text style={styles.miniStatValue}>{stats.currentStreak}</Text>
                  <Text style={styles.miniStatLabel}>Streak</Text>
                </View>

                <View style={styles.miniStatCard}>
                  <Text style={styles.miniStatEmoji}>✓</Text>
                  <Text style={styles.miniStatValue}>{stats.totalSessions}</Text>
                  <Text style={styles.miniStatLabel}>Sessions</Text>
                </View>
              </View>
            ) : (
              /* ── Fallback layout (no scored sessions): DONE | TOTAL | STREAK | RECORD ── */
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
            )}
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
            accessibilityLabel="Share"
            accessibilityRole="button"
          >
            <Text style={styles.shareButtonText}>SHARE</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.goAgainButton}
            onPress={handleGoAgain}
            activeOpacity={0.8}
            accessibilityLabel="Go again"
            accessibilityRole="button"
          >
            <Text style={styles.goAgainButtonText}>GO AGAIN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={onGoHome}
            activeOpacity={0.8}
            accessibilityLabel="Done"
            accessibilityRole="button"
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
                    accessibilityLabel="Done"
                    accessibilityRole="button"
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
                    accessibilityLabel="Back"
                    accessibilityRole="button"
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
                      accessibilityLabel={location.text}
                      accessibilityRole="button"
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
                accessibilityLabel="Cancel"
                accessibilityRole="button"
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
                  accessibilityLabel={captionCopied ? 'Caption copied' : 'Copy caption'}
                  accessibilityRole="button"
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
                    accessibilityLabel="Open TikTok"
                    accessibilityRole="button"
                  >
                    <Text style={styles.platformButtonText}>📱 Open TikTok</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.platformButton, styles.instagramButton]}
                    onPress={() => handleShareToPlatform('instagram')}
                    activeOpacity={0.8}
                    accessibilityLabel="Open Instagram"
                    accessibilityRole="button"
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
                  accessibilityLabel="Cancel"
                  accessibilityRole="button"
                >
                  <Text style={styles.modalCloseButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
      {/* Share Card Modal */}
      <Modal
        visible={showShareCard}
        animationType="fade"
        transparent={true}
        onRequestClose={() => !isSharingCard && setShowShareCard(false)}
      >
        <View style={styles.shareCardOverlay}>
          <ScrollView
            contentContainerStyle={styles.shareCardScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {scoringResults && (
              <ShareCard
                ref={shareCardRef}
                scoringResults={scoringResults}
                completedSeconds={safeCompletedSeconds}
              />
            )}
            <View style={styles.shareCardActions}>
              <View style={styles.shareCardButtonRow}>
                <TouchableOpacity
                  style={styles.shareCardButton}
                  onPress={handleShareCard}
                  activeOpacity={0.8}
                  disabled={isSharingCard}
                >
                  <Text style={styles.shareCardButtonText}>SHARE</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shareCardSaveButton}
                  onPress={handleSaveCard}
                  activeOpacity={0.8}
                  disabled={isSharingCard}
                >
                  <Text style={styles.shareCardSaveText}>SAVE</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.shareCardCloseButton}
                onPress={() => setShowShareCard(false)}
                activeOpacity={0.8}
                disabled={isSharingCard}
              >
                <Text style={styles.shareCardCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ─── Layout ─────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: DS_COLORS.bgDeep,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    justifyContent: 'center',
    gap: 20,
  },

  // ─── 1. Status Header ──────────────────────────────────────────────
  header: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.verified,
    letterSpacing: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
  },

  // ─── 2. Hero Raw Dawg Score ────────────────────────────────────────
  heroContainer: {
    alignItems: 'center',
    gap: 2,
  },
  heroScoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  heroScore: {
    fontSize: 96,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
  },
  heroGrade: {
    fontSize: 96,
    fontFamily: FONTS.display,
    letterSpacing: 2,
  },
  heroGradeLabel: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  // ─── 3. Sub-Score Progress Bars ────────────────────────────────────
  subScoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    gap: 14,
  },
  subScoreRow: {
    gap: 6,
  },
  subScoreLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subScoreLabel: {
    fontSize: 14,
    fontFamily: FONTS.headingMedium,
    color: DS_COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  subScoreValue: {
    fontSize: 14,
    fontFamily: FONTS.headingMedium,
    color: DS_COLORS.textPrimary,
  },
  subScoreBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  subScoreBarFill: {
    height: 8,
    borderRadius: 4,
  },

  // ─── 4. Stats Row ──────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.body,
    color: DS_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 20,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // ─── 5. Camera Verified Badge ──────────────────────────────────────
  verifiedBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: DS_COLORS.verified,
  },
  verifiedText: {
    fontSize: 11,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.verified,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ─── 6. Motivational Copy ──────────────────────────────────────────
  motivationalText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },

  // ─── Fallback Layout (no scoring results) ──────────────────────────
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: DS_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  timeDisplay: {
    fontSize: 64,
    fontFamily: FONTS.display,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
  },
  fallbackStatsContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: DS_COLORS.bgSurface,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  fallbackStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  fallbackStatItem: {
    alignItems: 'center',
    gap: 2,
  },
  fallbackStatValue: {
    fontSize: 24,
    fontFamily: FONTS.display,
    color: DS_COLORS.coral,
  },
  fallbackStatLabel: {
    fontSize: 10,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fallbackStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // ─── Your Progress Grid ────────────────────────────────────────────
  statsSection: {
    gap: 10,
  },
  statsTitle: {
    fontSize: 11,
    fontFamily: FONTS.monoMedium,
    color: DS_COLORS.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniStatCard: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: DS_COLORS.bgSurface,
    padding: 10,
    borderRadius: RADIUS.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    gap: 2,
  },
  miniStatEmoji: {
    fontSize: 14,
  },
  miniStatValue: {
    fontSize: 16,
    fontFamily: FONTS.monoBold,
    color: DS_COLORS.coral,
  },
  miniStatLabel: {
    fontSize: 9,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  miniStatScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  miniStatGrade: {
    fontSize: 11,
    fontFamily: FONTS.heading,
    letterSpacing: 0.5,
  },
  actions: {
    gap: 10,
  },
  timelapseButton: {
    backgroundColor: '#9B59B6',
    paddingVertical: 14,
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
    paddingVertical: 14,
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
    paddingVertical: 12,
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
    paddingVertical: 10,
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

  // ─── Share Card Modal ────────────────────────────────────────────────
  shareCardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
  },
  shareCardScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    gap: 20,
  },
  shareCardActions: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
    paddingHorizontal: 48,
  },
  shareCardButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  shareCardButton: {
    flex: 1,
    backgroundColor: DS_COLORS.coral,
    paddingVertical: 16,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    ...SHADOWS.coralButton,
  },
  shareCardButtonText: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: DS_COLORS.textPrimary,
    letterSpacing: 2,
  },
  shareCardSaveButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: RADIUS.button,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 77, 106, 0.4)',
  },
  shareCardSaveText: {
    fontSize: 16,
    fontFamily: FONTS.heading,
    color: DS_COLORS.coral,
    letterSpacing: 2,
  },
  shareCardCloseButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  shareCardCloseText: {
    fontSize: 16,
    fontFamily: FONTS.bodyMedium,
    color: DS_COLORS.textSecondary,
  },
});
