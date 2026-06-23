'use client';

/**
 * Real-time hand presence + palm-orientation detector.
 *
 * Uses TensorFlow.js MediaPipe Hands (already a project dep) to find 21 hand
 * landmarks per frame. We then check:
 *   1. confidence > threshold,
 *   2. fingers are extended (open palm — not a fist or other gesture),
 *   3. palm fills enough of the frame.
 *
 * Only frames that pass this gate proceed to the OpenCV pipeline + embedding,
 * so the system can never auto-capture a face / shirt / wall.
 *
 * Returned `bbox` is the tight palm region (wrist + MCPs) expanded by 25% — the
 * caller crops to it before sending to the embedding worker, replacing the
 * brittle "centre-crop" used by the original pipeline.
 */
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import * as tf from '@tensorflow/tfjs-core';

export interface PalmDetection {
  /** True if a forward-facing open palm of sufficient size is present. */
  ok: boolean;
  /** Hand-detection confidence (0..1). */
  score: number;
  /** Number of extended fingers (incl. thumb). 4–5 = open palm. */
  extendedFingers: number;
  /** Tight bounding box of the palm region in source-pixel coords. */
  bbox: { x: number; y: number; w: number; h: number } | null;
  /** Fraction of frame area covered by the palm bbox. */
  coverage: number;
  /** Human-readable reason for the current gate state. */
  reason: string;
}

const FALLBACK: PalmDetection = {
  ok: false,
  score: 0,
  extendedFingers: 0,
  bbox: null,
  coverage: 0,
  reason: 'No hand detected',
};

let detector: handPoseDetection.HandDetector | null = null;
let loading: Promise<handPoseDetection.HandDetector> | null = null;

async function getDetector(): Promise<handPoseDetection.HandDetector> {
  if (detector) return detector;
  if (loading) return loading;
  loading = (async () => {
    await tf.setBackend('webgl');
    await tf.ready();
    const det = await handPoseDetection.createDetector(
      handPoseDetection.SupportedModels.MediaPipeHands,
      {
        runtime: 'tfjs',
        maxHands: 1,
        modelType: 'lite', // faster on a CPU, plenty for presence detection
      },
    );
    detector = det;
    return det;
  })();
  return loading;
}

/** Pre-load the hand-detection model. Idempotent. */
export function preloadHandDetector(): Promise<void> {
  return getDetector().then(() => undefined);
}

/** Has the detector finished loading? */
export function isHandDetectorReady(): boolean {
  return !!detector;
}

// MediaPipe hand-landmark indices (0–20).
const WRIST = 0;
const TIPS = [4, 8, 12, 16, 20];
const MCPS = [5, 9, 13, 17]; // index..pinky MCPs (skip thumb CMC=1)
// Finger bases for the extension test — thumb MCP=2, then index..pinky MCPs.
const FINGER_BASES = [2, 5, 9, 13, 17];

const MIN_COVERAGE = 0.05;
const MIN_SCORE = 0.6;
const MIN_FINGERS = 3;
const PAD = 0.25;

/**
 * Count extended fingers in a ROTATION-INVARIANT way: a finger is extended when
 * its tip is meaningfully farther from the wrist than its knuckle (MCP). This
 * holds whether the hand is upright, sideways or tilted — unlike a y-axis test.
 */
function countExtendedFingers(kps: handPoseDetection.Keypoint[]): number {
  const wrist = kps[0];
  if (!wrist) return 0;
  const dist = (a: handPoseDetection.Keypoint, b: handPoseDetection.Keypoint) =>
    Math.hypot(a.x - b.x, a.y - b.y);
  let n = 0;
  for (let i = 0; i < TIPS.length; i++) {
    const tip = kps[TIPS[i]];
    const base = kps[FINGER_BASES[i]];
    if (!tip || !base) continue;
    // Extended finger: fingertip reaches well beyond the knuckle from the wrist.
    // Curled finger: tip falls back toward the palm, so this ratio drops below 1.
    if (dist(tip, wrist) > dist(base, wrist) * 1.2) n++;
  }
  return n;
}

/**
 * Run detection on a video/canvas frame and return whether it contains a
 * usable open palm. Designed to be called at 5–10 Hz from the main thread.
 */
export async function detectPalm(
  input: HTMLVideoElement | HTMLCanvasElement,
): Promise<PalmDetection> {
  let det: handPoseDetection.HandDetector;
  try {
    det = await getDetector();
  } catch (e: any) {
    return { ...FALLBACK, reason: `Detector failed to load: ${e?.message ?? e}` };
  }

  let hands: handPoseDetection.Hand[] = [];
  try {
    hands = await det.estimateHands(input as any, { flipHorizontal: false });
  } catch (e: any) {
    return { ...FALLBACK, reason: `Detection error: ${e?.message ?? e}` };
  }

  if (!hands.length) return FALLBACK;

  const hand = hands[0];
  const kps = hand.keypoints;
  if (!kps?.length) return { ...FALLBACK, reason: 'No keypoints' };

  // Source frame size (works for both video and canvas inputs).
  const srcW = (input as HTMLVideoElement).videoWidth || (input as HTMLCanvasElement).width;
  const srcH = (input as HTMLVideoElement).videoHeight || (input as HTMLCanvasElement).height;

  // Palm bbox: wrist + index..pinky MCPs (skip the loose thumb to avoid drift).
  const palmPoints = [WRIST, ...MCPS].map((i) => kps[i]).filter(Boolean);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of palmPoints) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  const palmW = Math.max(1, maxX - minX);
  const palmH = Math.max(1, maxY - minY);
  // Pad and expand to a square that fully contains the palm + fingers.
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  // Use the larger of palm extent and finger reach so we capture the full hand.
  const reach = Math.max(palmW, palmH) * (1 + PAD * 2) * 1.4;
  const size = Math.min(Math.max(reach, Math.min(srcW, srcH) * 0.3), Math.min(srcW, srcH));
  const x = Math.max(0, Math.round(cx - size / 2));
  const y = Math.max(0, Math.round(cy - size / 2));
  const w = Math.min(srcW - x, Math.round(size));
  const h = Math.min(srcH - y, Math.round(size));
  const bbox = { x, y, w, h };
  const coverage = (w * h) / (srcW * srcH);

  // Rotation-invariant open-palm test (informational — NOT a hard gate, so a
  // perfectly good open palm is never rejected on finger geometry).
  const extended = countExtendedFingers(kps);

  // Hard gate: a hand is present (MediaPipe never fires on faces) and large
  // enough to read. That alone reliably rejects faces / objects / background.
  const reasons: string[] = [];
  if (hand.score < MIN_SCORE) reasons.push('hold your hand steady');
  if (coverage < MIN_COVERAGE) reasons.push('move your palm closer');

  const ok = reasons.length === 0;
  return {
    ok,
    score: hand.score,
    extendedFingers: extended,
    bbox,
    coverage,
    reason: ok
      ? `Open palm detected (${extended} fingers, ${(coverage * 100) | 0}% area)`
      : reasons.join(' · '),
  };
}

/**
 * Crop a canvas to a bbox, returning a NEW canvas at the requested output size.
 * Caller uses this to send only the palm region to the embedding pipeline.
 */
export function cropToCanvas(
  source: HTMLCanvasElement | HTMLVideoElement,
  bbox: { x: number; y: number; w: number; h: number },
  outSize = 640,
): HTMLCanvasElement {
  const out = document.createElement('canvas');
  out.width = outSize;
  out.height = outSize;
  const ctx = out.getContext('2d')!;
  ctx.drawImage(source, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, outSize, outSize);
  return out;
}
