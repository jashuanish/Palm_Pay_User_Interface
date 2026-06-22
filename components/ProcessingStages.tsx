'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface Stage {
  key: string;
  label: string;
  detail: string;
  /** duration in ms */
  ms?: number;
}

interface ProcessingStagesProps {
  stages: Stage[];
  onComplete?: () => void;
  running: boolean;
  className?: string;
}

/** Sequentially activates each stage with a progress bar; calls onComplete when done. */
export function ProcessingStages({ stages, onComplete, running, className }: ProcessingStagesProps) {
  const [active, setActive] = useState(-1);
  const completed = useRef(false);

  useEffect(() => {
    if (!running) {
      setActive(-1);
      completed.current = false;
      return;
    }
    let cancelled = false;
    let idx = 0;
    const run = () => {
      if (cancelled) return;
      if (idx >= stages.length) {
        if (!completed.current) {
          completed.current = true;
          onComplete?.();
        }
        return;
      }
      setActive(idx);
      const ms = stages[idx].ms ?? 900;
      idx += 1;
      setTimeout(run, ms);
    };
    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div className={cn('space-y-2.5', className)}>
      {stages.map((s, i) => {
        const state = i < active ? 'done' : i === active ? 'active' : 'idle';
        return (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: state === 'idle' ? 0.4 : 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
              'relative overflow-hidden rounded-xl border p-3.5 transition-colors duration-500',
              state === 'active'
                ? 'border-primary/40 bg-primary/5'
                : state === 'done'
                  ? 'border-accent/25 bg-accent/[0.04]'
                  : 'border-white/8 bg-white/[0.02]'
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors',
                  state === 'done'
                    ? 'bg-accent/15 text-accent'
                    : state === 'active'
                      ? 'bg-primary/15 text-primary'
                      : 'bg-white/5 text-mist-400'
                )}
              >
                <AnimatePresence mode="wait">
                  {state === 'done' ? (
                    <motion.span key="d" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                      <Check className="h-4 w-4" />
                    </motion.span>
                  ) : state === 'active' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </AnimatePresence>
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-white">{s.label}</p>
                  <span className="font-mono text-[11px] text-mist-400">
                    {state === 'done' ? 'OK' : state === 'active' ? '···' : 'queued'}
                  </span>
                </div>
                <p className="truncate text-xs text-mist-300">{s.detail}</p>
              </div>
            </div>

            {state === 'active' && (
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary to-accent"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: (s.ms ?? 900) / 1000, ease: 'linear' }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
