'use client';

/**
 * Faithful port of the PalmPay notebook image-processing pipeline
 * (palmpaymodel_training.ipynb · Phases 2 & 3) to OpenCV.js.
 *
 * Python  ->  this file (op-for-op):
 *   segment_hand        -> segmentHand        (GaussianBlur 5x5 -> threshold 20 -> MORPH_CLOSE 5x5)
 *   get_largest_contour -> getLargestContour  (RETR_EXTERNAL, max contourArea)
 *   get_palm_center     -> getPalmCenter      (moments centroid)
 *   extract_palm_roi    -> extractPalmRoi      (220px crop around centre -> resize 224)
 *   denoise_image       -> denoise            (medianBlur 5)
 *   apply_clahe         -> applyClahe         (CLAHE clip=3.0, tiles 8x8)
 *   gaussian_normalization -> gaussianNormalize (addWeighted 1.5/-0.5 unsharp)
 *   normalize_image     -> normalizeIntensity (NORM_MINMAX 0..255)
 *   gamma_correction    -> gammaCorrect       (gamma 1.5)
 *   preprocess_image    -> preprocess         (the full chain)
 */

export interface RoiResult {
  /** Final enhanced 224x224 grayscale Mat — caller MUST delete() it. */
  mat: any;
  /** True if hand segmentation succeeded; false if a centre-crop fallback was used. */
  segmented: boolean;
  /** Detected palm centre (in the standardised 640x480 frame). */
  center: { x: number; y: number };
  /** Fraction of the frame covered by the detected hand contour. */
  coverage: number;
}

const STD_W = 640;
const STD_H = 480;
const ROI_SIZE = 220;
const OUT = 224;

/** Read a canvas/video-frame canvas into a standardised 640x480 grayscale Mat. */
export function canvasToGray(cv: any, source: HTMLCanvasElement): any {
  const rgba = cv.imread(source); // CV_8UC4
  const gray = new cv.Mat();
  cv.cvtColor(rgba, gray, cv.COLOR_RGBA2GRAY);
  rgba.delete();
  const std = new cv.Mat();
  cv.resize(gray, std, new cv.Size(STD_W, STD_H), 0, 0, cv.INTER_AREA);
  gray.delete();
  return std; // caller deletes
}

// ---- segment_hand ----
function segmentHand(cv: any, gray: any): any {
  const blur = new cv.Mat();
  cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
  const mask = new cv.Mat();
  cv.threshold(blur, mask, 20, 255, cv.THRESH_BINARY);
  blur.delete();
  const kernel = cv.Mat.ones(5, 5, cv.CV_8U);
  cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel);
  kernel.delete();
  return mask;
}

// ---- get_largest_contour ----
function getLargestContour(cv: any, mask: any): { contour: any | null; area: number } {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  let best = -1;
  let bestArea = 0;
  for (let i = 0; i < contours.size(); i++) {
    const a = cv.contourArea(contours.get(i));
    if (a > bestArea) {
      bestArea = a;
      best = i;
    }
  }
  const contour = best >= 0 ? contours.get(best).clone() : null;
  contours.delete();
  hierarchy.delete();
  return { contour, area: bestArea };
}

// ---- get_palm_center ----
function getPalmCenter(cv: any, contour: any): { cx: number; cy: number } {
  const m = cv.moments(contour, false);
  if (m.m00 === 0) return { cx: STD_W / 2, cy: STD_H / 2 };
  return { cx: Math.round(m.m10 / m.m00), cy: Math.round(m.m01 / m.m00) };
}

function cropResize(cv: any, gray: any, cx: number, cy: number): any {
  const x1 = Math.max(cx - ROI_SIZE / 2, 0);
  const y1 = Math.max(cy - ROI_SIZE / 2, 0);
  const x2 = Math.min(cx + ROI_SIZE / 2, gray.cols);
  const y2 = Math.min(cy + ROI_SIZE / 2, gray.rows);
  const rect = new cv.Rect(x1, y1, Math.max(1, x2 - x1), Math.max(1, y2 - y1));
  const roi = gray.roi(rect);
  const out = new cv.Mat();
  // notebook uses cv2.resize(...,(224,224)) with its default (INTER_LINEAR)
  cv.resize(roi, out, new cv.Size(OUT, OUT), 0, 0, cv.INTER_LINEAR);
  roi.delete();
  return out;
}

// ---- extract_palm_roi (with webcam-friendly fallback) ----
export function extractPalmRoi(cv: any, gray: any): RoiResult {
  const frameArea = gray.rows * gray.cols;
  const mask = segmentHand(cv, gray);
  const { contour, area } = getLargestContour(cv, mask);
  mask.delete();

  const coverage = area / frameArea;
  // Threshold(20) assumes a dark background. With an arbitrary webcam background
  // segmentation can grab almost-nothing or the whole frame — fall back to a
  // centred crop so the ROI stays consistent and matchable.
  const usable = contour && coverage > 0.06 && coverage < 0.97;

  let center = { x: STD_W / 2, y: STD_H / 2 };
  if (usable) {
    const { cx, cy } = getPalmCenter(cv, contour);
    center = { x: cx, y: cy };
  }
  if (contour) contour.delete();

  const mat = cropResize(cv, gray, center.x, center.y);
  return { mat, segmented: !!usable, center, coverage };
}

// ---- Phase 3 enhancement steps ----
function denoise(cv: any, src: any): any {
  const d = new cv.Mat();
  cv.medianBlur(src, d, 5);
  return d;
}

function applyClahe(cv: any, src: any): any {
  const out = new cv.Mat();
  const clahe =
    typeof cv.createCLAHE === 'function'
      ? cv.createCLAHE(3.0, new cv.Size(8, 8))
      : new cv.CLAHE(3.0, new cv.Size(8, 8));
  clahe.apply(src, out);
  if (clahe.delete) clahe.delete();
  return out;
}

function gaussianNormalize(cv: any, src: any): any {
  const blur = new cv.Mat();
  cv.GaussianBlur(src, blur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
  const out = new cv.Mat();
  cv.addWeighted(src, 1.5, blur, -0.5, 0, out);
  blur.delete();
  return out;
}

function normalizeIntensity(cv: any, src: any): any {
  const out = new cv.Mat();
  cv.normalize(src, out, 0, 255, cv.NORM_MINMAX, cv.CV_8U);
  return out;
}

function gammaCorrect(cv: any, src: any, gamma = 1.5): any {
  // LUT: ((i/255)^gamma)*255  — matches the notebook's np.power implementation.
  const lut = new cv.Mat(1, 256, cv.CV_8UC1);
  for (let i = 0; i < 256; i++) {
    // notebook: (np.power(i/255, gamma) * 255).astype(np.uint8) — numpy truncates
    lut.data[i] = Math.min(255, Math.max(0, Math.floor(Math.pow(i / 255, gamma) * 255)));
  }
  const out = new cv.Mat();
  cv.LUT(src, lut, out);
  lut.delete();
  return out;
}

// ---- preprocess_image (the full chain) ----
export function preprocess(cv: any, gray: any): RoiResult {
  const roiRes = extractPalmRoi(cv, gray);
  const roi = roiRes.mat;
  const d = denoise(cv, roi);
  roi.delete();
  const c = applyClahe(cv, d);
  d.delete();
  const g = gaussianNormalize(cv, c);
  c.delete();
  const n = normalizeIntensity(cv, g);
  g.delete();
  const enhanced = gammaCorrect(cv, n, 1.5);
  n.delete();
  return { ...roiRes, mat: enhanced };
}

/** Render a grayscale Mat to a data URL (for previews). */
export function matToDataURL(cv: any, mat: any): string {
  const canvas = document.createElement('canvas');
  canvas.width = mat.cols;
  canvas.height = mat.rows;
  cv.imshow(canvas, mat);
  return canvas.toDataURL('image/png');
}

/** Quick frame-quality probe for the live readiness meter (brightness + detail). */
export function probeFrame(cv: any, gray: any): { brightness: number; detail: number } {
  const mean = new cv.Mat();
  const stddev = new cv.Mat();
  cv.meanStdDev(gray, mean, stddev);
  const brightness = mean.doubleAt(0, 0);
  const detail = stddev.doubleAt(0, 0);
  mean.delete();
  stddev.delete();
  return { brightness, detail };
}
