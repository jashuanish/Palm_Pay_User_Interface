// Headless verification of the OpenCV.js API surface + embedding matching logic that
// lib/opencv/pipeline.ts and lib/opencv/matcher.ts depend on. Run with: node scripts/cvtest.cjs
const path = require('path');
const cvModule = require(path.join(__dirname, '..', 'public', 'vendor', 'opencv.js'));

function ready(cv) {
  return cv && typeof cv.Mat === 'function';
}

function run(cv) {
  const log = (...a) => console.log(...a);
  let pass = true;
  const need = (name, ok) => { log(`${ok ? 'OK ' : 'FAIL'}  ${name}`); if (!ok) pass = false; };

  // ---- API surface ----
  ['imread', 'cvtColor', 'GaussianBlur', 'threshold', 'morphologyEx', 'findContours',
   'contourArea', 'moments', 'medianBlur', 'addWeighted', 'normalize', 'LUT', 'resize',
   'meanStdDev'].forEach((f) => need(`fn cv.${f}`, typeof cv[f] === 'function'));
  ['Mat', 'MatVector', 'Size', 'Rect'].forEach((c) => need(`class cv.${c}`, typeof cv[c] !== 'undefined'));
  need('createCLAHE or CLAHE', typeof cv.createCLAHE === 'function' || typeof cv.CLAHE !== 'undefined');

  // ---- exercise the enhancement chain on a synthetic gray image ----
  try {
    const g = new cv.Mat(480, 640, cv.CV_8UC1);
    cv.randu(g, new cv.Mat(1, 1, cv.CV_8UC1, new cv.Scalar(0)), new cv.Mat(1, 1, cv.CV_8UC1, new cv.Scalar(255)));

    const blur = new cv.Mat();
    cv.GaussianBlur(g, blur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    const mask = new cv.Mat();
    cv.threshold(blur, mask, 20, 255, cv.THRESH_BINARY);
    const kernel = cv.Mat.ones(5, 5, cv.CV_8U);
    cv.morphologyEx(mask, mask, cv.MORPH_CLOSE, kernel);
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(mask, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    need('findContours produced contours', contours.size() >= 1);
    if (contours.size() > 0) { cv.contourArea(contours.get(0)); cv.moments(contours.get(0), false); }

    // CLAHE
    const clahe = typeof cv.createCLAHE === 'function'
      ? cv.createCLAHE(3.0, new cv.Size(8, 8)) : new cv.CLAHE(3.0, new cv.Size(8, 8));
    const cl = new cv.Mat();
    clahe.apply(g, cl);
    need('CLAHE.apply ran', cl.rows === 480);

    // unsharp + normalize + LUT(gamma)
    const un = new cv.Mat();
    cv.addWeighted(cl, 1.5, blur, -0.5, 0, un);
    const nm = new cv.Mat();
    cv.normalize(un, nm, 0, 255, cv.NORM_MINMAX, cv.CV_8U);
    const lut = new cv.Mat(1, 256, cv.CV_8UC1);
    for (let i = 0; i < 256; i++) lut.data[i] = Math.round(Math.pow(i / 255, 1.5) * 255);
    const gm = new cv.Mat();
    cv.LUT(nm, lut, gm);
    need('gamma LUT ran', gm.rows === 480);

    [g, blur, mask, kernel, contours, hierarchy, cl, un, nm, lut, gm].forEach((m) => m.delete && m.delete());
    if (clahe.delete) clahe.delete();
  } catch (e) {
    need('enhancement chain (no throw)', false);
    console.log('   chain error:', e && e.message);
  }

  // ---- cosine embedding matcher: same > different ----
  function embedding(seed, jitter = 0) {
    let s = seed;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    return Array.from({ length: 128 }, () => rnd() + jitter * (rnd() - 0.5));
  }
  function cosineSimilarity(a, b) {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  function identify(probe, enrolled) {
    const scored = enrolled.map((t) => ({
      id: t.id,
      similarity: Math.max(...t.samples.map((sample) => cosineSimilarity(probe.embedding, sample.embedding))),
    })).sort((a, b) => b.similarity - a.similarity);
    const best = scored[0];
    const runnerUp = scored[1] ? scored[1].similarity : -1;
    return { matched: best.similarity >= 0.85 && best.similarity - runnerUp >= 0.05, best, runnerUp };
  }
  try {
    const probe = { embedding: embedding(111, 0.01) };
    const enrolled = [
      { id: 'same', samples: [{ embedding: embedding(111) }] },
      { id: 'different', samples: [{ embedding: embedding(999) }] },
    ];
    const same = cosineSimilarity(probe.embedding, enrolled[0].samples[0].embedding);
    const diff = cosineSimilarity(probe.embedding, enrolled[1].samples[0].embedding);
    const result = identify(probe, enrolled);
    log(`   similarity: SAME=${same.toFixed(4)}  DIFF=${diff.toFixed(4)}`);
    need('same-palm embedding beats different-palm embedding', same > diff && result.best.id === 'same');
    need('embedding matcher grants clear winner', result.matched);
  } catch (e) {
    need('embedding matcher (no throw)', false);
    console.log('   match error:', e && e.message);
  }

  console.log('\n==== ' + (pass ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED') + ' ====');
  process.exit(pass ? 0 : 1);
}

// opencv.js may expose `cv` as a promise (MODULARIZE) or an object that fires
// onRuntimeInitialized. Poll for readiness.
(function wait(tries = 0) {
  const cv = cvModule && typeof cvModule.then === 'function' ? null : cvModule;
  if (cv && ready(cv)) return run(cv);
  if (cvModule && typeof cvModule.then === 'function') {
    cvModule.then((m) => run(m));
    return;
  }
  if (tries > 400) { console.log('TIMEOUT waiting for OpenCV runtime'); process.exit(2); }
  setTimeout(() => wait(tries + 1), 50);
})();
