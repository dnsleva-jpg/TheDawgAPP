// ─── Scoring Engine ──────────────────────────────────────────────────────────
// Pure class — no React dependencies. Can be used from hooks, worklets, or tests.
// v2: Simple frame-to-frame delta scoring (replaces 4-layer system).

import type { ScoringConfig, DeepPartial } from './scoringConfig';

// ─── Public types ────────────────────────────────────────────────────────────

export interface CalibrationFrame {
  timestamp: number;
  yaw: number;
  pitch: number;
  roll: number;
  faceX: number;
  faceY: number;
}

export interface FaceFrameInput {
  yaw: number;
  pitch: number;
  roll: number;
  faceX: number;
  faceY: number;
  leftEyeOpenProbability: number;
  rightEyeOpenProbability: number;
  timestamp: number;
}

export interface FrameResult {
  frameScore: number;
  currentStillness: number;
  liveStillness: number;
  blinkCount: number;
  isCalibrating: boolean;
}

export interface SessionResults {
  dawgScore: number;
  stillnessScore: number;
  blinkScore: number;
  durationScore: number;
  grade: string;
  label: string;
  color: string;
  blinksPerMinute: number;
  stillnessPercent: number;
  facePresencePercent: number;
}

// ─── Internal types ──────────────────────────────────────────────────────────

interface Baseline {
  yaw: number;
  pitch: number;
  roll: number;
  faceX: number;
  faceY: number;
}

type BlinkState = 'open' | 'closed';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const sumSq = values.reduce((s, v) => s + (v - mean) * (v - mean), 0);
  return Math.sqrt(sumSq / (values.length - 1));
}

function clamp(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

function deepMerge<T extends Record<string, any>>(base: T, overrides: DeepPartial<T>): T {
  const result = { ...base } as any;
  for (const key of Object.keys(overrides)) {
    const val = (overrides as any)[key];
    if (val !== undefined && val !== null && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = deepMerge(result[key] ?? {}, val);
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

// ─── ScoringEngine ───────────────────────────────────────────────────────────

export class ScoringEngine {
  private cfg: ScoringConfig;

  // Calibration
  private _isCalibrating = true;
  private baseline: Baseline = { yaw: 0, pitch: 0, roll: 0, faceX: 0, faceY: 0 };
  private deadZones: Baseline = { yaw: 0, pitch: 0, roll: 0, faceX: 0, faceY: 0 };

  // Previous frame smoothed angles (for frame-to-frame delta)
  private prevYaw = 0;
  private prevPitch = 0;
  private prevRoll = 0;
  private hasPrevFrame = false;

  // EMA-smoothed euler angles
  private smoothedYaw = 0;
  private smoothedPitch = 0;
  private smoothedRoll = 0;
  private hasSmoothedValues = false;

  // Timing
  private lastFrameTimestamp = 0;

  // Blink tracking
  private blinkState: BlinkState = 'open';
  private totalBlinks = 0;
  private closedFrameCount = 0;

  // Face lost handling
  private lastFaceTimestamp = 0;
  private lastKnownValues: FaceFrameInput | null = null;

  // Scoring accumulators
  private frameScores: number[] = [];
  private totalFrames = 0;
  private framesWithFace = 0;
  private smoothedLiveStillness = 100;
  private lastFrameResult: FrameResult = { frameScore: 1, currentStillness: 100, liveStillness: 100, blinkCount: 0, isCalibrating: true };

  // ─── Constructor ─────────────────────────────────────────────────────────

  constructor(config: ScoringConfig, overrides?: DeepPartial<ScoringConfig>) {
    this.cfg = overrides ? deepMerge(config, overrides) : { ...config };
  }

  // ─── Calibrate ───────────────────────────────────────────────────────────

  calibrate(frames: CalibrationFrame[]): void {
    if (frames.length === 0) {
      this._isCalibrating = false;
      return;
    }

    const startTime = frames[0].timestamp;
    const discardBefore = startTime + this.cfg.calibration.discardFirstMs;

    const usable = frames
      .filter((f) => f.timestamp >= discardBefore)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (usable.length === 0) {
      this._isCalibrating = false;
      return;
    }

    if (usable.length < 30) {
      if (__DEV__) console.log(`[ScoringEngine] WARNING: only ${usable.length} calibration frames, using safe defaults`);
      this.baseline = { yaw: 0, pitch: 0, roll: 0, faceX: 0, faceY: 0 };
      this.deadZones = { yaw: 1.5, pitch: 1.5, roll: 1.5, faceX: 10, faceY: 10 };
      this._isCalibrating = false;
      return;
    }

    const yaws = usable.map((f) => f.yaw);
    const pitches = usable.map((f) => f.pitch);
    const rolls = usable.map((f) => f.roll);
    const faceXs = usable.map((f) => f.faceX);
    const faceYs = usable.map((f) => f.faceY);

    this.baseline = {
      yaw: median(yaws),
      pitch: median(pitches),
      roll: median(rolls),
      faceX: median(faceXs),
      faceY: median(faceYs),
    };

    const mult = this.cfg.calibration.deadZoneMultiplier;
    const maxDZ = this.cfg.calibration.maxDeadZoneDegrees;
    this.deadZones = {
      yaw: Math.min(Math.max(stdDev(yaws, this.baseline.yaw) * mult, 0.3), maxDZ),
      pitch: Math.min(Math.max(stdDev(pitches, this.baseline.pitch) * mult, 0.3), maxDZ),
      roll: Math.min(Math.max(stdDev(rolls, this.baseline.roll) * mult, 0.3), maxDZ),
      faceX: stdDev(faceXs, this.baseline.faceX) * mult,
      faceY: stdDev(faceYs, this.baseline.faceY) * mult,
    };

    // Initialize smoothed and previous values from last calibration frame
    const lastCal = usable[usable.length - 1];
    this.smoothedYaw = lastCal.yaw;
    this.smoothedPitch = lastCal.pitch;
    this.smoothedRoll = lastCal.roll;
    this.hasSmoothedValues = true;

    this.prevYaw = lastCal.yaw;
    this.prevPitch = lastCal.pitch;
    this.prevRoll = lastCal.roll;
    this.hasPrevFrame = true;

    this._isCalibrating = false;

    // #region agent log
    console.log(`[SCORE-CAL] usable=${usable.length} baseline={y:${this.baseline.yaw.toFixed(2)},p:${this.baseline.pitch.toFixed(2)},r:${this.baseline.roll.toFixed(2)}} deadZone={y:${this.deadZones.yaw.toFixed(2)},p:${this.deadZones.pitch.toFixed(2)},r:${this.deadZones.roll.toFixed(2)}} mult=${mult}`);
    // #endregion
  }

  // ─── Process Frame ───────────────────────────────────────────────────────
  // v2: Simple frame-to-frame delta scoring.
  // Measures how much the head moved SINCE LAST FRAME (not from calibration baseline).
  // Sitting still → delta ≈ 0 → score ≈ 100. Moving → delta grows → score drops.

  processFrame(faceData: FaceFrameInput | null): FrameResult {
    if (this._isCalibrating) {
      return { frameScore: 1, currentStillness: 100, liveStillness: 100, blinkCount: this.totalBlinks, isCalibrating: true };
    }

    // Safety: skip frames with bad data
    if (faceData !== null) {
      const { yaw, pitch, roll } = faceData;
      if (yaw == null || pitch == null || roll == null || isNaN(yaw) || isNaN(pitch) || isNaN(roll)) {
        return { ...this.lastFrameResult, blinkCount: this.totalBlinks };
      }
    }

    const now = faceData?.timestamp ?? Date.now();
    this.totalFrames++;

    // ── Face NOT detected ────────────────────────────────────────────────
    if (faceData === null) {
      if (this.lastKnownValues && (now - this.lastFaceTimestamp) <= this.cfg.smoothing.faceLostMaxMs) {
        // Brief face loss — hold score, don't penalize
        this.lastFrameTimestamp = now;
        return { ...this.lastFrameResult, blinkCount: this.totalBlinks };
      }
      // Face lost too long — score 0
      this.frameScores.push(0);
      this.smoothedLiveStillness = 0.3 * 0 + 0.7 * this.smoothedLiveStillness;
      this.lastFrameTimestamp = now;
      this.lastFrameResult = { frameScore: 0, currentStillness: 0, liveStillness: Math.round(this.smoothedLiveStillness), blinkCount: this.totalBlinks, isCalibrating: false };
      return this.lastFrameResult;
    }

    // ── Face IS detected ─────────────────────────────────────────────────
    this.lastFaceTimestamp = now;
    this.lastKnownValues = { ...faceData };
    this.framesWithFace++;

    // Blink tracking
    this.trackBlink(faceData, now);

    // EMA smoothing of raw angles
    const alpha = this.cfg.smoothing.eulerEmaAlpha;
    if (!this.hasSmoothedValues) {
      this.smoothedYaw = faceData.yaw;
      this.smoothedPitch = faceData.pitch;
      this.smoothedRoll = faceData.roll;
      this.hasSmoothedValues = true;
    } else {
      this.smoothedYaw = alpha * faceData.yaw + (1 - alpha) * this.smoothedYaw;
      this.smoothedPitch = alpha * faceData.pitch + (1 - alpha) * this.smoothedPitch;
      this.smoothedRoll = alpha * faceData.roll + (1 - alpha) * this.smoothedRoll;
    }

    // ── Frame-to-frame delta scoring ─────────────────────────────────────
    let frameStillness: number;

    if (!this.hasPrevFrame) {
      // First frame after calibration — perfect score
      frameStillness = 100;
    } else {
      const yawDelta = Math.abs(this.smoothedYaw - this.prevYaw);
      const pitchDelta = Math.abs(this.smoothedPitch - this.prevPitch);
      const rollDelta = Math.abs(this.smoothedRoll - this.prevRoll);

      // Weighted movement magnitude
      const effectiveMovement = Math.sqrt(
        yawDelta * yawDelta +
        pitchDelta * pitchDelta +
        0.7 * rollDelta * rollDelta
      );

      // Subtract dead zone (use average of yaw/pitch dead zones as a baseline)
      const deadZone = Math.min(this.deadZones.yaw, this.deadZones.pitch) * 0.15;
      const adjustedMovement = Math.max(0, effectiveMovement - deadZone);

      // Linear scoring: 0 movement = 100, 2+ degrees = 25 (floor)
      frameStillness = clamp(25, 100, 100 * (1 - adjustedMovement / 2.0));
    }

    // Save current as previous for next frame
    this.prevYaw = this.smoothedYaw;
    this.prevPitch = this.smoothedPitch;
    this.prevRoll = this.smoothedRoll;
    this.hasPrevFrame = true;

    // ── Accumulate ──────────────────────────────────────────────────────
    const frameScore = frameStillness / 100; // normalize to 0-1 for storage
    this.frameScores.push(frameScore);
    this.lastFrameTimestamp = now;

    // Running average for display
    const avg = this.frameScores.reduce((s, v) => s + v, 0) / this.frameScores.length;
    const currentStillness = Math.round(avg * 100);

    // Live display: fast EMA (alpha 0.3) for smooth real-time feedback
    this.smoothedLiveStillness = 0.3 * frameStillness + 0.7 * this.smoothedLiveStillness;
    const liveStillness = Math.round(this.smoothedLiveStillness);

    // #region agent log
    if (this.totalFrames % 30 === 0) {
      const yawDelta = this.hasPrevFrame ? Math.abs(this.smoothedYaw - this.prevYaw).toFixed(3) : 'N/A';
      console.log(`[Score] n=${this.totalFrames} frame=${frameStillness.toFixed(0)} still=${currentStillness} live=${liveStillness} movement=${yawDelta}`);
    }
    // #endregion

    this.lastFrameResult = {
      frameScore,
      currentStillness,
      liveStillness,
      blinkCount: this.totalBlinks,
      isCalibrating: false,
    };

    return this.lastFrameResult;
  }

  // ─── Blink Tracking ──────────────────────────────────────────────────────
  // Matches the proven useFaceTracking approach: simple 2-state machine,
  // no duration cap, thresholds: closed < 0.3, open > 0.5.

  private trackBlink(data: FaceFrameInput, _now: number): void {
    const leftEye = data.leftEyeOpenProbability;
    const rightEye = data.rightEyeOpenProbability;

    if (leftEye < 0 || rightEye < 0) return;

    const eyesClosed = leftEye < this.cfg.blink.eyeClosedThreshold && rightEye < this.cfg.blink.eyeClosedThreshold;
    const eyesOpen = leftEye > this.cfg.blink.eyeOpenThreshold && rightEye > this.cfg.blink.eyeOpenThreshold;

    if (this.blinkState === 'open') {
      if (eyesClosed) {
        this.closedFrameCount += 1;
        if (this.closedFrameCount >= 1) {
          this.blinkState = 'closed';
        }
      } else {
        this.closedFrameCount = 0;
      }
    } else if (this.blinkState === 'closed') {
      if (eyesOpen) {
        this.totalBlinks++;
        this.blinkState = 'open';
        this.closedFrameCount = 0;
      }
    }
  }

  // ─── Session Results ─────────────────────────────────────────────────────

  getSessionResults(durationMinutes: number, committedDurationSeconds?: number): SessionResults {
    const safeDuration = Math.max(durationMinutes, 0.01);
    const actualSeconds = safeDuration * 60;

    // Face presence
    const facePresencePercent = this.totalFrames > 0
      ? Math.round((this.framesWithFace / this.totalFrames) * 100)
      : 0;

    // Stillness score: trimmed mean — drop worst 10% of frames, average the rest
    let stillnessScore = 0;
    if (this.frameScores.length > 0) {
      const sorted = [...this.frameScores].sort((a, b) => a - b);
      const trimCount = Math.floor(sorted.length * 0.1);
      const trimmed = sorted.slice(trimCount);
      stillnessScore = trimmed.length > 0
        ? (trimmed.reduce((s, v) => s + v, 0) / trimmed.length) * 100
        : 0;
      // #region agent log
      const p10 = sorted[Math.floor(sorted.length * 0.1)] ?? 0;
      const p25 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
      const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
      const p75 = sorted[Math.floor(sorted.length * 0.75)] ?? 0;
      const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? 0;
      const zeroFrames = sorted.filter(v => v === 0).length;
      console.log(`[SCORE-DIST] frames=${sorted.length} trimmed=${trimmed.length} zeros=${zeroFrames} p10=${p10.toFixed(3)} p25=${p25.toFixed(3)} p50=${p50.toFixed(3)} p75=${p75.toFixed(3)} p90=${p90.toFixed(3)} trimmedMean=${stillnessScore.toFixed(1)} facePresence=${facePresencePercent}%`);
      // #endregion
    }

    // Floor: stillness can't drop below 25 if face was present > 50% of session
    if (stillnessScore < 25 && facePresencePercent > 50) {
      stillnessScore = 25;
    }

    // Blink score
    const blinksPerMinute = this.totalBlinks / safeDuration;
    const bk = this.cfg.blink;
    const blinkRange = bk.maxCeiling - bk.minFloor;
    const blinkScore = blinkRange > 0
      ? clamp(0, 100, 100 * (1 - (blinksPerMinute - bk.minFloor) / blinkRange))
      : 100;

    // Duration score: log curve scaled by completion ratio
    const dur = this.cfg.duration;
    const rawDurationScore = dur.baseScore + dur.logMultiplier * Math.log(safeDuration + 1);

    let completionRatio = 1.0;
    if (committedDurationSeconds != null && committedDurationSeconds > 0) {
      completionRatio = Math.min(1.0, actualSeconds / committedDurationSeconds);
    }

    const durationScore = Math.min(dur.maxScore, rawDurationScore * completionRatio);

    // #region agent log
    console.log(`[SCORE-DUR] actual=${actualSeconds.toFixed(0)}s committed=${committedDurationSeconds ?? 'N/A'}s ratio=${completionRatio.toFixed(2)} raw=${rawDurationScore.toFixed(1)} final=${durationScore.toFixed(1)}`);
    // #endregion

    // Composite DAWG Score
    const comp = this.cfg.composite;
    const dawgScore = clamp(
      0,
      100,
      stillnessScore * comp.stillnessWeight +
      blinkScore * comp.blinkWeight +
      durationScore * comp.durationWeight
    );

    // Grade lookup
    const gradeEntry = this.cfg.grades.find((g) => dawgScore >= g.min) ?? this.cfg.grades[this.cfg.grades.length - 1];

    const results = {
      dawgScore: Math.round(dawgScore * 10) / 10,
      stillnessScore: Math.round(stillnessScore * 10) / 10,
      blinkScore: Math.round(blinkScore * 10) / 10,
      durationScore: Math.round(durationScore * 10) / 10,
      grade: gradeEntry.grade,
      label: gradeEntry.label,
      color: gradeEntry.color,
      blinksPerMinute: Math.round(blinksPerMinute * 10) / 10,
      stillnessPercent: Math.round(stillnessScore),
      facePresencePercent,
    };
    // #region agent log
    console.log(`[SCORE-FINAL] dawg=${results.dawgScore} still=${results.stillnessScore}*${comp.stillnessWeight}=${(stillnessScore*comp.stillnessWeight).toFixed(1)} blink=${results.blinkScore}*${comp.blinkWeight}=${(blinkScore*comp.blinkWeight).toFixed(1)} dur=${results.durationScore}*${comp.durationWeight}=${(durationScore*comp.durationWeight).toFixed(1)} grade=${results.grade} bpm=${results.blinksPerMinute} face=${results.facePresencePercent}%`);
    // #endregion
    return results;
  }

  // ─── Public accessors ────────────────────────────────────────────────────

  get isCalibrating(): boolean {
    return this._isCalibrating;
  }

  get blinkCount(): number {
    return this.totalBlinks;
  }

  /** Reset all state for a new session */
  reset(): void {
    this._isCalibrating = true;
    this.baseline = { yaw: 0, pitch: 0, roll: 0, faceX: 0, faceY: 0 };
    this.deadZones = { yaw: 0, pitch: 0, roll: 0, faceX: 0, faceY: 0 };
    this.prevYaw = 0;
    this.prevPitch = 0;
    this.prevRoll = 0;
    this.hasPrevFrame = false;
    this.smoothedYaw = 0;
    this.smoothedPitch = 0;
    this.smoothedRoll = 0;
    this.hasSmoothedValues = false;
    this.lastFrameTimestamp = 0;
    this.blinkState = 'open';
    this.totalBlinks = 0;
    this.closedFrameCount = 0;
    this.lastFaceTimestamp = 0;
    this.lastKnownValues = null;
    this.frameScores = [];
    this.totalFrames = 0;
    this.framesWithFace = 0;
    this.smoothedLiveStillness = 100;
    this.lastFrameResult = { frameScore: 1, currentStillness: 100, liveStillness: 100, blinkCount: 0, isCalibrating: true };
  }
}
