'use client';

import { motion } from 'framer-motion';
import { Camera, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BioMode = 'live' | 'demo';

export function BiometricModeToggle({
  mode,
  onChange,
  liveLabel = 'Live Camera',
  demoLabel = 'Upload (Demo)',
}: {
  mode: BioMode;
  onChange: (m: BioMode) => void;
  liveLabel?: string;
  demoLabel?: string;
}) {
  const opts: { key: BioMode; label: string; icon: any; tag: string }[] = [
    { key: 'live', label: liveLabel, icon: Camera, tag: 'Real-time' },
    { key: 'demo', label: demoLabel, icon: Upload, tag: 'Scripted' },
  ];
  return (
    <div className="mt-8 inline-flex rounded-2xl glass p-1.5">
      {opts.map((o) => {
        const Icon = o.icon;
        const active = mode === o.key;
        return (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={cn(
              'relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors',
              active ? 'text-ink-900' : 'text-mist-200 hover:text-white'
            )}
          >
            {active && (
              <motion.span
                layoutId="bio-mode-pill"
                className="absolute inset-0 rounded-xl bg-brand-gradient"
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {o.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase',
                  active ? 'bg-ink-900/20 text-ink-900' : 'bg-white/10 text-mist-300'
                )}
              >
                {o.tag}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
