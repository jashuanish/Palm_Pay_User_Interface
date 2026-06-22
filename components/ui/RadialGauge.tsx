'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

interface RadialGaugeProps {
  value: number;
  max?: number;
  size?: number;
  label?: string;
  suffix?: string;
  className?: string;
}

export function RadialGauge({
  value,
  max = 100,
  size = 140,
  label,
  suffix = '',
  className,
}: RadialGaugeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);

  return (
    <div ref={ref} className={cn('relative grid place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="50%" stopColor="#7B61FF" />
            <stop offset="100%" stopColor="#00FFA3" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#gaugeGrad)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={inView ? { strokeDashoffset: c * (1 - pct) } : {}}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.5))' }}
        />
      </svg>
      <div className="absolute text-center">
        <motion.div
          className="text-2xl font-black text-white"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
        >
          {value}
          {suffix}
        </motion.div>
        {label && <div className="text-[10px] uppercase tracking-wider text-mist-400">{label}</div>}
      </div>
    </div>
  );
}
