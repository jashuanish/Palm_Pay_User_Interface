'use client';

/**
 * Loads the self-hosted OpenCV.js WASM build (public/vendor/opencv.js) exactly
 * once and resolves when the runtime is ready. Using the real OpenCV C++ core
 * (compiled to WASM) means the in-browser pipeline produces the SAME results as
 * the Python notebook — cv2 and opencv.js share the same algorithms.
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

  // Already ready
  if (window.cv && window.cv.Mat) return Promise.resolve(window.cv);
  if (window.__opencvLoading) return window.__opencvLoading;

  window.__opencvLoading = new Promise<any>((resolve, reject) => {
    const ready = () => window.cv && typeof window.cv.Mat === 'function';

    const poll = (tries = 0) => {
      if (ready()) return resolve(window.cv);
      if (tries > 600) return reject(new Error('OpenCV.js failed to initialise (timeout)'));
      setTimeout(() => poll(tries + 1), 50);
    };

    const onScriptReady = () => {
      // Some builds expose `cv` as a promise (MODULARIZE), others as a Module
      // object that fires onRuntimeInitialized. Handle both, then poll.
      const maybe = window.cv as any;
      if (maybe && typeof maybe.then === 'function') {
        maybe.then((m: any) => {
          window.cv = m;
          poll();
        });
      } else {
        poll();
      }
    };

    const existing = document.getElementById('opencv-js') as HTMLScriptElement | null;
    if (existing) {
      if (ready()) resolve(window.cv);
      else existing.addEventListener('load', onScriptReady, { once: true });
      // also poll in case it already loaded
      poll();
      return;
    }

    const script = document.createElement('script');
    script.id = 'opencv-js';
    script.src = SRC;
    script.async = true;
    script.onload = onScriptReady;
    script.onerror = () => reject(new Error('Could not load /vendor/opencv.js'));
    document.body.appendChild(script);
  });

  return window.__opencvLoading;
}
