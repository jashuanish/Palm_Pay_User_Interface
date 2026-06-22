'use client';

/**
 * Loads the self-hosted OpenCV.js WASM build (public/vendor/opencv.js) exactly
 * once and resolves when the runtime is ready. Using the real OpenCV C++ core
 * (compiled to WASM) means the in-browser pipeline produces the SAME results as
 * the Python notebook — cv2 and opencv.js share the same algorithms.
 *
 * This build exposes `window.cv` as an Emscripten "thenable" whose `.Mat` (and
 * the rest of the bindings) appear IN PLACE once the runtime initialises. The
 * reliable readiness signal is therefore polling for `cv.Mat`, NOT waiting on
 * `.then()` — so we always poll regardless of the thenable.
 */
declare global {
  interface Window {
    cv: any;
    __opencvLoading?: Promise<any>;
  }
}

const SRC = '/vendor/opencv.js';

export function loadOpenCV(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.cv && typeof window.cv.Mat === 'function') return Promise.resolve(window.cv);
  if (window.__opencvLoading) return window.__opencvLoading;

  window.__opencvLoading = new Promise<any>((resolve, reject) => {
    const ready = () => window.cv && typeof window.cv.Mat === 'function';

    let tries = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      resolve(window.cv);
    };
    // Poll for cv.Mat — the reliable readiness signal. Runs INDEPENDENTLY of the
    // script's onload (the WASM may compile after onload, or onload may be late).
    const poll = () => {
      if (done) return;
      if (ready()) return finish();
      if (++tries > 2400) return reject(new Error('OpenCV.js initialisation timed out')); // ~2min
      setTimeout(poll, 50);
    };

    // If this build hands back a thenable that resolves to the module, capture
    // it too — belt & suspenders. Never gate readiness on this.
    const captureThenable = () => {
      try {
        const maybe = window.cv as any;
        if (maybe && typeof maybe.then === 'function') {
          maybe.then((m: any) => {
            if (m && typeof m.Mat === 'function') {
              window.cv = m;
              finish();
            }
          }).catch(() => {});
        }
      } catch {
        /* polling is the source of truth */
      }
    };

    const existing = document.getElementById('opencv-js') as HTMLScriptElement | null;
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'opencv-js';
      script.src = SRC;
      script.async = true;
      script.onload = captureThenable;
      script.onerror = () => !done && reject(new Error('Could not load /vendor/opencv.js'));
      document.body.appendChild(script);
    } else {
      existing.addEventListener('load', captureThenable, { once: true });
      captureThenable();
    }

    poll(); // start polling now, regardless of onload timing
  });

  return window.__opencvLoading;
}
