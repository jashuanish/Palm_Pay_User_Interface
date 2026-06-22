'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { mulberry32 } from '@/lib/utils';

interface AnimatedBackgroundProps {
  particles?: number;
  showLines?: boolean;
  seed?: number;
}

/**
 * The signature PalmPay backdrop: drifting aurora blooms, a faint masked grid,
 * floating particles, and "transaction lines" streaking across the canvas.
 * All deterministic (seeded) so SSR and client hydration match exactly.
 */
export function AnimatedBackground({
  particles = 34,
  showLines = true,
  seed = 7,
}: AnimatedBackgroundProps) {
  const dots = useMemo(() => {
    const rng = mulberry32(seed * 911);
    return Array.from({ length: particles }, () => ({
      x: rng() * 100,
      y: rng() * 100,
      size: 1 + rng() * 2.5,
      delay: rng() * 6,
      dur: 6 + rng() * 10,
      drift: -20 - rng() * 60,
      hue: rng() > 0.5 ? '#00E5FF' : rng() > 0.5 ? '#7B61FF' : '#00FFA3',
      op: 0.25 + rng() * 0.5,
    }));
  }, [particles, seed]);

  const lines = useMemo(() => {
    const rng = mulberry32(seed * 1303);
    return Array.from({ length: 7 }, () => ({
      top: 8 + rng() * 84,
      delay: rng() * 8,
      dur: 7 + rng() * 7,
      w: 80 + rng() * 180,
    }));
  }, [seed]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* base */}
      <div className="absolute inset-0 bg-ink-900" />

      {/* aurora blooms */}
      <div className="absolute inset-0 bg-aurora animate-aurora-shift" />
      <div
        className="absolute inset-0 bg-aurora animate-aurora-shift opacity-60"
        style={{ animationDelay: '-9s', animationDirection: 'reverse' }}
      />

      {/* faint grid with radial fade */}
      <div
        className="absolute inset-0 bg-grid-faint [background-size:54px_54px]"
        style={{
          maskImage:
            'radial-gradient(ellipse 90% 70% at 50% 30%, #000 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 70% at 50% 30%, #000 30%, transparent 75%)',
        }}
      />

      {/* particles */}
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            background: d.hue,
            boxShadow: `0 0 ${d.size * 4}px ${d.hue}`,
          }}
          animate={{ y: [0, d.drift, 0], opacity: [0, d.op, 0] }}
          transition={{
            duration: d.dur,
            delay: d.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* streaking transaction lines */}
      {showLines &&
        lines.map((l, i) => (
          <motion.div
            key={`l-${i}`}
            className="absolute h-px"
            style={{
              top: `${l.top}%`,
              width: l.w,
              background:
                'linear-gradient(90deg, transparent, #00E5FF, transparent)',
            }}
            initial={{ x: '-20vw', opacity: 0 }}
            animate={{ x: '120vw', opacity: [0, 0.9, 0] }}
            transition={{
              duration: l.dur,
              delay: l.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}

      {/* vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,7,10,0.7)_100%)]" />
    </div>
  );
}
