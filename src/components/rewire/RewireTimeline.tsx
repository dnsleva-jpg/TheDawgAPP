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
} from 'react-native';
import { COLORS as C, FONTS } from '../../constants/designSystem';
import type { Session } from '../../types';
import { getCalendarDayNumber } from '../../utils/rewireManager';

// ─── Layout ───────────────────────────────────────────────

const W = Dimensions.get('window').width - 40;
const NODE = 60;
const PATH = 5;
const SPACING = 140;
const TOP = 52;
const LX = W * 0.22;
const RX = W * 0.78;
const CURVE_RES = 24;

// ─── Milestones ───────────────────────────────────────────

const MS = [
  { day: 3,  title: 'WITHDRAWAL PHASE',  icon: '⚡', text: "This is why you feel restless without your phone. It's normal. It passes." },
  { day: 7,  title: 'CORTISOL DROP',      icon: '📉', text: 'Your stress levels are physically dropping. The brain fog starts lifting here.' },
  { day: 14, title: 'ATTENTION RESET',    icon: '🎯', text: 'Your ability to focus just got 10 years younger. Not a metaphor — real data.' },
  { day: 30, title: 'NEURAL REWIRING',    icon: '🧠', text: 'Your brain is physically building new wiring. Like muscle after the gym.' },
  { day: 60, title: 'RECEPTOR RECOVERY',  icon: '🔄', text: 'The part of your brain that craves the scroll is quieting down.' },
  { day: 90, title: 'FULL REWIRE',        icon: '👑', text: "Your brain stops needing the fix. You're rewired." },
];

interface NodeDef { x: number; y: number; day: number; title: string; icon: string; text: string }

function getNodes(): NodeDef[] {
  return MS.map((m, i) => ({
    x: i % 2 === 0 ? LX : RX,
    y: TOP + i * SPACING,
    ...m,
  }));
}

// ─── Cubic Bezier ─────────────────────────────────────────

function cb(t: number, a: number, b: number, c: number, d: number) {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
}

interface Seg { x: number; y: number; len: number; ang: number; filled: boolean; idx: number }

function buildCurve(nodes: NodeDef[], calDay: number): Seg[] {
  const nextI = nodes.findIndex((n) => n.day > calDay);
  const out: Seg[] = [];

  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const my = (a.y + b.y) / 2;

    // How much of this segment is filled (coral)
    let ff: number;
    if (nextI === -1) {
      ff = 1;
    } else if (i + 1 < nextI) {
      ff = 1;
    } else if (i + 1 === nextI) {
      ff = Math.max(0, Math.min(1, (calDay - a.day) / (b.day - a.day)));
    } else if (i === 0 && nextI === 0) {
      ff = Math.max(0, (calDay / a.day) * 0.4);
    } else {
      ff = 0;
    }
    const fc = Math.round(ff * CURVE_RES);

    let prev = { x: a.x, y: a.y };
    for (let j = 1; j <= CURVE_RES; j++) {
      const t = j / CURVE_RES;
      const x = cb(t, a.x, a.x, b.x, b.x);
      const y = cb(t, a.y, my, my, b.y);
      const dx = x - prev.x;
      const dy = y - prev.y;
      out.push({
        x: prev.x,
        y: prev.y,
        len: Math.sqrt(dx * dx + dy * dy),
        ang: Math.atan2(dy, dx),
        filled: j <= fc,
        idx: j,
      });
      prev = { x, y };
    }
  }
  return out;
}

// ─── Pulse ────────────────────────────────────────────────

function Pulse() {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(a, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(a, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [a]);
  const s = NODE + 16;
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: s,
        height: s,
        borderRadius: s / 2,
        borderWidth: 2.5,
        borderColor: C.coral,
        opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.55] }),
        transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }],
      }}
    />
  );
}

// ─── Props ────────────────────────────────────────────────

interface Props {
  sessions: Session[];
  startDate: string;
  onCurrentDayYOffset?: (y: number) => void;
}

// ─── Component ────────────────────────────────────────────

export function RewireTimeline({ sessions: _sessions, startDate, onCurrentDayYOffset }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const reported = useRef(false);

  const calDay = useMemo(() => (startDate ? getCalendarDayNumber(startDate) : 1), [startDate]);
  const nodes = useMemo(() => getNodes(), []);
  const segs = useMemo(() => buildCurve(nodes, calDay), [nodes, calDay]);

  // Index of the node the user is currently working toward
  const nextI = useMemo(() => {
    const i = nodes.findIndex((n) => n.day > calDay);
    return i; // -1 = all done
  }, [nodes, calDay]);

  const totalH = TOP + (MS.length - 1) * SPACING + NODE / 2 + 100;

  // Auto-scroll so current position is near top of viewport
  useEffect(() => {
    if (reported.current || !onCurrentDayYOffset) return;
    const target = nextI >= 0 ? nodes[nextI] : nodes[nodes.length - 1];
    const t = setTimeout(() => {
      onCurrentDayYOffset(target.y - 130);
      reported.current = true;
    }, 400);
    return () => clearTimeout(t);
  }, [nodes, nextI, onCurrentDayYOffset]);

  const dateStr = useMemo(() => {
    if (!startDate) return '';
    const d = new Date(startDate + 'T00:00:00');
    const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${m[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }, [startDate]);

  const dismiss = useCallback(() => setActive(null), []);

  return (
    <View style={[st.root, { height: totalH }]}>
      {/* Subtle start date */}
      <Text style={st.startDate}>STARTED {dateStr.toUpperCase()}</Text>

      {/* ── The Path ── */}
      {segs.map((s, i) => {
        // Future segments: render every other one for dashed effect
        if (!s.filled && s.idx % 2 === 0) return null;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y - PATH / 2,
              width: s.len,
              height: PATH,
              backgroundColor: s.filled ? C.coral : 'rgba(255,255,255,0.10)',
              borderRadius: PATH / 2,
              transformOrigin: 'left center',
              transform: [{ rotate: `${s.ang}rad` }],
            }}
          />
        );
      })}

      {/* ── The Nodes ── */}
      {nodes.map((node, i) => {
        const done = nextI === -1 ? true : i < nextI;
        const isNext = i === nextI;
        const isFut = !done && !isNext;

        return (
          <React.Fragment key={node.day}>
            {/* TODAY floating label */}
            {isNext && calDay <= 90 && (
              <Text
                style={[
                  st.today,
                  { left: node.x - 28, top: node.y - NODE / 2 - 24 },
                ]}
              >
                TODAY
              </Text>
            )}

            {/* Node circle */}
            <TouchableOpacity
              style={[st.wrap, { left: node.x - NODE / 2, top: node.y - NODE / 2 }]}
              onPress={() => setActive((p) => (p === node.day ? null : node.day))}
              activeOpacity={0.8}
            >
              {isNext && <Pulse />}
              <View
                style={[
                  st.circle,
                  done && st.circleDone,
                  isNext && st.circleNext,
                  isFut && st.circleFut,
                ]}
              >
                <Text style={{ fontSize: 26, opacity: isFut ? 0.3 : 1 }}>
                  {done ? '✓' : node.icon}
                </Text>
              </View>

              {/* White check badge */}
              {done && (
                <View style={st.badge}>
                  <Text style={st.badgeT}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* ── Tap-to-reveal card ── */}
            {active === node.day && (
              <>
                <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
                <View
                  style={[
                    st.card,
                    {
                      left: Math.max(4, Math.min(node.x - 110, W - 224)),
                      top: node.y + NODE / 2 + 14,
                    },
                  ]}
                >
                  <Text style={st.cardTitle}>{node.title}</Text>
                  <View style={st.pill}>
                    <Text style={st.pillT}>Day {node.day}</Text>
                  </View>
                  <Text style={st.cardDesc}>{node.text}</Text>
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
      <View style={[st.finish, { top: nodes[nodes.length - 1].y + NODE / 2 + 28 }]}>
        <View style={st.finishRule} />
        <Text style={st.finishT}>THE FINISH LINE</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────

const st = StyleSheet.create({
  root: { width: W, position: 'relative' },

  startDate: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    fontFamily: FONTS.monoMedium,
    color: 'rgba(255,255,255,0.12)',
    letterSpacing: 2,
  },

  today: {
    position: 'absolute',
    width: 56,
    textAlign: 'center',
    zIndex: 5,
    fontSize: 10,
    fontFamily: FONTS.bodyBold,
    color: C.coral,
    letterSpacing: 1,
  },

  wrap: {
    position: 'absolute',
    width: NODE,
    height: NODE,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  circle: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  circleDone: {
    backgroundColor: C.coral,
    borderColor: C.coral,
  },
  circleNext: {
    backgroundColor: 'rgba(255,77,106,0.10)',
    borderColor: C.coral,
    borderWidth: 3,
  },
  circleFut: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.08)',
  },

  badge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  badgeT: { fontSize: 10, color: C.coral, fontWeight: '700' },

  // Tap-to-reveal card
  card: {
    position: 'absolute',
    width: 220,
    zIndex: 20,
    backgroundColor: 'rgba(18,18,30,0.97)',
    borderRadius: 16,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: FONTS.heading,
    color: '#fff',
    letterSpacing: 0.5,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(233,69,96,0.15)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillT: {
    fontSize: 11,
    fontFamily: FONTS.bodyBold,
    color: C.coral,
  },
  cardDesc: {
    fontSize: 13,
    fontFamily: FONTS.body,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 19,
  },
  shareBtn: {
    alignSelf: 'flex-start',
    backgroundColor: C.coral,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginTop: 2,
  },
  shareT: {
    fontSize: 11,
    fontFamily: FONTS.heading,
    color: '#fff',
    letterSpacing: 1,
  },

  finish: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  finishRule: {
    width: 50,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 1,
  },
  finishT: {
    fontSize: 10,
    fontFamily: FONTS.monoMedium,
    color: 'rgba(255,255,255,0.12)',
    letterSpacing: 3,
  },
});
