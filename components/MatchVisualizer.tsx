'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { mulberry32 } from '@/lib/utils';
import { Counter } from '@/components/ui/Counter';
import { NeuralNet } from '@/components/NeuralNet';

interface MatchVisualizerProps {
  uploaded: string | 'sample' | null;
  matchedName: string;
  confidence: number;
}

function PalmThumb({ src, points, label }: { src: string | 'sample' | null; points: { x: number; y: number }[]; label: string }) {
  return (
    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/10 bg-ink-700">
      {src === 'sample' || !src ? (
        <div className="absolute inset-0 bg-gradient-to-br from-ink-600 to-ink-800">
          <svg viewBox="0 0 100 130" className="h-full w-full opacity-60" fill="none">
            <path d="M35,120 C30,90 42,74 50,74 C58,74 70,90 65,120 Z M31,72 c-1-24 0-34 4-34 s4,10 4,34 M44,71 c-1-30 0-42 5-42 s5,12 5,42 M57,72 c0-28 1-38 5-38 s5,10 4,38 M68,78 c2-20 4-28 7-27 s4,10 1,27"
              fill="rgba(0,229,255,0.07)" stroke="rgba(155,167,189,0.4)" strokeWidth="0.8" />
          </svg>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-full w-full object-cover" />
      )}
      <div className="absolute inset-0 bg-ink-900/30" />
      {/* feature points */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        {points.map((p, i) => (
          <motion.circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="1.4"
            fill="#00FFA3"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            style={{ filter: 'drop-shadow(0 0 2px #00FFA3)' }}
          />
        ))}
      </svg>
      <span className="absolute bottom-2 left-2 rounded-md bg-ink-900/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-mist-100 backdrop-blur">
        {label}
      </span>
    </div>
  );
}

export function MatchVisualizer({ uploaded, matchedName, confidence }: MatchVisualizerProps) {
  const points = useMemo(() => {
    const rng = mulberry32(42);
    return Array.from({ length: 9 }, () => ({ x: 22 + rng() * 56, y: 18 + rng() * 64 }));
  }, []);
  // matched palm points = slightly perturbed (same identity)
  const matchedPoints = useMemo(
    () => points.map((p) => ({ x: p.x + (Math.sin(p.x) * 2), y: p.y + (Math.cos(p.y) * 2) })),
    [points]
  );

  return (
    <div className="rounded-2xl glass p-5 shadow-glass sm:p-6">
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_1.2fr_1fr]">
        {/* LEFT */}
        <div>
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-mist-400">
            Uploaded Palm
          </p>
          <PalmThumb src={uploaded} points={points} label="QUERY" />
        </div>

        {/* CENTER */}
        <div className="relative">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-primary">
            Neural Match Engine
          </p>
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-ink-700/60 p-2">
            <NeuralNet layers={[4, 6, 6, 4]} height={180} />
            {/* correspondence flow */}
            <div className="pointer-events-none absolute inset-0">
              {[0, 1, 2, 3].map((i) => (
                <motion.span
                  key={i}
                  className="absolute h-px w-full bg-gradient-to-r from-accent/0 via-accent to-accent/0"
                  style={{ top: `${28 + i * 16}%` }}
                  animate={{ opacity: [0, 1, 0], x: ['-30%', '30%'] }}
                  transition={{ duration: 1.8, delay: i * 0.3, repeat: Infinity }}
                />
              ))}
            </div>
          </div>
          <div className="mt-2 text-center font-mono text-[11px] text-accent">
            512-dim · cosine ANN search
          </div>
        </div>

        {/* RIGHT */}
        <div>
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-mist-400">
            Matched · Vault
          </p>
          <PalmThumb src="sample" points={matchedPoints} label={matchedName.split(' ')[0]} />
        </div>
      </div>

      {/* metrics */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <Metric label="Feature Similarity" value={<><Counter to={97.4} decimals={1} />%</>} tone="text-primary" />
        <Metric label="Embedding Distance" value={<>0.0<Counter to={31} /></>} tone="text-secondary" />
        <Metric label="Match Confidence" value={<><Counter to={confidence} decimals={2} />%</>} tone="text-accent" />
      </div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: React.ReactNode; tone: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3 text-center">
      <div className={`text-xl font-bold ${tone}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-mist-400">{label}</div>
    </div>
  );
}
