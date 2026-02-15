import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  TouchableOpacity,
  Pressable,
  Modal,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { COLORS as C, FONTS } from '../../constants/designSystem';
import type { Session } from '../../types';
import {
  getCalendarDayNumber,
  getTimelineDayStatuses,
  getCompletedDailyChallenges,
  markDailyChallengeComplete,
} from '../../utils/rewireManager';
import type { DayStatus } from '../../utils/rewireManager';
import { getChallengeForDay, CATEGORY_EMOJI } from '../../data/challenges';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Layout Constants ─────────────────────────────────────

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const W = SCREEN_W - 40;
const NODE = 60;
const DOT = 28;
const PATH_W = 4;
const TOP = 52;
const LX = W * 0.22;
const RX = W * 0.78;
const CURVE_RES = 24;
const MIN_SEGMENT_H = 140;
const PX_PER_DOT = 30;
const COLLAPSED_H = 120;
const INLINE_CARD_EXTRA = 300;
const INLINE_CARD_W = W - 32;

// ─── All Milestones (Day 1 + original 6) ─────────────────

const ALL_MS = [
  { day: 1,  title: 'THE BEGINNING',     icon: '🚀', text: 'You started. Most people never do. Your brain is already noticing.' },
  { day: 3,  title: 'WITHDRAWAL PHASE',  icon: '⚡', text: "This is why you feel restless without your phone. It's normal. It passes." },
  { day: 7,  title: 'CORTISOL DROP',      icon: '📉', text: 'Your stress levels are physically dropping. The brain fog starts lifting here.' },
  { day: 14, title: 'ATTENTION RESET',    icon: '🎯', text: 'Your ability to focus just got 10 years younger. Not a metaphor — real data.' },
  { day: 30, title: 'NEURAL REWIRING',    icon: '🧠', text: 'Your brain is physically building new wiring. Like muscle after the gym.' },
  { day: 60, title: 'RECEPTOR RECOVERY',  icon: '🔄', text: 'The part of your brain that craves the scroll is quieting down.' },
  { day: 90, title: 'FULL REWIRE',        icon: '👑', text: "Your brain stops needing the fix. You're rewired." },
];

// ─── Segments ─────────────────────────────────────────────

interface SegmentDef {
  fromDay: number;
  toDay: number;
  dotDays: number[];
}

function getSegments(): SegmentDef[] {
  const anchors = ALL_MS.map((m) => m.day); // [1, 3, 7, 14, 30, 60, 90]
  const segs: SegmentDef[] = [];
  for (let i = 0; i < anchors.length - 1; i++) {
    const from = anchors[i];
    const to = anchors[i + 1];
    const dots: number[] = [];
    for (let d = from + 1; d < to; d++) {
      dots.push(d);
    }
    segs.push({ fromDay: from, toDay: to, dotDays: dots });
  }
  return segs;
}

const SEGMENTS = getSegments(); // Static — doesn't change
const NUM_SEGS = SEGMENTS.length; // 6

// ─── Layout Builder ───────────────────────────────────────

interface DotPos { x: number; y: number; day: number; segIdx: number }
interface MsPos { x: number; y: number; day: number }

function buildLayout(expandedSegs: boolean[], calDay: number) {
  const segmentHeights = SEGMENTS.map((seg, i) => {
    if (expandedSegs[i]) {
      return Math.max(MIN_SEGMENT_H, seg.dotDays.length * PX_PER_DOT);
    }
    const hasTodayDot = seg.dotDays.includes(calDay);
    return COLLAPSED_H + (hasTodayDot ? INLINE_CARD_EXTRA : 0);
  });

  // Milestone positions
  const msPositions: MsPos[] = [];
  msPositions.push({ x: W / 2, y: TOP, day: 1 }); // Day 1 at center

  let curY = TOP;
  for (let i = 0; i < NUM_SEGS; i++) {
    curY += segmentHeights[i];
    const x = i % 2 === 0 ? LX : RX;
    msPositions.push({ x, y: curY, day: ALL_MS[i + 1].day });
  }

  // Dot positions for ALL segments (render conditionally)
  const allDots: DotPos[] = [];
  for (let i = 0; i < NUM_SEGS; i++) {
    const seg = SEGMENTS[i];
    const from = msPositions[i];
    const to = msPositions[i + 1];
    const midY = (from.y + to.y) / 2;
    for (const dayNum of seg.dotDays) {
      const t = (dayNum - seg.fromDay) / (seg.toDay - seg.fromDay);
      const x = cb(t, from.x, from.x, to.x, to.x);
      const y = cb(t, from.y, midY, midY, to.y);
      allDots.push({ x, y, day: dayNum, segIdx: i });
    }
  }

  const totalH = curY + NODE / 2 + 100;
  return { msPositions, allDots, segmentHeights, totalH };
}

// ─── Cubic Bezier ─────────────────────────────────────────

function cb(t: number, a: number, b: number, c: number, d: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

// ─── Path Segments ────────────────────────────────────────

interface PathSeg { x: number; y: number; len: number; ang: number; filled: boolean; idx: number; segIdx: number }

function buildPathSegments(msPositions: MsPos[], calDay: number): PathSeg[] {
  const out: PathSeg[] = [];
  for (let i = 0; i < msPositions.length - 1; i++) {
    const a = msPositions[i];
    const b = msPositions[i + 1];
    const midY = (a.y + b.y) / 2;
    let ff: number;
    if (calDay >= b.day) ff = 1;
    else if (calDay <= a.day) ff = 0;
    else ff = (calDay - a.day) / (b.day - a.day);
    const fc = Math.round(ff * CURVE_RES);

    let prev = { x: a.x, y: a.y };
    for (let j = 1; j <= CURVE_RES; j++) {
      const t = j / CURVE_RES;
      const x = cb(t, a.x, a.x, b.x, b.x);
      const y = cb(t, a.y, midY, midY, b.y);
      const dx = x - prev.x;
      const dy = y - prev.y;
      out.push({ x: prev.x, y: prev.y, len: Math.sqrt(dx * dx + dy * dy), ang: Math.atan2(dy, dx), filled: j <= fc, idx: j, segIdx: i });
      prev = { x, y };
    }
  }
  return out;
}

// ─── Category Labels ──────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  dopamine_reset: 'DOPAMINE RESET',
  attention_restoration: 'ATTENTION RESTORATION',
  prefrontal: 'PREFRONTAL',
  social: 'SOCIAL',
  sleep_circadian: 'SLEEP & CIRCADIAN',
  boredom_tolerance: 'BOREDOM TOLERANCE',
  creative_flow: 'CREATIVE FLOW',
};

// ─── Pulse Animations ─────────────────────────────────────

function MilestonePulse() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, [a]);
  const s = NODE + 16;
  return (
    <Animated.View style={{
      position: 'absolute', width: s, height: s, borderRadius: s / 2,
      borderWidth: 2.5, borderColor: C.coral,
      opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.55] }),
      transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }],
    }} />
  );
}

function SmallDotPulse() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(a, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, [a]);
  const s = DOT + 14;
  return (
    <Animated.View style={{
      position: 'absolute', width: s, height: s, borderRadius: s / 2,
      borderWidth: 2, borderColor: C.coral,
      opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] }),
      transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) }],
    }} />
  );
}

// ─── Props ────────────────────────────────────────────────

interface Props {
  sessions: Session[];
  startDate: string;
  onCurrentDayYOffset?: (y: number) => void;
}

// ─── Component ────────────────────────────────────────────

export function RewireTimeline({ sessions, startDate, onCurrentDayYOffset }: Props) {
  const [activeMilestone, setActiveMilestone] = useState<number | null>(null);
  const [activeDot, setActiveDot] = useState<number | null>(null);
  const [showChallengeCard, setShowChallengeCard] = useState(false);
  const [manuallyCompleted, setManuallyCompleted] = useState<number[]>([]);
  const [expandedSegs, setExpandedSegs] = useState<boolean[]>(Array(NUM_SEGS).fill(false));
  const reported = useRef(false);

  useEffect(() => { getCompletedDailyChallenges().then(setManuallyCompleted); }, []);

  const calDay = useMemo(() => (startDate ? getCalendarDayNumber(startDate) : 1), [startDate]);

  // Layout depends on which segments are expanded and current day
  const expandedKey = expandedSegs.join(',');
  const layout = useMemo(() => buildLayout(expandedSegs, calDay), [expandedKey, calDay]);
  const { msPositions, allDots, totalH } = layout;

  const pathSegs = useMemo(() => buildPathSegments(msPositions, calDay), [msPositions, calDay]);

  const dayStatuses = useMemo(
    () => startDate ? getTimelineDayStatuses(sessions, startDate, manuallyCompleted) : [],
    [sessions, startDate, manuallyCompleted]
  );

  const statusByDay = useMemo(() => {
    const map = new Map<number, DayStatus>();
    for (const ds of dayStatuses) map.set(ds.dayNumber, ds.status);
    return map;
  }, [dayStatuses]);

  const nextMsIdx = useMemo(() => ALL_MS.findIndex((m) => m.day > calDay), [calDay]);

  // Which segment contains today's dot (if today is a dot day, not a milestone)
  const todaySegIdx = useMemo(() => SEGMENTS.findIndex((s) => s.dotDays.includes(calDay)), [calDay]);

  const todayChallenge = useMemo(() => getChallengeForDay(calDay), [calDay]);

  // Auto-scroll: pass raw Y of today's position
  useEffect(() => {
    if (reported.current || !onCurrentDayYOffset) return;
    const todayDot = allDots.find((d) => d.day === calDay);
    const todayMs = msPositions.find((p) => p.day === calDay);
    const targetY = todayDot ? todayDot.y : todayMs ? todayMs.y : msPositions[msPositions.length - 1].y;
    const t = setTimeout(() => {
      onCurrentDayYOffset(targetY);
      reported.current = true;
    }, 400);
    return () => clearTimeout(t);
  }, [allDots, calDay, msPositions, onCurrentDayYOffset]);

  const dateStr = useMemo(() => {
    if (!startDate) return '';
    const d = new Date(startDate + 'T00:00:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }, [startDate]);

  const dismissAll = useCallback(() => { setActiveMilestone(null); setActiveDot(null); }, []);

  const toggleSegment = useCallback((idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSegs((prev) => { const n = [...prev]; n[idx] = !n[idx]; return n; });
    setActiveDot(null);
  }, []);

  const handleDotPress = useCallback((dayNum: number) => {
    const status = statusByDay.get(dayNum);
    if (!status) return;
    if (status === 'current') {
      setActiveMilestone(null);
      setActiveDot(null);
      setShowChallengeCard(true);
    } else {
      setActiveMilestone(null);
      setActiveDot((prev) => (prev === dayNum ? null : dayNum));
    }
  }, [statusByDay]);

  const handleMarkComplete = useCallback(async () => {
    await markDailyChallengeComplete(calDay);
    setManuallyCompleted((prev) => [...prev, calDay]);
    setShowChallengeCard(false);
  }, [calDay]);

  // Segment progress for collapsed pills
  const segProgress = useMemo(() => {
    return SEGMENTS.map((seg) => {
      let done = 0;
      for (const d of seg.dotDays) {
        const s = statusByDay.get(d);
        if (s === 'completed' || s === 'currentCompleted') done++;
      }
      return { done, total: seg.dotDays.length };
    });
  }, [statusByDay]);

  // Is the inline card showing?
  const showInlineCard = todaySegIdx >= 0 && !expandedSegs[todaySegIdx] && calDay <= 90;

  return (
    <View style={[st.root, { height: totalH }]}>
      <Text style={st.startDate}>STARTED {dateStr.toUpperCase()}</Text>

      {/* ── Path Lines ── */}
      {pathSegs.map((s, i) => {
        if (!s.filled && s.idx % 2 === 0) return null;
        return (
          <View key={`p${i}`} style={{
            position: 'absolute', left: s.x, top: s.y - PATH_W / 2,
            width: s.len, height: PATH_W,
            backgroundColor: s.filled ? C.coral : 'rgba(255,255,255,0.10)',
            borderRadius: PATH_W / 2, transformOrigin: 'left center',
            transform: [{ rotate: `${s.ang}rad` }],
          }} />
        );
      })}

      {/* ── Collapsed Segment Overlays (progress pills + expand links) ── */}
      {SEGMENTS.map((seg, i) => {
        if (expandedSegs[i]) return null;
        const from = msPositions[i];
        const to = msPositions[i + 1];
        const midY = (from.y + to.y) / 2;
        const midX = W / 2;
        const prog = segProgress[i];
        const isCurrentSeg = todaySegIdx === i;

        // Don't show progress pill right where inline card will be
        const pillY = isCurrentSeg ? from.y + 30 : midY;

        return (
          <React.Fragment key={`col${i}`}>
            {/* Progress pill */}
            <TouchableOpacity
              style={[st.progressPill, { left: midX - 52, top: pillY - 12 }]}
              onPress={() => toggleSegment(i)}
              activeOpacity={0.7}
            >
              <Text style={st.progressPillT}>
                {prog.done}/{prog.total} completed
              </Text>
            </TouchableOpacity>

            {/* "See all days" link */}
            <TouchableOpacity
              style={{ position: 'absolute', left: midX - 40, top: pillY + 14, zIndex: 10 }}
              onPress={() => toggleSegment(i)}
              activeOpacity={0.7}
            >
              <Text style={st.seeAllText}>See all days</Text>
            </TouchableOpacity>
          </React.Fragment>
        );
      })}

      {/* ── Today's Dot in Collapsed View ── */}
      {todaySegIdx >= 0 && !expandedSegs[todaySegIdx] && (() => {
        const dot = allDots.find((d) => d.day === calDay);
        if (!dot) return null;
        const status = statusByDay.get(calDay) ?? 'future';
        const challenge = getChallengeForDay(calDay);
        const isToday = status === 'current';
        const isTodayDone = status === 'currentCompleted';
        const isDone = status === 'completed' || isTodayDone;
        return (
          <React.Fragment>
            {/* TODAY label */}
            {isToday && (
              <Text style={[st.todayLabel, { left: dot.x - 28, top: dot.y - DOT / 2 - 20 }]}>
                TODAY
              </Text>
            )}
            {/* Dot */}
            <View style={[st.dotWrap, { left: dot.x - DOT / 2, top: dot.y - DOT / 2 }]}>
              {isToday && <SmallDotPulse />}
              <View style={[
                st.dot,
                isDone && st.dotDone,
                isToday && st.dotToday,
              ]}>
                {isDone && <Text style={st.dotCheck}>✓</Text>}
                {isToday && challenge && (
                  <Text style={{ fontSize: 13 }}>{CATEGORY_EMOJI[challenge.category] || challenge.emoji}</Text>
                )}
              </View>
            </View>

            {/* Inline Challenge Card */}
            {showInlineCard && todayChallenge && (
              <View style={[st.inlineCard, { left: (W - INLINE_CARD_W) / 2, top: dot.y + DOT / 2 + 16 }]}>
                <Text style={st.inlineEmoji}>
                  {CATEGORY_EMOJI[todayChallenge.category] || todayChallenge.emoji}
                </Text>
                <Text style={st.inlineCategory}>
                  {CATEGORY_LABELS[todayChallenge.category] || todayChallenge.category.toUpperCase().replace(/_/g, ' ')}
                </Text>
                <View style={st.inlinePill}>
                  <Text style={st.inlinePillT}>DAY {calDay}</Text>
                </View>
                <Text style={st.inlineTitle}>{todayChallenge.title}</Text>
                <Text style={st.inlineDesc}>{todayChallenge.description}</Text>
                <View style={st.inlineDuration}>
                  <Text style={st.inlineDurationT}>{todayChallenge.duration}</Text>
                </View>
                <Text style={st.inlineScience}>🧠 {todayChallenge.scienceBite}</Text>
                <TouchableOpacity
                  style={st.inlineAction}
                  activeOpacity={0.8}
                  onPress={() => {
                    if (todayChallenge.requiresSession) {
                      // User navigates to start a session
                    } else {
                      handleMarkComplete();
                    }
                  }}
                >
                  <Text style={st.inlineActionT}>
                    {todayChallenge.requiresSession ? 'START SESSION' : 'MARK COMPLETE'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </React.Fragment>
        );
      })()}

      {/* ── Expanded Segment Dots ── */}
      {SEGMENTS.map((seg, i) => {
        if (!expandedSegs[i]) return null;
        const dots = allDots.filter((d) => d.segIdx === i);
        return (
          <React.Fragment key={`exp${i}`}>
            {dots.map((dot) => {
              const status = statusByDay.get(dot.day) ?? 'future';
              const challenge = getChallengeForDay(dot.day);
              const isToday = status === 'current';
              const isTodayDone = status === 'currentCompleted';
              const isDone = status === 'completed' || isTodayDone;
              const isMissed = status === 'missed';
              const isFuture = status === 'future';
              return (
                <React.Fragment key={`dot${dot.day}`}>
                  {isToday && (
                    <Text style={[st.todayLabel, { left: dot.x - 28, top: dot.y - DOT / 2 - 20 }]}>TODAY</Text>
                  )}
                  <TouchableOpacity
                    style={[st.dotWrap, { left: dot.x - DOT / 2, top: dot.y - DOT / 2 }]}
                    onPress={() => handleDotPress(dot.day)}
                    activeOpacity={isFuture ? 1 : 0.7}
                  >
                    {isToday && <SmallDotPulse />}
                    <View style={[
                      st.dot,
                      isDone && st.dotDone,
                      isToday && st.dotToday,
                      isMissed && st.dotMissed,
                      isFuture && st.dotFuture,
                    ]}>
                      {isDone && <Text style={st.dotCheck}>✓</Text>}
                      {isToday && challenge && (
                        <Text style={{ fontSize: 13 }}>{CATEGORY_EMOJI[challenge.category] || challenge.emoji}</Text>
                      )}
                      {isMissed && <Text style={st.dotX}>✕</Text>}
                    </View>
                  </TouchableOpacity>

                  {/* Dot tooltip */}
                  {activeDot === dot.day && (
                    <>
                      <Pressable style={StyleSheet.absoluteFill} onPress={dismissAll} />
                      <View style={[st.tooltip, {
                        left: Math.max(4, Math.min(dot.x - 90, W - 184)),
                        top: dot.y + DOT / 2 + 10,
                      }]}>
                        {isDone && (
                          <>
                            <Text style={st.tooltipTitle}>Day {dot.day} ✓</Text>
                            {challenge && <Text style={st.tooltipDesc}>{challenge.title}</Text>}
                          </>
                        )}
                        {isFuture && (
                          <>
                            <Text style={st.tooltipTitle}>Day {dot.day} — Locked</Text>
                            <Text style={st.tooltipDesc}>{dot.day - calDay} {dot.day - calDay === 1 ? 'day' : 'days'} away</Text>
                          </>
                        )}
                        {isMissed && (
                          <>
                            <Text style={st.tooltipTitle}>Day {dot.day} — Missed</Text>
                            {challenge && <Text style={[st.tooltipDesc, { opacity: 0.45 }]}>{challenge.title}</Text>}
                          </>
                        )}
                      </View>
                    </>
                  )}
                </React.Fragment>
              );
            })}

            {/* Collapse button */}
            <TouchableOpacity
              style={[st.collapseBtn, {
                left: W / 2 - 36,
                top: msPositions[i + 1].y - NODE / 2 - 30,
              }]}
              onPress={() => toggleSegment(i)}
              activeOpacity={0.7}
            >
              <Text style={st.collapseBtnT}>Collapse</Text>
            </TouchableOpacity>
          </React.Fragment>
        );
      })}

      {/* ── Milestone Nodes ── */}
      {ALL_MS.map((ms, i) => {
        const pos = msPositions[i];
        const done = nextMsIdx === -1 ? true : i < nextMsIdx;
        const isNext = i === nextMsIdx;
        const isFut = !done && !isNext;

        return (
          <React.Fragment key={`ms${ms.day}`}>
            <TouchableOpacity
              style={[st.msWrap, { left: pos.x - NODE / 2, top: pos.y - NODE / 2 }]}
              onPress={() => {
                setActiveDot(null);
                setActiveMilestone((p) => (p === ms.day ? null : ms.day));
              }}
              activeOpacity={0.8}
            >
              {isNext && <MilestonePulse />}
              <View style={[
                st.msCircle,
                done && st.msCircleDone,
                isNext && st.msCircleNext,
                isFut && st.msCircleFut,
              ]}>
                <Text style={{ fontSize: 26, opacity: isFut ? 0.3 : 1 }}>
                  {done ? '✓' : ms.icon}
                </Text>
              </View>
              {done && (
                <View style={st.msBadge}>
                  <Text style={st.msBadgeT}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Milestone tap-to-reveal card */}
            {activeMilestone === ms.day && (
              <>
                <Pressable style={StyleSheet.absoluteFill} onPress={dismissAll} />
                <View style={[st.card, {
                  left: Math.max(4, Math.min(pos.x - 110, W - 224)),
                  top: pos.y + NODE / 2 + 14,
                }]}>
                  <Text style={st.cardTitle}>{ms.title}</Text>
                  <View style={st.pill}>
                    <Text style={st.pillT}>Day {ms.day}</Text>
                  </View>
                  <Text style={st.cardDesc}>{ms.text}</Text>
                  {(done || isNext) && (
                    <TouchableOpacity style={st.shareBtn} activeOpacity={0.7}>
                      <Text style={st.shareT}>SHARE</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </React.Fragment>
        );
      })}

      {/* Finish line */}
      <View style={[st.finish, { top: msPositions[msPositions.length - 1].y + NODE / 2 + 28 }]}>
        <View style={st.finishRule} />
        <Text style={st.finishT}>THE FINISH LINE</Text>
      </View>

      {/* ── Challenge Card Bottom Sheet (expanded-view today tap) ── */}
      <Modal visible={showChallengeCard} transparent animationType="slide" onRequestClose={() => setShowChallengeCard(false)}>
        <Pressable style={st.sheetBackdrop} onPress={() => setShowChallengeCard(false)} />
        <View style={st.sheetContainer}>
          <View style={st.sheetHandle} />
          {todayChallenge ? (
            <>
              <Text style={st.sheetEmoji}>{CATEGORY_EMOJI[todayChallenge.category] || todayChallenge.emoji}</Text>
              <Text style={st.sheetCategory}>
                {CATEGORY_LABELS[todayChallenge.category] || todayChallenge.category.toUpperCase().replace(/_/g, ' ')}
              </Text>
              <View style={st.sheetPill}><Text style={st.sheetPillT}>DAY {calDay}</Text></View>
              <Text style={st.sheetTitle}>{todayChallenge.title}</Text>
              <Text style={st.sheetDesc}>{todayChallenge.description}</Text>
              <View style={st.sheetDuration}><Text style={st.sheetDurationT}>{todayChallenge.duration}</Text></View>
              <Text style={st.sheetScience}>🧠 {todayChallenge.scienceBite}</Text>
              <TouchableOpacity style={st.sheetAction} activeOpacity={0.8} onPress={() => {
                if (todayChallenge.requiresSession) setShowChallengeCard(false);
                else handleMarkComplete();
              }}>
                <Text style={st.sheetActionT}>{todayChallenge.requiresSession ? 'START SESSION' : 'MARK COMPLETE'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={st.sheetDesc}>No challenge data for today.</Text>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────

const st = StyleSheet.create({
  root: { width: W, position: 'relative' },

  startDate: {
    position: 'absolute', top: 10, left: 0, right: 0, textAlign: 'center',
    fontSize: 9, fontFamily: FONTS.monoMedium, color: 'rgba(255,255,255,0.12)', letterSpacing: 2,
  },

  // ── Today label ──
  todayLabel: {
    position: 'absolute', width: 56, textAlign: 'center', zIndex: 5,
    fontSize: 9, fontFamily: FONTS.bodyBold, color: C.coral, letterSpacing: 1,
  },

  // ── Small dots ──
  dotWrap: {
    position: 'absolute', width: DOT, height: DOT,
    alignItems: 'center', justifyContent: 'center', zIndex: 3,
  },
  dot: {
    width: DOT, height: DOT, borderRadius: DOT / 2,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dotDone: { backgroundColor: '#e94560' },
  dotToday: { backgroundColor: 'rgba(233,69,96,0.15)', borderWidth: 2, borderColor: C.coral },
  dotMissed: { backgroundColor: 'rgba(180,80,90,0.25)' },
  dotFuture: { backgroundColor: 'rgba(255,255,255,0.15)' },
  dotCheck: { fontSize: 12, color: '#fff', fontWeight: '700' },
  dotX: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },

  // ── Tooltip ──
  tooltip: {
    position: 'absolute', width: 180, zIndex: 25,
    backgroundColor: 'rgba(18,18,30,0.97)', borderRadius: 12, padding: 14, gap: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14,
  },
  tooltipTitle: { fontSize: 14, fontFamily: FONTS.heading, color: '#fff', letterSpacing: 0.3 },
  tooltipDesc: { fontSize: 12, fontFamily: FONTS.body, color: 'rgba(255,255,255,0.55)', lineHeight: 17 },

  // ── Collapsed progress pill ──
  progressPill: {
    position: 'absolute', zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  progressPillT: {
    fontSize: 11, fontFamily: FONTS.monoMedium, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.5,
  },
  seeAllText: {
    fontSize: 11, fontFamily: FONTS.bodyMedium, color: C.coral, letterSpacing: 0.3,
  },

  // ── Collapse button ──
  collapseBtn: {
    position: 'absolute', zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  collapseBtnT: {
    fontSize: 11, fontFamily: FONTS.bodyMedium, color: 'rgba(255,255,255,0.4)', letterSpacing: 0.3,
  },

  // ── Milestone nodes ──
  msWrap: {
    position: 'absolute', width: NODE, height: NODE,
    alignItems: 'center', justifyContent: 'center', zIndex: 4,
  },
  msCircle: {
    width: NODE, height: NODE, borderRadius: NODE / 2,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)',
  },
  msCircleDone: { backgroundColor: C.coral, borderColor: C.coral },
  msCircleNext: { backgroundColor: 'rgba(255,77,106,0.10)', borderColor: C.coral, borderWidth: 3 },
  msCircleFut: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.08)' },
  msBadge: {
    position: 'absolute', top: -1, right: -1, width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', zIndex: 5,
  },
  msBadgeT: { fontSize: 10, color: C.coral, fontWeight: '700' },

  // ── Milestone card ──
  card: {
    position: 'absolute', width: 220, zIndex: 20,
    backgroundColor: 'rgba(18,18,30,0.97)', borderRadius: 16, padding: 18, gap: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20,
  },
  cardTitle: { fontSize: 18, fontFamily: FONTS.heading, color: '#fff', letterSpacing: 0.5 },
  pill: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(233,69,96,0.15)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3,
  },
  pillT: { fontSize: 11, fontFamily: FONTS.bodyBold, color: C.coral },
  cardDesc: { fontSize: 13, fontFamily: FONTS.body, color: 'rgba(255,255,255,0.65)', lineHeight: 19 },
  shareBtn: {
    alignSelf: 'flex-start', backgroundColor: C.coral, borderRadius: 8,
    paddingVertical: 8, paddingHorizontal: 18, marginTop: 2,
  },
  shareT: { fontSize: 11, fontFamily: FONTS.heading, color: '#fff', letterSpacing: 1 },

  // ── Inline challenge card ──
  inlineCard: {
    position: 'absolute', width: INLINE_CARD_W, zIndex: 15,
    backgroundColor: 'rgba(18,18,30,0.95)', borderRadius: 20, padding: 20, gap: 10,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,77,106,0.15)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16,
  },
  inlineEmoji: { fontSize: 36 },
  inlineCategory: {
    fontSize: 11, fontFamily: FONTS.monoMedium, color: 'rgba(255,255,255,0.45)', letterSpacing: 2,
  },
  inlinePill: {
    backgroundColor: 'rgba(233,69,96,0.18)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4,
  },
  inlinePillT: { fontSize: 12, fontFamily: FONTS.bodyBold, color: C.coral, letterSpacing: 1 },
  inlineTitle: {
    fontSize: 18, fontFamily: FONTS.heading, color: '#fff', textAlign: 'center', letterSpacing: 0.3,
  },
  inlineDesc: {
    fontSize: 13, fontFamily: FONTS.body, color: 'rgba(255,255,255,0.6)',
    textAlign: 'center', lineHeight: 19, paddingHorizontal: 4,
  },
  inlineDuration: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3,
  },
  inlineDurationT: { fontSize: 11, fontFamily: FONTS.monoMedium, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
  inlineScience: {
    fontSize: 12, fontFamily: FONTS.body, fontStyle: 'italic', color: 'rgba(255,255,255,0.4)',
    textAlign: 'center', lineHeight: 17, paddingHorizontal: 4,
  },
  inlineAction: {
    backgroundColor: C.coral, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32, marginTop: 4,
    shadowColor: C.coral, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10,
  },
  inlineActionT: { fontSize: 14, fontFamily: FONTS.heading, color: '#fff', letterSpacing: 1.5 },

  // ── Bottom sheet ──
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheetContainer: {
    backgroundColor: '#16161F', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 14, paddingBottom: 40, alignItems: 'center', gap: 12,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', marginBottom: 8 },
  sheetEmoji: { fontSize: 44 },
  sheetCategory: { fontSize: 12, fontFamily: FONTS.monoMedium, color: 'rgba(255,255,255,0.5)', letterSpacing: 2 },
  sheetPill: { backgroundColor: 'rgba(233,69,96,0.18)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5 },
  sheetPillT: { fontSize: 13, fontFamily: FONTS.bodyBold, color: C.coral, letterSpacing: 1 },
  sheetTitle: { fontSize: 22, fontFamily: FONTS.heading, color: '#fff', textAlign: 'center', letterSpacing: 0.3 },
  sheetDesc: {
    fontSize: 14, fontFamily: FONTS.body, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 21, paddingHorizontal: 8,
  },
  sheetDuration: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4 },
  sheetDurationT: { fontSize: 12, fontFamily: FONTS.monoMedium, color: 'rgba(255,255,255,0.55)', letterSpacing: 1 },
  sheetScience: {
    fontSize: 13, fontFamily: FONTS.body, fontStyle: 'italic', color: 'rgba(255,255,255,0.45)',
    textAlign: 'center', lineHeight: 19, paddingHorizontal: 8,
  },
  sheetAction: {
    backgroundColor: C.coral, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginTop: 8,
    shadowColor: C.coral, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  sheetActionT: { fontSize: 15, fontFamily: FONTS.heading, color: '#fff', letterSpacing: 1.5 },

  // ── Finish line ──
  finish: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: 8 },
  finishRule: { width: 50, height: 2, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 1 },
  finishT: { fontSize: 10, fontFamily: FONTS.monoMedium, color: 'rgba(255,255,255,0.12)', letterSpacing: 3 },
});
