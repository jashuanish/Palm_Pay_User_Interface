'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PalmMeshProps {
  className?: string;
  /** Run the biometric scan sweep + node pulses */
  scanning?: boolean;
  size?: number;
}

// Vein paths drawn from wrist up to each fingertip.
const VEINS = [
  'M180,418 C176,372 176,338 180,306',
  'M180,306 C168,260 152,176 149,92',
  'M180,306 C184,250 186,150 188,72',
  'M180,306 C200,252 216,168 222,96',
  'M180,306 C214,262 244,208 250,134',
  'M180,310 C150,300 120,278 96,240',
  // secondary capillaries
  'M165,250 C150,238 140,210 138,170',
  'M205,250 C222,236 232,212 236,176',
  'M180,360 C160,352 142,338 132,318',
  'M180,360 C202,352 222,336 232,316',
];

// Glowing junction nodes (fingertips + palm hub)
const NODES = [
  { x: 149, y: 92 },
  { x: 188, y: 72 },
  { x: 222, y: 96 },
  { x: 250, y: 134 },
  { x: 96, y: 240 },
  { x: 180, y: 306 },
  { x: 138, y: 170 },
  { x: 236, y: 176 },
];

export function PalmMesh({ className, scanning = true, size = 440 }: PalmMeshProps) {
  return (
    <div className={cn('relative', className)} style={{ width: size, height: size * 1.18 }}>
      {/* ambient glow behind palm */}
      <div className="absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />

      <svg
        viewBox="0 0 360 440"
        className="relative h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="palmFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.10" />
            <stop offset="55%" stopColor="#7B61FF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#00FFA3" stopOpacity="0.06" />
          </linearGradient>
          <linearGradient id="veinStroke" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#00FFA3" />
            <stop offset="50%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#7B61FF" />
          </linearGradient>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="40%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </radialGradient>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        {/* ---- Hand silhouette (stylized) ---- */}
        <g stroke="url(#veinStroke)" strokeOpacity="0.55" strokeWidth="1.4" fill="url(#palmFill)">
          {/* palm */}
          <path d="M120,300 C112,250 128,224 180,222 C232,224 248,250 240,300 C236,352 228,392 180,404 C132,392 124,352 120,300 Z" />
          {/* index */}
          <rect x="138" y="78" width="26" height="170" rx="13" transform="rotate(-4 151 160)" />
          {/* middle */}
          <rect x="176" y="58" width="26" height="190" rx="13" transform="rotate(-1 189 150)" />
          {/* ring */}
          <rect x="210" y="80" width="26" height="178" rx="13" transform="rotate(4 223 168)" />
          {/* pinky */}
          <rect x="240" y="120" width="23" height="142" rx="11" transform="rotate(11 251 190)" />
          {/* thumb */}
          <rect x="78" y="214" width="24" height="120" rx="12" transform="rotate(-48 108 274)" />
        </g>

        {/* ---- Veins (draw-in) ---- */}
        {VEINS.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            stroke="url(#veinStroke)"
            strokeWidth={i < 6 ? 2 : 1.2}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: i < 6 ? 0.95 : 0.6 }}
            transition={{
              duration: 1.8,
              delay: 0.3 + i * 0.12,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        ))}

        {/* vein glow underlay */}
        {VEINS.slice(0, 6).map((d, i) => (
          <motion.path
            key={`g-${i}`}
            d={d}
            stroke="#00E5FF"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#soft)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.25 }}
            transition={{ duration: 1.8, delay: 0.3 + i * 0.12 }}
          />
        ))}

        {/* ---- Pulsing nodes ---- */}
        {NODES.map((n, i) => (
          <g key={`n-${i}`}>
            <motion.circle
              cx={n.x}
              cy={n.y}
              r="10"
              fill="url(#nodeGlow)"
              initial={{ opacity: 0, scale: 0 }}
              animate={
                scanning
                  ? { opacity: [0.2, 0.7, 0.2], scale: [0.8, 1.3, 0.8] }
                  : { opacity: 0.5, scale: 1 }
              }
              transition={{ duration: 2.4, delay: i * 0.2, repeat: Infinity }}
            />
            <motion.circle
              cx={n.x}
              cy={n.y}
              r="2.6"
              fill="#fff"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 + i * 0.1 }}
            />
          </g>
        ))}

        {/* ---- Scan sweep ---- */}
        {scanning && (
          <motion.g
            initial={{ y: 0 }}
            animate={{ y: [40, 380, 40] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="70" y="0" width="220" height="2.5" fill="#00FFA3" opacity="0.9" />
            <rect x="70" y="-26" width="220" height="26" fill="url(#scanGrad)" opacity="0.35" />
          </motion.g>
        )}
        <defs>
          <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00FFA3" stopOpacity="0" />
            <stop offset="100%" stopColor="#00FFA3" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>

      {/* pulse rings at base */}
      {scanning && (
        <div className="absolute bottom-[6%] left-1/2 -translate-x-1/2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/40 animate-pulse-ring"
              style={{ animationDelay: `${i * 0.8}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
