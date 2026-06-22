'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { AnimatedBackground } from '@/components/ui/AnimatedBackground';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { cn } from '@/lib/utils';

interface PageShellProps {
  children: ReactNode;
  /** Hide footer (e.g. immersive terminals) */
  footer?: boolean;
  particles?: number;
  className?: string;
  seed?: number;
}

export function PageShell({
  children,
  footer = true,
  particles = 30,
  className,
  seed = 7,
}: PageShellProps) {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground particles={particles} seed={seed} />
      <Navbar />
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={cn('relative z-10', className)}
      >
        {children}
      </motion.main>
      {footer && <Footer />}
    </div>
  );
}
