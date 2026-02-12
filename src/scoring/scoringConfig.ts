// ─── Scoring Configuration ───────────────────────────────────────────────────
// All tunable algorithm values live here. The ScoringEngine reads from this
// config object — nothing is hardcoded in the engine itself.

export const SCORING_CONFIG = {
  calibration: {
    totalDurationMs: 3000,
    discardFirstMs: 500,
    deadZoneMultiplier: 1.5,
    maxDeadZoneDegrees: 1.5,
    slowRecenterAlpha: 0.02,
    recenterMinStableSeconds: 30,
    recenterMaxDriftDegrees: 3,
  },
  smoothing: {
    eulerEmaAlpha: 0.3,
    faceLostMaxMs: 2000,
    faceReturnBlendFrames: 10,
  },
  instantMovement: {
    yawWeight: 1.0,
    pitchWeight: 1.0,
    rollWeight: 0.7,
    penaltySharpness: 0.3,
  },
  drift: {
    slowAverageAlpha: 0.01,
    penaltySharpness: 0.1,
    layerWeight: 0.2,
  },
  frequency: {
    windowSeconds: 60,
    movementThresholdDegrees: 1.0,
    freeMovementsPerMinute: 4,
    penaltySharpness: 0.25,
    penaltyExponent: 1.5,
    fidgetBurstWindowSeconds: 10,
    fidgetBurstThreshold: 3,
    fidgetBurstPenaltyPerExtra: 0.15,
    layerWeight: 0.4,
  },
  streak: {
    perfectThresholdDegrees: 0.5,
    minorSwayMaxDegrees: 1.0,
    minorSwayDecayRate: 0.05,
    realMovementHalveThreshold: 1.0,
    resetThresholdDegrees: 3.0,
    maxStreakSeconds: 30,
    maxScoreWithoutStreak: 0.85,
    streakBonusWeight: 0.15,
  },
  session: {
    graceperiod: {
      durationSeconds: 15,
      softAlpha: 0.2,
      standardAlpha: 0.05,
    },
  },
  blink: {
    eyeClosedThreshold: 0.3,
    eyeOpenThreshold: 0.5,
    maxBlinkDurationMs: 400,
    minFloor: 0,
    maxCeiling: 35,
  },
  duration: {
    baseScore: 0,
    logMultiplier: 25,
    maxScore: 100,
  },
  composite: {
    stillnessWeight: 0.55,
    blinkWeight: 0.25,
    durationWeight: 0.20,
  },
  grades: [
    { min: 90, grade: 'S' as const, label: 'TRANSCENDENT' as const, color: '#8E44AD' },
    { min: 80, grade: 'A' as const, label: 'FOCUSED' as const, color: '#27AE60' },
    { min: 65, grade: 'B' as const, label: 'SOLID' as const, color: '#2980B9' },
    { min: 50, grade: 'C' as const, label: 'BUILDING' as const, color: '#F39C12' },
    { min: 30, grade: 'D' as const, label: 'RESTLESS' as const, color: '#E67E22' },
    { min: 0,  grade: 'F' as const, label: 'DISTRACTED' as const, color: '#E74C3C' },
  ],
} as const;

// ─── Derived type ────────────────────────────────────────────────────────────
// Mutable version of the config so overrides and merges work without readonly issues.

type Mutable<T> = {
  -readonly [K in keyof T]: T[K] extends readonly (infer U)[]
    ? Mutable<U>[]
    : T[K] extends object
      ? Mutable<T[K]>
      : T[K];
};

export type ScoringConfig = Mutable<typeof SCORING_CONFIG>;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
