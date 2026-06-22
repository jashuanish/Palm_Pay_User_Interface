'use client';

import { useCallback, useRef, useState } from 'react';
import { loadOpenCV } from './loader';

interface OpenCVState {
  cv: any | null;
  ready: boolean;
  loading: boolean;
  error: string | null;
  /** Begin loading OpenCV.js (~11MB WASM). Safe to call repeatedly. */
  load: () => void;
}

/**
 * Lazily loads OpenCV.js. We DON'T fetch 11MB on mount — call `load()` when the
 * user actually opts into the live biometric flow (e.g. when the camera starts),
 * so the page stays instant for everyone else.
 */
export function useOpenCV(): OpenCVState {
  const [cv, setCv] = useState<any | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const load = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setLoading(true);
    loadOpenCV()
      .then((c) => {
        setCv(c);
        setReady(true);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.message ?? 'load failed');
        setLoading(false);
      });
  }, []);

  return { cv, ready, loading, error, load };
}
