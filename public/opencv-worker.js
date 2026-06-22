/*
 * PalmPay vision worker.
 * Runs the ENTIRE palm-vein pipeline + ORB matching off the main thread, so
 * loading/compiling the 11MB OpenCV.js WASM never freezes the UI.
 *
 * Pipeline is a faithful plain-JS port of palmpaymodel_training.ipynb
 * (Phases 2 & 3) — identical ops to lib/opencv/pipeline.ts.
 */
/* eslint-disable */
let cv = null;

// ---------- engine load (blocks ONLY this worker thread) ----------
function loadCv() {
  return new Promise((resolve, reject) => {
    try {
      self.importScripts('/vendor/opencv.js');
    } catch (e) {
      reject(e);
      return;
    }
    const isReady = () => self.cv && typeof self.cv.Mat === 'function';
    let done = false;
    const finish = () => { if (done) return; done = true; cv = self.cv; resolve(); };
    try {
      if (self.cv && typeof self.cv.then === 'function') {
        self.cv.then((m) => { if (m && typeof m.Mat === 'function') { self.cv = m; finish(); } });
      }
    } catch (e) {}
    let tries = 0;
    const poll = () => {
      if (done) return;
      if (isReady()) return finish();
      if (++tries > 8000) return reject(new Error('OpenCV worker init timeout'));
      setTimeout(poll, 25);
    };
    poll();
  });
}

// ---------- pipeline (ports lib/opencv/pipeline.ts op-for-op) ----------
const STD_W = 640, STD_H = 480, ROI_SIZE = 220, OUT = 224;

function rgbaBufferToGray(buf, w, h) {
  const rgba = new cv.Mat(h, w, cv.CV_8UC4);
  rgba.data.set(new Uint8Array(buf));
  const gray = new cv.Mat();
  cv.cvtColor(rgba, gray, cv.COLOR_RGBA2GRAY);
  rgba.delete();
  const std = new cv.Mat();
  cv.resize(gray, std, new cv.Size(STD_W, STD_H), 0, 0, cv.INTER_AREA);
  gray.delete();
  return std;
}

function segmentHand(gray) {
  const blur = new cv.Mat();
  cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
  const mask = new cv.Mat();
  cv.threshold(blur, mask, 20, 255, cv.THRESH_BINARY);
  blur.delete();
  const k = cv.Mat.ones(5, 5, cv.CV_8U);
  cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, k);
  k.delete();
  return mask;
}

function largestContour(mask) {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  let best = -1, bestArea = 0;
  for (let i = 0; i < contours.size(); i++) {
    const a = cv.contourArea(contours.get(i));
    if (a > bestArea) { bestArea = a; best = i; }
  }
  const c = best >= 0 ? contours.get(best).clone() : null;
  contours.delete();
  hierarchy.delete();
  return { contour: c, area: bestArea };
}

function palmCenter(contour) {
  const m = cv.moments(contour, false);
  if (m.m00 === 0) return { cx: STD_W / 2, cy: STD_H / 2 };
  return { cx: Math.round(m.m10 / m.m00), cy: Math.round(m.m01 / m.m00) };
}

function cropResize(gray, cx, cy) {
  const x1 = Math.max(cx - ROI_SIZE / 2, 0);
  const y1 = Math.max(cy - ROI_SIZE / 2, 0);
  const x2 = Math.min(cx + ROI_SIZE / 2, gray.cols);
  const y2 = Math.min(cy + ROI_SIZE / 2, gray.rows);
  const rect = new cv.Rect(x1, y1, Math.max(1, x2 - x1), Math.max(1, y2 - y1));
  const roi = gray.roi(rect);
  const out = new cv.Mat();
  cv.resize(roi, out, new cv.Size(OUT, OUT), 0, 0, cv.INTER_LINEAR);
  roi.delete();
  return out;
}

function extractRoi(gray) {
  const frameArea = gray.rows * gray.cols;
  const mask = segmentHand(gray);
  const { contour, area } = largestContour(mask);
  mask.delete();
  const coverage = area / frameArea;
  const usable = contour && coverage > 0.06 && coverage < 0.97;
  let cx = STD_W / 2, cy = STD_H / 2;
  if (usable) { const c = palmCenter(contour); cx = c.cx; cy = c.cy; }
  if (contour) contour.delete();
  return { mat: cropResize(gray, cx, cy), segmented: !!usable };
}

function denoise(s) { const d = new cv.Mat(); cv.medianBlur(s, d, 5); return d; }
function applyClahe(s) {
  const o = new cv.Mat();
  const cl = typeof cv.createCLAHE === 'function' ? cv.createCLAHE(3.0, new cv.Size(8, 8)) : new cv.CLAHE(3.0, new cv.Size(8, 8));
  cl.apply(s, o);
  if (cl.delete) cl.delete();
  return o;
}
function gaussianNorm(s) {
  const b = new cv.Mat();
  cv.GaussianBlur(s, b, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
  const o = new cv.Mat();
  cv.addWeighted(s, 1.5, b, -0.5, 0, o);
  b.delete();
  return o;
}
function normIntensity(s) { const o = new cv.Mat(); cv.normalize(s, o, 0, 255, cv.NORM_MINMAX, cv.CV_8U); return o; }
function gamma(s, g) {
  const lut = new cv.Mat(1, 256, cv.CV_8UC1);
  for (let i = 0; i < 256; i++) lut.data[i] = Math.min(255, Math.max(0, Math.floor(Math.pow(i / 255, g) * 255)));
  const o = new cv.Mat();
  cv.LUT(s, lut, o);
  lut.delete();
  return o;
}

function preprocess(gray) {
  const r = extractRoi(gray);
  const d = denoise(r.mat); r.mat.delete();
  const c = applyClahe(d); d.delete();
  const g = gaussianNorm(c); c.delete();
  const n = normIntensity(g); g.delete();
  const e = gamma(n, 1.5); n.delete();
  return { mat: e, segmented: r.segmented };
}

function grayBuffer(mat) {
  const n = mat.rows * mat.cols;
  const out = new Uint8Array(n);
  out.set(mat.data.subarray(0, n));
  return out.buffer;
}

// ---------- matcher (ports lib/opencv/matcher.ts) ----------
const ORB_FEATURES = 600, RATIO = 0.75, MIN_GOOD = 14, MARGIN = 1.35;

function b64FromBytes(bytes) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(bin);
}
function bytesFromB64(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function extractFeatures(mat) {
  const orb = new cv.ORB(ORB_FEATURES);
  const kp = new cv.KeyPointVector();
  const desc = new cv.Mat();
  const empty = new cv.Mat();
  try {
    orb.detectAndCompute(mat, empty, kp, desc);
    if (desc.rows === 0) return null;
    return { rows: desc.rows, cols: desc.cols, kp: kp.size(), b64: b64FromBytes(new Uint8Array(desc.data)) };
  } finally {
    orb.delete(); kp.delete(); desc.delete(); empty.delete();
  }
}

function toMat(s) {
  const m = new cv.Mat(s.rows, s.cols, cv.CV_8U);
  m.data.set(bytesFromB64(s.b64));
  return m;
}

function matchDescriptors(a, b) {
  if (!a || !b || a.rows < 2 || b.rows < 2) return { good: 0, ratio: 0 };
  const da = toMat(a), db = toMat(b);
  const bf = new cv.BFMatcher(cv.NORM_HAMMING, false);
  const knn = new cv.DMatchVectorVector();
  let good = 0;
  try {
    bf.knnMatch(da, db, knn, 2);
    for (let i = 0; i < knn.size(); i++) {
      const m = knn.get(i);
      if (m.size() >= 2 && m.get(0).distance < RATIO * m.get(1).distance) good++;
    }
  } finally {
    da.delete(); db.delete(); bf.delete(); knn.delete();
  }
  return { good, ratio: good / Math.max(1, Math.min(a.kp, b.kp)) };
}

function identify(probe, enrolled) {
  const scored = enrolled.map((t) => {
    let best = { good: 0, ratio: 0 };
    for (const s of t.samples) { const sc = matchDescriptors(probe, s); if (sc.good > best.good) best = sc; }
    return { id: t.id, name: t.name, good: best.good, ratio: best.ratio };
  });
  scored.sort((x, y) => y.good - x.good);
  const best = scored[0] || null;
  const runnerUpGood = scored[1] ? scored[1].good : 0;
  const matched = !!best && best.good >= MIN_GOOD && best.good >= runnerUpGood * MARGIN;
  let confidence = 0;
  if (best) {
    const strength = Math.min(1, best.good / 60);
    const sep = best.good > 0 ? 1 - runnerUpGood / best.good : 0;
    confidence = (0.65 * strength + 0.35 * Math.max(0, sep)) * 100;
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

// ---------- message handling ----------
self.onmessage = async (e) => {
  const { id, cmd } = e.data;
  const reply = (payload, transfer) => self.postMessage({ id, ok: true, ...payload }, transfer || []);
  const fail = (err) => self.postMessage({ id, ok: false, error: String((err && err.message) || err) });
  try {
    if (cmd === 'init') {
      if (!cv) await loadCv();
      return reply({ ready: true });
    }
    if (!cv) await loadCv();

    if (cmd === 'extract') {
      const gray = rgbaBufferToGray(e.data.buf, e.data.w, e.data.h);
      const res = preprocess(gray);
      gray.delete();
      const desc = extractFeatures(res.mat);
      const gbuf = grayBuffer(res.mat);
      res.mat.delete();
      return reply({ kp: desc ? desc.kp : 0, desc: desc, gray: gbuf, segmented: res.segmented }, [gbuf]);
    }
    if (cmd === 'identify') {
      return reply({ result: identify(e.data.probe, e.data.enrolled) });
    }
    fail('unknown cmd ' + cmd);
  } catch (err) {
    fail(err);
  }
};
