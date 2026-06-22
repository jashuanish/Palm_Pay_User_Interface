'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';

interface StatTileProps {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  trend?: { value: string; up?: boolean };
  glow?: 'cyan' | 'purple' | 'green' | 'none';
  className?: string;
}

export function StatTile({
  icon,
  label,
  value,
  sub,
  trend,
  glow = 'none',
  className,
}: StatTileProps) {
  return (
    <GlassCard interactive glow={glow} className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-mist-300">{label}</p>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {value}
          </div>
          {sub && <p className="mt-1 text-xs text-mist-400">{sub}</p>}
        </div>
        {icon && (
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-primary">
            {icon}
          </span>
        )}
      </div>
      {trend && (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className={cn(
            'mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
            trend.up ? 'bg-accent/10 text-accent' : 'bg-danger/10 text-danger'
          )}
        >
          {trend.up ? '▲' : '▼'} {trend.value}
        </motion.div>
      )}
    </GlassCard>
  );
}
