'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient shadow-glow">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <motion.path
            d="M12 21c-1-5 1-7 1-10a1 1 0 0 1 2 0v5M8 11V6a1 1 0 0 1 2 0v5M11 11V4a1 1 0 0 1 2 0v7M16 12v-2a1 1 0 0 1 2 0v4c0 4-2 7-6 7"
            stroke="#05070A"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {withText && (
        <span className="text-[17px] font-bold tracking-tight text-white">
          Palm<span className="text-gradient">Pay</span>
        </span>
      )}
    </span>
  );
}
