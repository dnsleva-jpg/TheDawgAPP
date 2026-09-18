import { useRef, useCallback } from 'react';
import type { Face } from 'react-native-vision-camera-face-detector';
import type { Frame } from 'react-native-vision-camera';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FaceTrackingResults {
  stillnessScore: number;      // 0-100, based on face position movement
  verifiedSeconds: number;     // seconds with face detected
  totalBlinks: number;         // blink count
  presencePercent: number;     // verifiedSeconds / totalSessionSeconds * 100
}

type BlinkState = 'open' | 'closed';

// ─── Constants ───────────────────────────────────────────────────────────────

const STILLNESS_THRESHOLD_PX = 5;       // max pixel delta to count as "still"
const BLINK_CLOSED_THRESHOLD = 0.3;     // eye probability below this = closed
const BLINK_OPEN_THRESHOLD = 0.5;       // eye probability above this = open
const BLINK_MIN_CLOSED_FRAMES = 1;      // min consecutive closed frames for a real blink (lowered for 6fps)
const LOG_INTERVAL_MS = 5000;           // console log every 5 seconds
const FACE_SAMPLE_INTERVAL_MS = 0;      // process every frame (at 6fps every frame matters)

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useFaceTracking() {
  // ─── Per-frame tracking state (all useRef, zero re-renders) ───

  // Face presence
  const faceDetectedRef = useRef(false);
  const totalFramesRef = useRef(0);
  const framesWithFaceRef = useRef(0);

  // Face position (for stillness)
  const prevFaceXRef = useRef<number | null>(null);
  const prevFaceYRef = useRef<number | null>(null);
  const stillFramesRef = useRef(0);
  const totalMovementDeltaRef = useRef(0);

  // Eye / blink tracking
  const blinkStateRef = useRef<BlinkState>('open');
  const closedFrameCountRef = useRef(0);
  const blinksCountRef = useRef(0);
  const lastLeftEyeRef = useRef<number | null>(null);
  const lastRightEyeRef = useRef<number | null>(null);

  // Timing
  const sessionStartTimeRef = useRef<number | null>(null);
  const lastLogTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const faceSecondsRef = useRef(0);
  const lastFaceTimestampRef = useRef<number | null>(null);

  // Last known position for logging
  const lastFaceXRef = useRef(0);
  const lastFaceYRef = useRef(0);
  const lastDeltaRef = useRef(0);

  // ─── Face detection callback (called every frame by Camera) ───

  const handleFacesDetected = useCallback((faces: Face[], frame: Frame) => {
    const now = Date.now();

    // Debug: confirm callback is invoked (helps diagnose reload issues)
    if (__DEV__ && totalFramesRef.current === 0) {
      console.log('[FaceTracking] First frame received, faces:', faces.length);
    }

    // Initialize session start time on first frame
    if (sessionStartTimeRef.current === null) {
      sessionStartTimeRef.current = now;
      lastLogTimeRef.current = now;
    }

    // Throttle: skip frames arriving faster than ~30fps
    if (now - lastFrameTimeRef.current < FACE_SAMPLE_INTERVAL_MS) {
      return;
    }
    lastFrameTimeRef.current = now;

    totalFramesRef.current += 1;

    const face = faces.length > 0 ? faces[0] : null;
    faceDetectedRef.current = face !== null;

    if (face) {
      framesWithFaceRef.current += 1;

      // ─── Track face presence time ───
      if (lastFaceTimestampRef.current !== null) {
        const elapsed = (now - lastFaceTimestampRef.current) / 1000;
        // Only add if gap is reasonable (< 2 seconds, not a big gap)
        if (elapsed < 2) {
          faceSecondsRef.current += elapsed;
        }
      }
      lastFaceTimestampRef.current = now;

      // ─── Face position / stillness tracking ───
      const bounds = face.bounds;
      const centerX = bounds.x + bounds.width / 2;
      const centerY = bounds.y + bounds.height / 2;

      lastFaceXRef.current = centerX;
      lastFaceYRef.current = centerY;

      if (prevFaceXRef.current !== null && prevFaceYRef.current !== null) {
        const dx = centerX - prevFaceXRef.current;
        const dy = centerY - prevFaceYRef.current;
        const delta = Math.sqrt(dx * dx + dy * dy);

        lastDeltaRef.current = delta;
        totalMovementDeltaRef.current += delta;

        if (delta < STILLNESS_THRESHOLD_PX) {
          stillFramesRef.current += 1;
        }
      } else {
        // First frame with face — counts as still (no movement yet)
        stillFramesRef.current += 1;
        lastDeltaRef.current = 0;
      }

      prevFaceXRef.current = centerX;
      prevFaceYRef.current = centerY;

      // ─── Eye / blink detection ───
      // ML Kit returns -1 when classificationMode is 'none' or classification failed
      const leftEye = face.leftEyeOpenProbability;
      const rightEye = face.rightEyeOpenProbability;
      const hasValidEyes = leftEye >= 0 && rightEye >= 0;

      if (hasValidEyes) {
        lastLeftEyeRef.current = leftEye;
        lastRightEyeRef.current = rightEye;

        const eyesClosed = leftEye < BLINK_CLOSED_THRESHOLD && rightEye < BLINK_CLOSED_THRESHOLD;
        const eyesOpen = leftEye > BLINK_OPEN_THRESHOLD && rightEye > BLINK_OPEN_THRESHOLD;

        if (blinkStateRef.current === 'open') {
          if (eyesClosed) {
            closedFrameCountRef.current += 1;
            if (closedFrameCountRef.current >= BLINK_MIN_CLOSED_FRAMES) {
              blinkStateRef.current = 'closed';
            }
          } else {
            closedFrameCountRef.current = 0;
          }
        } else if (blinkStateRef.current === 'closed') {
          if (eyesOpen) {
            // Blink complete: closed -> open transition
            blinksCountRef.current += 1;
            blinkStateRef.current = 'open';
            closedFrameCountRef.current = 0;
          }
        }
      }
    } else {
      // No face detected — reset position tracking
      prevFaceXRef.current = null;
      prevFaceYRef.current = null;
      lastFaceTimestampRef.current = null;
    }

    // ─── Console log every 5 seconds ───
    if (__DEV__ && now - lastLogTimeRef.current >= LOG_INTERVAL_MS && sessionStartTimeRef.current !== null) {
      const elapsed = (now - sessionStartTimeRef.current) / 1000;
      const stillness = framesWithFaceRef.current > 0
        ? Math.round((stillFramesRef.current / framesWithFaceRef.current) * 100)
        : 0;
      const presence = elapsed > 0
        ? Math.round((faceSecondsRef.current / elapsed) * 100)
        : 0;
      const avgDelta = framesWithFaceRef.current > 1
        ? (totalMovementDeltaRef.current / (framesWithFaceRef.current - 1)).toFixed(1)
        : '0.0';

      console.log(
        `[FaceTracking ${elapsed.toFixed(0)}s] ` +
        `face=${faceDetectedRef.current ? 'YES' : 'NO'} | ` +
        `pos=(${lastFaceXRef.current.toFixed(1)}, ${lastFaceYRef.current.toFixed(1)}) | ` +
        `delta=${lastDeltaRef.current.toFixed(1)}px avgDelta=${avgDelta}px | ` +
        `eyes=L:${lastLeftEyeRef.current?.toFixed(2) ?? 'N/A'} R:${lastRightEyeRef.current?.toFixed(2) ?? 'N/A'} | ` +
        `still=${stillness}% | ` +
        `blinks=${blinksCountRef.current} | ` +
        `verified=${faceSecondsRef.current.toFixed(1)}s/${elapsed.toFixed(1)}s (${presence}%)`
      );

      lastLogTimeRef.current = now;
    }

  }, []);

  // ─── Get final results (called once when session ends) ───

  // ─── Reset state (call when starting a new session) ───

  const reset = useCallback(() => {
    faceDetectedRef.current = false;
    totalFramesRef.current = 0;
    framesWithFaceRef.current = 0;
    prevFaceXRef.current = null;
    prevFaceYRef.current = null;
    stillFramesRef.current = 0;
    totalMovementDeltaRef.current = 0;
    blinkStateRef.current = 'open';
    closedFrameCountRef.current = 0;
    blinksCountRef.current = 0;
    lastLeftEyeRef.current = null;
    lastRightEyeRef.current = null;
    sessionStartTimeRef.current = null;
    lastLogTimeRef.current = 0;
    lastFrameTimeRef.current = 0;
    faceSecondsRef.current = 0;
    lastFaceTimestampRef.current = null;
    lastFaceXRef.current = 0;
    lastFaceYRef.current = 0;
    lastDeltaRef.current = 0;
  }, []);

  // ─── Get final results (called once when session ends) ───

  const getResults = useCallback((): FaceTrackingResults => {
    const now = Date.now();
    const totalSessionSeconds = sessionStartTimeRef.current
      ? (now - sessionStartTimeRef.current) / 1000
      : 0;

    const stillnessScore = framesWithFaceRef.current > 0
      ? Math.round((stillFramesRef.current / framesWithFaceRef.current) * 100)
      : 0;

    const verifiedSeconds = Math.round(faceSecondsRef.current);

    const presencePercent = totalSessionSeconds > 0
      ? Math.round((faceSecondsRef.current / totalSessionSeconds) * 100)
      : 0;

    const results: FaceTrackingResults = {
      stillnessScore,
      verifiedSeconds,
      totalBlinks: blinksCountRef.current,
      presencePercent,
    };

    if (__DEV__) {
      console.log('[FaceTracking] Session ended. Final results:', results);
      console.log('[FaceTracking] Raw data:', {
        totalFrames: totalFramesRef.current,
        framesWithFace: framesWithFaceRef.current,
        stillFrames: stillFramesRef.current,
        totalMovementDelta: totalMovementDeltaRef.current.toFixed(1),
        avgDeltaPerFrame: framesWithFaceRef.current > 1
          ? (totalMovementDeltaRef.current / (framesWithFaceRef.current - 1)).toFixed(2)
          : '0',
        faceSeconds: faceSecondsRef.current.toFixed(1),
        totalSessionSeconds: totalSessionSeconds.toFixed(1),
      });
    }

    return results;
  }, []);

  return {
    handleFacesDetected,
    getResults,
    reset,
  };
}
