'use client';

/**
 * Palm matching via ORB descriptors + Hamming BFMatcher with Lowe's ratio test.
 * The enhanced palm ROI (creases / texture / vein structure) yields keypoints
 * whose descriptors are compared between an enrolled template and a live probe.
 */

export interface SerializedDescriptors {
  rows: number;
  cols: number;
  kp: number;
  b64: string;
}

const ORB_FEATURES = 600;
const RATIO = 0.75;

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(bin);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Detect ORB keypoints + descriptors on an enhanced ROI. Returns serialized form. */
export function extractFeatures(cv: any, mat: any): SerializedDescriptors | null {
  const orb = new cv.ORB(ORB_FEATURES);
  const kp = new cv.KeyPointVector();
  const desc = new cv.Mat();
  const empty = new cv.Mat();
  try {
    orb.detectAndCompute(mat, empty, kp, desc);
    if (desc.rows === 0) return null;
    const bytes = new Uint8Array(desc.data); // copy
    return {
      rows: desc.rows,
      cols: desc.cols,
      kp: kp.size(),
      b64: bytesToB64(bytes),
    };
  } finally {
    orb.delete();
    kp.delete();
    desc.delete();
    empty.delete();
  }
}

function toMat(cv: any, s: SerializedDescriptors): any {
  const bytes = b64ToBytes(s.b64);
  const mat = new cv.Mat(s.rows, s.cols, cv.CV_8U);
  mat.data.set(bytes);
  return mat;
}

export interface MatchScore {
  good: number;
  ratio: number; // good / min(kpA, kpB)
}

/** Compare two serialized descriptor sets → number of good (ratio-test) matches. */
export function matchDescriptors(
  cv: any,
  a: SerializedDescriptors,
  b: SerializedDescriptors
): MatchScore {
  if (!a || !b || a.rows < 2 || b.rows < 2) return { good: 0, ratio: 0 };
  const da = toMat(cv, a);
  const db = toMat(cv, b);
  const bf = new cv.BFMatcher(cv.NORM_HAMMING, false);
  const knn = new cv.DMatchVectorVector();
  let good = 0;
  try {
    bf.knnMatch(da, db, knn, 2);
    for (let i = 0; i < knn.size(); i++) {
      const m = knn.get(i);
      if (m.size() >= 2) {
        const d0 = m.get(0).distance;
        const d1 = m.get(1).distance;
        if (d0 < RATIO * d1) good++;
      }
    }
  } finally {
    da.delete();
    db.delete();
    bf.delete();
    knn.delete();
  }
  const ratio = good / Math.max(1, Math.min(a.kp, b.kp));
  return { good, ratio };
}

export interface EnrolledTemplate {
  id: string;
  name: string;
  samples: SerializedDescriptors[];
}

export interface IdentifyResult {
  matched: boolean;
  best: { id: string; name: string; good: number; ratio: number } | null;
  runnerUpGood: number;
  confidence: number; // 0..100
}

// Biometric decision thresholds (tuned for ORB on enhanced palm ROI).
const MIN_GOOD = 14; // absolute minimum good matches to accept
const MARGIN = 1.35; // best must beat runner-up by this factor

/** Identify a live probe against all enrolled templates (best-of samples). */
export function identify(
  cv: any,
  probe: SerializedDescriptors,
  enrolled: EnrolledTemplate[]
): IdentifyResult {
  const scored = enrolled.map((t) => {
    let best: MatchScore = { good: 0, ratio: 0 };
    for (const s of t.samples) {
      const sc = matchDescriptors(cv, probe, s);
      if (sc.good > best.good) best = sc;
    }
    return { id: t.id, name: t.name, ...best };
  });
  scored.sort((x, y) => y.good - x.good);

  const best = scored[0] ?? null;
  const runnerUpGood = scored[1]?.good ?? 0;

  const matched =
    !!best && best.good >= MIN_GOOD && best.good >= runnerUpGood * MARGIN;

  // Confidence blends absolute match strength and separation from runner-up.
  let confidence = 0;
  if (best) {
    const strength = Math.min(1, best.good / 60);
    const sep = best.good > 0 ? 1 - runnerUpGood / best.good : 0;
    confidence = Math.round((0.65 * strength + 0.35 * Math.max(0, sep)) * 100 * 10) / 10;
    if (matched) confidence = Math.max(confidence, 75 + Math.min(24, best.good / 5));
    confidence = Math.min(99.9, Math.round(confidence * 100) / 100);
  }

  return {
    matched,
    best: best ? { id: best.id, name: best.name, good: best.good, ratio: best.ratio } : null,
    runnerUpGood,
    confidence,
  };
}
