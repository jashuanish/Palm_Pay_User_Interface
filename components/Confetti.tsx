'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

const COLORS = ['#00E5FF', '#7B61FF', '#00FFA3', '#FFB020', '#ffffff'];

/** A radial burst of energy particles. Renders client-side only (post-interaction). */
export function Confetti({ count = 80 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 120 + Math.random() * 320;
        return {
          x: Math.cos(angle) * dist,
          y: Math.sin(angle) * dist,
          size: 4 + Math.random() * 8,
          color: COLORS[i % COLORS.length],
          delay: Math.random() * 0.15,
          dur: 0.9 + Math.random() * 0.9,
          rot: Math.random() * 360,
          round: Math.random() > 0.5,
        };
      }),
    [count]
  );

  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center overflow-visible">
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute"
          style={{
            width: b.size,
            height: b.size,
            background: b.color,
            borderRadius: b.round ? '999px' : '2px',
            boxShadow: `0 0 ${b.size}px ${b.color}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{ x: b.x, y: b.y, opacity: 0, scale: 0.3, rotate: b.rot }}
          transition={{ duration: b.dur, delay: b.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </div>
  );
}
