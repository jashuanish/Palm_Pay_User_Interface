'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Adds a subtle 3D tilt + glow on hover */
  interactive?: boolean;
  glow?: 'cyan' | 'purple' | 'green' | 'none';
  as?: 'div' | 'section' | 'article';
}

const glowMap = {
  cyan: 'hover:shadow-glow',
  purple: 'hover:shadow-glow-purple',
  green: 'hover:shadow-glow-green',
  none: '',
};

export function GlassCard({
  children,
  className,
  interactive = false,
  glow = 'none',
  as = 'div',
}: GlassCardProps) {
  const Comp = motion[as];
  return (
    <Comp
      className={cn(
        'relative overflow-hidden rounded-2xl glass shadow-glass',
        interactive && 'transition-shadow duration-500',
        interactive && glowMap[glow],
        className
      )}
      whileHover={interactive ? { y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
    >
      {/* top sheen */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      {children}
    </Comp>
  );
}
