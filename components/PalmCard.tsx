'use client';

import { motion } from 'framer-motion';
import { Wifi } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { inr } from '@/lib/utils';

interface PalmCardProps {
  name: string;
  walletId: string;
  balance: number;
  tier: string;
}

/** A premium "palm card" — the wallet's hero object. Subtle 3D tilt on hover. */
export function PalmCard({ name, walletId, balance, tier }: PalmCardProps) {
  return (
    <motion.div
      className="perspective relative aspect-[1.6/1] w-full"
      whileHover={{ rotateX: 6, rotateY: -8 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-ink-600 via-ink-700 to-ink-800 p-6 shadow-float">
        {/* aurora sheen */}
        <div className="absolute inset-0 bg-aurora opacity-60" />
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-12 -left-6 h-40 w-40 rounded-full bg-secondary/30 blur-3xl" />

        {/* palm watermark */}
        <svg viewBox="0 0 100 120" className="absolute -right-2 bottom-0 h-4/5 opacity-[0.12]" fill="none">
          <path d="M35,115 C30,85 42,70 50,70 C58,70 70,85 65,115 Z M31,68 c-1-26 0-36 4-36 s4,10,4,36 M44,67 c-1-32 0-44 5-44 s5,12,5,44 M57,68 c0-30 1-40 5-40 s5,10,4,40 M68,74 c2-22 4-30 7-29 s4,10,1,29"
            fill="#fff" />
        </svg>

        <div className="relative flex h-full flex-col justify-between">
          <div className="flex items-start justify-between">
            <Logo />
            <Wifi className="h-5 w-5 rotate-90 text-mist-200" />
          </div>

          {/* EMV-style chip */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-11 rounded-md bg-gradient-to-br from-amber-200/80 to-amber-400/60" />
            <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-white">
              {tier}
            </span>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-mist-300">Balance</p>
            <p className="text-3xl font-black tracking-tight text-white">{inr(balance)}</p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-mist-400">Holder</p>
                <p className="text-sm font-semibold text-white">{name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-mist-400">Wallet</p>
                <p className="font-mono text-sm text-white">{walletId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
