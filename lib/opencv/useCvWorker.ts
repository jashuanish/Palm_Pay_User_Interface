'use client';

import { useCallback, useRef, useState } from 'react';
import { initCv } from './cvClient';

interface State {
  ready: boolean;
  loading: boolean;
  error: string | null;
  load: () => void;
}

/**
 * Loads the OpenCV vision worker on demand. The worker compiles the WASM off
 * the main thread, so calling load() never freezes the UI.
 */
export function useCvWorker(): State {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const load = useCallback(() => {
    if (started.current) return;
    started.current = true;
    setLoading(true);
    initCv()
      .then(() => {
        setReady(true);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.message ?? 'engine failed to load');
        setLoading(false);
      });
  }, []);

  return { ready, loading, error, load };
}
