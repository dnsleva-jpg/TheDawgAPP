import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS as C, FONTS, RADIUS } from '../../constants/designSystem';
import type { Session } from '../../types';
import {
  getCalendarDayNumber,
  getTimelineDayStatuses,
  getCompletedDailyChallenges,
  markDailyChallengeComplete,
} from '../../utils/rewireManager';
import type { DayStatus, TimelineDayStatus } from '../../utils/rewireManager';
import { getChallengeForDay, CATEGORY_EMOJI } from '../../data/challenges';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Constants ───────────────────────────────────────────

const MILESTONE_DAYS = [1, 7, 14, 30, 60, 90];
const NODE_SIZE = 44;
const NODE_SMALL = 32;
const SEGMENT_SIZE = 5; // days per row before snaking

const PHASES = [
  { start: 1, end: 30, name: 'DETOX', subtitle: 'Your brain is hijacked. Let\'s break free.', color: '#6C3483', icon: 'flash-outline' as const },
  { start: 31, end: 60, name: 'REWIRE', subtitle: 'Building new neural pathways.', color: '#2471A3', icon: 'git-network-outline' as const },
  { start: 61, end: 90, name: 'FREEDOM', subtitle: 'You own your attention.', color: '#D4AC0D', icon: 'sunny-outline' as const },
];

// ─── Pulse Animation ─────────────────────────────────────

function PulseNode({ children, size }: { children: React.ReactNode; size: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: size + 16,
        height: size + 16,
        borderRadius: (size + 16) / 2,
        borderWidth: 2,
        borderColor: C.coral,
        opacity: pulse.interpolate({ inputRange: [1, 1.15], outputRange: [0.2, 0.5] }),
        transform: [{ scale: pulse }],
      }} />
      {children}
    </View>
  );
}

// ─── Props ────────────────────────────────────────────────

interface Props {
  sessions: Session[];
  startDate: string;
  onCurrentDayYOffset?: (y: number) => void;
}

// ─── Component ───────────────────────────────────────────

export function RewireTimeline({ sessions, startDate, onCurrentDayYOffset }: Props) {
  const [manuallyCompleted, setManuallyCompleted] = useState<number[]>([]);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const reported = useRef(false);

  useEffect(() => {
    getCompletedDailyChallenges().then(setManuallyCompleted);
  }, []);

  const calDay = useMemo(() => (startDate ? getCalendarDayNumber(startDate) : 1), [startDate]);

  const dayStatuses = useMemo(
    () => (startDate ? getTimelineDayStatuses(sessions, startDate, manuallyCompleted) : []),
    [sessions, startDate, manuallyCompleted],
  );

  // Auto-scroll
  useEffect(() => {
    if (reported.current || !onCurrentDayYOffset) return;
    const t = setTimeout(() => {
      // Rough estimate: each segment row is ~100px, phase gates ~80px
      const segmentIndex = Math.floor((calDay - 1) / SEGMENT_SIZE);
      const phaseGates = PHASES.filter(p => p.start <= calDay).length;
      onCurrentDayYOffset(segmentIndex * 100 + phaseGates * 80);
      reported.current = true;
    }, 400);
    return () => clearTimeout(t);
  }, [calDay, onCurrentDayYOffset]);

  const handleMarkComplete = useCallback(async (day: number) => {
    await markDailyChallengeComplete(day);
    setManuallyCompleted((prev) => [...prev, day]);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDay(null);
  }, []);

  const handleTapDay = useCallback((dayNum: number, status: DayStatus) => {
    if (status === 'future') return; // Can't tap locked days
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDay(expandedDay === dayNum ? null : dayNum);
  }, [expandedDay]);

  // ─── Build segments (groups of SEGMENT_SIZE days) ──────

  const segments: TimelineDayStatus[][] = [];
  for (let i = 0; i < 90; i += SEGMENT_SIZE) {
    segments.push(dayStatuses.slice(i, i + SEGMENT_SIZE));
  }

  // ─── Render ────────────────────────────────────────────

  return (
    <View style={st.container}>
      {/* Start label */}
      {startDate && (
        <Text style={st.startLabel}>
          STARTED {new Date(startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
        </Text>
      )}

      {segments.map((segment, segIdx) => {
        const firstDay = segment[0]?.dayNumber ?? 0;
        const isReversed = segIdx % 2 === 1;

        // Check if this segment starts a new phase
        const phaseGate = PHASES.find(p => p.start >= firstDay && p.start < firstDay + SEGMENT_SIZE);

        return (
          <View key={segIdx}>
            {/* Phase Gate Banner */}
            {phaseGate && (
              <View style={[st.phaseGate, { borderLeftColor: phaseGate.color }]}>
                <Ionicons name={phaseGate.icon} size={20} color={phaseGate.color} />
                <View style={st.phaseGateText}>
                  <Text style={[st.phaseGateName, { color: phaseGate.color }]}>{phaseGate.name}</Text>
                  <Text style={st.phaseGateSub}>{phaseGate.subtitle}</Text>
                </View>
              </View>
            )}

            {/* Segment row — nodes in a horizontal line */}
            <View style={[st.segmentRow, isReversed && st.segmentRowReversed]}>
              {/* Connecting line behind nodes */}
              <View style={[st.segmentLine, isReversed && st.segmentLineReversed]}>
                {segment.map((ds, i) => {
                  const filled = ds.status !== 'future' && ds.status !== 'unlocked';
                  return (
                    <View
                      key={ds.dayNumber}
                      style={[
                        st.lineSegment,
                        filled && st.lineSegmentFilled,
                        i === segment.length - 1 && { flex: 0, width: 0 },
                      ]}
                    />
                  );
                })}
              </View>

              {/* Nodes */}
              {segment.map((ds) => {
                const isMilestone = MILESTONE_DAYS.includes(ds.dayNumber);
                const challenge = getChallengeForDay(ds.dayNumber);
                const isExpanded = expandedDay === ds.dayNumber;

                return (
                  <View key={ds.dayNumber} style={st.nodeWrapper}>
                    <TouchableOpacity
                      onPress={() => handleTapDay(ds.dayNumber, ds.status)}
                      activeOpacity={0.7}
                      style={st.nodeTouch}
                    >
                      {ds.status === 'current' ? (
                        <PulseNode size={NODE_SIZE}>
                          <DayNode ds={ds} isMilestone={isMilestone} challenge={challenge} />
                        </PulseNode>
                      ) : (
                        <DayNode ds={ds} isMilestone={isMilestone} challenge={challenge} />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Vertical connector between segment rows */}
            {segIdx < segments.length - 1 && (
              <View style={[st.verticalConnector, isReversed ? st.verticalRight : st.verticalLeft]}>
                <View style={[
                  st.verticalLine,
                  segment.some(d => d.status !== 'future' && d.status !== 'unlocked') && st.verticalLineFilled,
                ]} />
              </View>
            )}

            {/* Expanded card for selected day in this segment */}
            {segment.some(ds => ds.dayNumber === expandedDay) && expandedDay != null && (
              <ExpandedCard
                dayStatus={dayStatuses[expandedDay - 1]}
                onMarkComplete={() => handleMarkComplete(expandedDay)}
                onClose={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setExpandedDay(null); }}
              />
            )}
          </View>
        );
      })}

      {/* Finish line */}
      <View style={st.finishLine}>
        <View style={st.finishRule} />
        <Text style={st.finishText}>THE FINISH LINE</Text>
        <View style={st.finishRule} />
      </View>
    </View>
  );
}

// ─── Day Node ────────────────────────────────────────────

function DayNode({ ds, isMilestone, challenge }: {
  ds: TimelineDayStatus;
  isMilestone: boolean;
  challenge: any;
}) {
  const size = isMilestone ? NODE_SIZE : NODE_SMALL;
  const { status, dayNumber } = ds;

  const nodeStyle = [
    st.node,
    { width: size, height: size, borderRadius: size / 2 },
    status === 'completed' && st.nodeCompleted,
    status === 'currentCompleted' && st.nodeCompleted,
    status === 'current' && st.nodeCurrent,
    status === 'missed' && st.nodeMissed,
    status === 'unlocked' && st.nodeUnlocked,
    status === 'future' && st.nodeFuture,
  ];

  return (
    <View style={st.nodeContainer}>
      <View style={nodeStyle}>
        {(status === 'completed' || status === 'currentCompleted') && (
          <Ionicons name="checkmark" size={isMilestone ? 20 : 16} color="#FFFFFF" />
        )}
        {status === 'current' && (
          <Text style={st.nodeEmoji}>
            {challenge ? (CATEGORY_EMOJI[challenge.category] || '⚡') : '⚡'}
          </Text>
        )}
        {status === 'missed' && (
          <Text style={st.nodeDash}>—</Text>
        )}
        {status === 'unlocked' && (
          <Text style={st.nodeDay}>{dayNumber}</Text>
        )}
        {status === 'future' && (
          <Ionicons name="lock-closed" size={12} color="rgba(28,18,8,0.12)" />
        )}
      </View>

      {/* Day label below node */}
      {(status !== 'future' || isMilestone) && (
        <Text style={[st.nodeLabel, status === 'current' && st.nodeLabelCurrent]}>
          {status === 'current' ? 'TODAY' : `${dayNumber}`}
        </Text>
      )}
    </View>
  );
}

// ─── Expanded Card ───────────────────────────────────────

function ExpandedCard({ dayStatus, onMarkComplete, onClose }: {
  dayStatus: TimelineDayStatus;
  onMarkComplete: () => void;
  onClose: () => void;
}) {
  const challenge = getChallengeForDay(dayStatus.dayNumber);
  if (!challenge) return null;

  const { status, revisitable } = dayStatus;
  const isDone = status === 'completed' || status === 'currentCompleted';
  const isCurrent = status === 'current';
  const isMissed = status === 'missed';
  const isUnlocked = status === 'unlocked';
  const phase = PHASES.find(p => dayStatus.dayNumber >= p.start && dayStatus.dayNumber <= p.end);

  return (
    <View style={st.expandedCard}>
      {/* Header */}
      <View style={st.expandedHeader}>
        <View style={st.expandedHeaderLeft}>
          <Text style={st.expandedEmoji}>
            {CATEGORY_EMOJI[challenge.category] || '⚡'}
          </Text>
          <View>
            <Text style={st.expandedDay}>Day {dayStatus.dayNumber}</Text>
            <Text style={st.expandedTitle}>{challenge.title}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={20} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Description */}
      <Text style={st.expandedDesc}>{challenge.description}</Text>

      {/* Duration + Difficulty */}
      <View style={st.expandedMeta}>
        <View style={st.expandedMetaChip}>
          <Ionicons name="time-outline" size={14} color={C.textMuted} />
          <Text style={st.expandedMetaText}>{challenge.duration}</Text>
        </View>
        <View style={st.expandedMetaChip}>
          {[1, 2, 3, 4, 5].map(d => (
            <View
              key={d}
              style={[st.diffDot, d <= challenge.difficulty && st.diffDotActive]}
            />
          ))}
        </View>
      </View>

      {/* Science Bite */}
      {challenge.scienceBite && (
        <View style={st.scienceCard}>
          <Ionicons name="flask-outline" size={14} color={C.coral} />
          <Text style={st.scienceText}>{challenge.scienceBite}</Text>
        </View>
      )}

      {/* Action Button */}
      {isDone ? (
        <View style={st.completedBadge}>
          <Ionicons name="checkmark-circle" size={18} color={C.verified} />
          <Text style={st.completedText}>COMPLETED</Text>
        </View>
      ) : isCurrent || (isMissed && revisitable) ? (
        <TouchableOpacity style={st.actionButton} onPress={onMarkComplete} activeOpacity={0.8}>
          <Text style={st.actionText}>
            {isMissed ? 'REVISIT CHALLENGE' : 'MARK COMPLETE'}
          </Text>
        </TouchableOpacity>
      ) : isUnlocked ? (
        <View style={st.previewBadge}>
          <Ionicons name="eye-outline" size={16} color={C.textMuted} />
          <Text style={st.previewText}>Available on Day {dayStatus.dayNumber}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────

const st = StyleSheet.create({
  container: {
    gap: 4,
  },
  startLabel: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: C.textDisabled,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
  },

  // Phase Gate
  phaseGate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    gap: 12,
    marginVertical: 12,
    borderLeftWidth: 3,
  },
  phaseGateText: {
    flex: 1,
  },
  phaseGateName: {
    fontFamily: FONTS.monoBold,
    fontSize: 13,
    letterSpacing: 3,
  },
  phaseGateSub: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },

  // Segment Row (horizontal group of 5 nodes)
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 8,
    position: 'relative',
  },
  segmentRowReversed: {
    flexDirection: 'row-reverse',
  },

  // Connecting line behind nodes (horizontal)
  segmentLine: {
    position: 'absolute',
    top: 8 + NODE_SIZE / 2 - 1.5,
    left: 8 + NODE_SMALL / 2,
    right: 8 + NODE_SMALL / 2,
    flexDirection: 'row',
    height: 3,
  },
  segmentLineReversed: {
    flexDirection: 'row-reverse',
  },
  lineSegment: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(28,18,8,0.06)',
    borderRadius: 1.5,
  },
  lineSegmentFilled: {
    backgroundColor: C.coral + '55',
  },

  // Vertical connector between rows
  verticalConnector: {
    height: 28,
    paddingHorizontal: 8,
  },
  verticalLeft: {
    alignItems: 'flex-start',
    paddingLeft: 8 + NODE_SMALL / 2 - 1.5,
  },
  verticalRight: {
    alignItems: 'flex-end',
    paddingRight: 8 + NODE_SMALL / 2 - 1.5,
  },
  verticalLine: {
    width: 3,
    height: '100%',
    backgroundColor: 'rgba(28,18,8,0.06)',
    borderRadius: 1.5,
  },
  verticalLineFilled: {
    backgroundColor: C.coral + '55',
  },

  // Node
  nodeWrapper: {
    alignItems: 'center',
    width: NODE_SIZE + 8,
  },
  nodeTouch: {
    alignItems: 'center',
  },
  nodeContainer: {
    alignItems: 'center',
    gap: 4,
  },
  node: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  nodeCompleted: {
    backgroundColor: C.coral,
    borderColor: C.coral,
  },
  nodeCurrent: {
    backgroundColor: C.coral + '22',
    borderColor: C.coral,
  },
  nodeMissed: {
    backgroundColor: 'rgba(28,18,8,0.03)',
    borderColor: 'rgba(28,18,8,0.08)',
  },
  nodeUnlocked: {
    backgroundColor: 'rgba(28,18,8,0.04)',
    borderColor: 'rgba(28,18,8,0.1)',
    borderStyle: 'dashed',
  },
  nodeFuture: {
    backgroundColor: 'rgba(28,18,8,0.02)',
    borderColor: 'rgba(28,18,8,0.04)',
  },

  nodeEmoji: { fontSize: 18 },
  nodeDash: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: 'rgba(28,18,8,0.15)',
  },
  nodeDay: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    color: 'rgba(28,18,8,0.25)',
  },
  nodeLabel: {
    fontFamily: FONTS.mono,
    fontSize: 9,
    color: C.textDisabled,
  },
  nodeLabelCurrent: {
    color: C.coral,
    fontFamily: FONTS.monoBold,
  },

  // Expanded Card
  expandedCard: {
    backgroundColor: C.bgSurface,
    borderRadius: RADIUS.card,
    padding: 16,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(28,18,8,0.06)',
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  expandedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  expandedEmoji: { fontSize: 28 },
  expandedDay: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 1,
  },
  expandedTitle: {
    fontFamily: FONTS.headingBold,
    fontSize: 17,
    color: C.textPrimary,
  },
  expandedDesc: {
    fontFamily: FONTS.body,
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  expandedMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  expandedMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.bgSurfaceLight,
    borderRadius: RADIUS.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  expandedMetaText: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: C.textMuted,
  },
  diffDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(28,18,8,0.08)',
  },
  diffDotActive: {
    backgroundColor: C.coral,
  },

  // Science
  scienceCard: {
    flexDirection: 'row',
    backgroundColor: C.coral + '0D',
    borderRadius: RADIUS.card,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  scienceText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: C.textSecondary,
    fontStyle: 'italic',
    flex: 1,
    lineHeight: 18,
  },

  // Action buttons
  actionButton: {
    backgroundColor: C.coral,
    borderRadius: RADIUS.button,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionText: {
    fontFamily: FONTS.headingBold,
    fontSize: 14,
    color: '#1C1208',
    letterSpacing: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.button,
    borderWidth: 1,
    borderColor: C.verified + '44',
  },
  completedText: {
    fontFamily: FONTS.monoBold,
    fontSize: 13,
    color: C.verified,
    letterSpacing: 1,
  },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  previewText: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: C.textMuted,
  },

  // Finish
  finishLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  finishRule: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(28,18,8,0.08)',
  },
  finishText: {
    fontFamily: FONTS.monoBold,
    fontSize: 11,
    color: C.textDisabled,
    letterSpacing: 2,
  },
});
