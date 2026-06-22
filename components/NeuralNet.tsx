'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface NeuralNetProps {
  className?: string;
  layers?: number[];
  width?: number;
  height?: number;
  animate?: boolean;
}

/** Animated fully-connected neural network — signals pulse along edges. */
export function NeuralNet({
  className,
  layers = [5, 7, 7, 4],
  width = 460,
  height = 280,
  animate = true,
}: NeuralNetProps) {
  const { nodes, edges } = useMemo(() => {
    const padX = 44;
    const padY = 30;
    const colGap = (width - padX * 2) / (layers.length - 1);
    const nodes: { x: number; y: number; layer: number }[] = [];
    layers.forEach((count, li) => {
      const rowGap = (height - padY * 2) / Math.max(1, count - 1);
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: padX + li * colGap,
          y: count === 1 ? height / 2 : padY + i * rowGap,
          layer: li,
        });
      }
    });
    const edges: { x1: number; y1: number; x2: number; y2: number; key: string }[] = [];
    for (let li = 0; li < layers.length - 1; li++) {
      const cur = nodes.filter((n) => n.layer === li);
      const nxt = nodes.filter((n) => n.layer === li + 1);
      cur.forEach((a, ai) =>
        nxt.forEach((b, bi) =>
          edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, key: `${li}-${ai}-${bi}` })
        )
      );
    }
    return { nodes, edges };
  }, [layers, width, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('h-full w-full', className)}
      fill="none"
    >
      <defs>
        <linearGradient id="nnEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#7B61FF" />
        </linearGradient>
      </defs>

      {edges.map((e, i) => (
        <motion.line
          key={e.key}
          x1={e.x1}
          y1={e.y1}
          x2={e.x2}
          y2={e.y2}
          stroke="url(#nnEdge)"
          strokeWidth="0.7"
          initial={{ opacity: 0 }}
          animate={{ opacity: animate ? [0.06, 0.32, 0.06] : 0.16 }}
          transition={{
            duration: 2.4,
            delay: (i % 11) * 0.12,
            repeat: animate ? Infinity : 0,
            ease: 'easeInOut',
          }}
        />
      ))}

      {nodes.map((n, i) => (
        <g key={i}>
          <motion.circle
            cx={n.x}
            cy={n.y}
            r="7"
            fill="#00E5FF"
            opacity="0.12"
            animate={animate ? { r: [6, 9, 6], opacity: [0.08, 0.25, 0.08] } : {}}
            transition={{ duration: 2.2, delay: i * 0.08, repeat: Infinity }}
          />
          <circle cx={n.x} cy={n.y} r="3.4" fill="#E4E9F2" />
          <circle cx={n.x} cy={n.y} r="3.4" fill="url(#nnEdge)" opacity="0.6" />
        </g>
      ))}

      {/* travelling signal dots */}
      {animate &&
        edges
          .filter((_, i) => i % 9 === 0)
          .map((e, i) => (
            <motion.circle
              key={`s-${e.key}`}
              r="2.2"
              fill="#00FFA3"
              initial={{ cx: e.x1, cy: e.y1, opacity: 0 }}
              animate={{ cx: e.x2, cy: e.y2, opacity: [0, 1, 0] }}
              transition={{
                duration: 1.4,
                delay: i * 0.3,
                repeat: Infinity,
                repeatDelay: 1.2,
                ease: 'easeInOut',
              }}
            />
          ))}
    </svg>
  );
}
