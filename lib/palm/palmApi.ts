'use client';

/**
 * PalmPay biometric client — talks directly to the FastAPI model server
 * (proxied at /api/ml/* by next.config.js). All heavy work runs on the GPU
 * backend; the browser just sends a palm crop and gets back an embedding,
 * a print/vein classification, and the preprocessed identity-pattern image.
 *
 * No OpenCV WASM, no web worker — a single async fetch keeps the UI snappy.
 */

export interface PalmAnalysis {
  embedding: number[]; // 128-d L2-normalised
  dim: number;
  imageType: 'print' | 'vein';
  secure: boolean; // true only for internal vein scans
  pattern: string; // data-URL PNG — final enhanced identity pattern
  roi: string; // data-URL PNG — cropped palm ROI (pre-enhancement)
}

export interface MlStatus {
  online: boolean;
  modelLoaded: boolean;
  device?: string;
  valAcc?: number;
  testAcc?: number;
}

const EMBED_URL = '/api/ml/embed';
const STATUS_URL = '/api/ml/status';

/** Check whether the trained model backend is reachable + loaded. */
export async function getMlStatus(): Promise<MlStatus> {
  try {
    const r = await fetch(STATUS_URL, { signal: AbortSignal.timeout(4000) });
    if (!r.ok) return { online: false, modelLoaded: false };
    const d = await r.json();
    return {
      online: true,
      modelLoaded: !!d.model_loaded || !!d.model_exists,
      device: d.device,
      valAcc: d.val_acc,
      testAcc: d.test_acc,
    };
  } catch {
    return { online: false, modelLoaded: false };
  }
}

/** Analyse a palm-crop canvas → embedding + print/vein + identity pattern. */
export async function analyzePalm(canvas: HTMLCanvasElement): Promise<PalmAnalysis> {
  const dataUrl = canvas.toDataURL('image/png');
  const r = await fetch(EMBED_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: dataUrl }),
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`Model backend error ${r.status}: ${text.slice(0, 120)}`);
  }
  const d = await r.json();
  return {
    embedding: d.embedding,
    dim: d.dim,
    imageType: d.image_type,
    secure: d.secure,
    pattern: d.pattern,
    roi: d.roi,
  };
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export interface EnrolledTemplate {
  id: string;
  name: string;
  embeddings: number[][]; // one per enrolled sample
}

export interface IdentifyResult {
  matched: boolean;
  best: { id: string; name: string; similarity: number } | null;
  runnerUp: number;
  confidence: number; // 0..100
}

// Decision thresholds — tuned for same-camera webcam palm prints through the
// trained MobileNetV2 (dataset same-subject ≈0.85, different ≈0.55).
export const MATCH_THRESHOLD = 0.62;
const MARGIN = 0.04;

/** Match a probe embedding against all enrolled templates (best-of samples). */
export function identify(probe: number[], enrolled: EnrolledTemplate[]): IdentifyResult {
  const scored = enrolled.map((t) => {
    let best = -1;
    for (const e of t.embeddings) {
      const s = cosineSimilarity(probe, e);
      if (s > best) best = s;
    }
    return { id: t.id, name: t.name, similarity: best };
  });
  scored.sort((x, y) => y.similarity - x.similarity);

  const best = scored[0] ?? null;
  const runnerUp = scored[1]?.similarity ?? -1;
  const matched =
    !!best && best.similarity >= MATCH_THRESHOLD && best.similarity - runnerUp >= MARGIN;

  let confidence = 0;
  if (best) {
    // Map similarity 0.5→1.0 onto 0→100, then bump confirmed matches up.
    const strength = Math.max(0, (best.similarity - 0.5) / 0.5);
    confidence = Math.round(strength * 100 * 10) / 10;
    if (matched) {
      confidence = Math.max(confidence, 85 + Math.min(14.9, (best.similarity - MATCH_THRESHOLD) * 100));
    }
    confidence = Math.min(99.9, Math.round(confidence * 100) / 100);
  }
  return {
    matched,
    best: best ? { id: best.id, name: best.name, similarity: best.similarity } : null,
    runnerUp,
    confidence,
  };
}
