// Headless verification of the OpenCV.js API surface + ORB matching logic that
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
  ['Mat', 'MatVector', 'Size', 'Rect', 'ORB', 'BFMatcher', 'DMatchVectorVector',
   'KeyPointVector'].forEach((c) => need(`class cv.${c}`, typeof cv[c] !== 'undefined'));
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

  // ---- ORB + BFMatcher matching: same > different ----
  function descFrom(seed) {
    const m = new cv.Mat(224, 224, cv.CV_8UC1);
    cv.randu(m, new cv.Mat(1, 1, cv.CV_8UC1, new cv.Scalar(0)), new cv.Mat(1, 1, cv.CV_8UC1, new cv.Scalar(255)));
    // stamp deterministic structure so ORB finds repeatable corners
    let s = seed;
    const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    for (let i = 0; i < 80; i++) {
      const p1 = new cv.Point(rnd() * 224, rnd() * 224);
      const p2 = new cv.Point(rnd() * 224, rnd() * 224);
      cv.line(m, p1, p2, new cv.Scalar(Math.floor(rnd() * 255)), 1 + Math.floor(rnd() * 2));
    }
    return m;
  }
  function matchCount(d1, d2) {
    const bf = new cv.BFMatcher(cv.NORM_HAMMING, false);
    const knn = new cv.DMatchVectorVector();
    bf.knnMatch(d1, d2, knn, 2);
    let good = 0;
    for (let i = 0; i < knn.size(); i++) {
      const m = knn.get(i);
      if (m.size() >= 2 && m.get(0).distance < 0.75 * m.get(1).distance) good++;
    }
    bf.delete(); knn.delete();
    return good;
  }
  try {
    const orb = new cv.ORB(600);
    const empty = new cv.Mat();

    const imgA = descFrom(111);
    const imgA2 = imgA.clone(); // identical re-capture (upper bound)
    const imgB = descFrom(999);

    const kpA = new cv.KeyPointVector(); const dA = new cv.Mat();
    const kpA2 = new cv.KeyPointVector(); const dA2 = new cv.Mat();
    const kpB = new cv.KeyPointVector(); const dB = new cv.Mat();
    orb.detectAndCompute(imgA, empty, kpA, dA);
    orb.detectAndCompute(imgA2, empty, kpA2, dA2);
    orb.detectAndCompute(imgB, empty, kpB, dB);

    need('ORB found keypoints', kpA.size() > 10 && dA.rows > 10);
    log(`   kp: A=${kpA.size()} A2=${kpA2.size()} B=${kpB.size()}`);

    const same = matchCount(dA, dA2);
    const diff = matchCount(dA, dB);
    log(`   matches: SAME=${same}  DIFF=${diff}`);
    need('same-palm matches >> different-palm matches', same > diff && same >= 20);

    [orb, empty, imgA, imgA2, imgB, kpA, kpA2, kpB, dA, dA2, dB].forEach((m) => m.delete && m.delete());
  } catch (e) {
    need('ORB/BFMatcher (no throw)', false);
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
