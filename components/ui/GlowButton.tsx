'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlowButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

export function GlowButton({
  children,
  href,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  disabled,
}: GlowButtonProps) {
  const base = cn(
    'group relative inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight transition-colors duration-300 select-none',
    sizes[size],
    disabled && 'opacity-50 pointer-events-none',
    className
  );

  const inner = (
    <>
      {variant === 'primary' && (
        <>
          <span className="absolute inset-0 rounded-full bg-brand-gradient opacity-100 transition-opacity" />
          <span className="absolute inset-0 rounded-full bg-brand-gradient opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-70" />
          <span className="absolute inset-[1.5px] rounded-full bg-ink-800/90 opacity-0 transition-opacity group-hover:opacity-0" />
        </>
      )}
      <span
        className={cn(
          'relative z-10 inline-flex items-center gap-2',
          variant === 'primary' && 'text-ink-900',
          variant === 'ghost' && 'text-mist-100',
          variant === 'outline' && 'text-white'
        )}
      >
        {children}
      </span>
      {variant === 'outline' && (
        <span className="absolute inset-0 rounded-full border border-white/15 transition-colors group-hover:border-primary/60" />
      )}
      {variant === 'ghost' && (
        <span className="absolute inset-0 rounded-full bg-white/0 transition-colors group-hover:bg-white/5" />
      )}
    </>
  );

  const motionProps = {
    whileHover: { scale: disabled ? 1 : 1.035 },
    whileTap: { scale: disabled ? 1 : 0.97 },
    transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
  };

  if (href) {
    return (
      <motion.div {...motionProps} className="inline-block">
        <Link href={href} className={base}>
          {inner}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      {...motionProps}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={base}
    >
      {inner}
    </motion.button>
  );
}
