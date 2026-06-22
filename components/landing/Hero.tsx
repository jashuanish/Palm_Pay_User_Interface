'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { PalmMesh } from '@/components/PalmMesh';
import { GlowButton } from '@/components/ui/GlowButton';
import { Counter } from '@/components/ui/Counter';

const floatChips = [
  { label: '₹240 · Coffee', x: '-8%', y: '12%', delay: 0.6 },
  { label: 'Approved · 0.7s', x: '78%', y: '6%', delay: 0.9 },
  { label: 'Palm matched · 98.72%', x: '82%', y: '64%', delay: 1.2 },
  { label: 'No phone needed', x: '-12%', y: '70%', delay: 1.5 },
];

export function Hero() {
  return (
    <section className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center px-6 pt-32 lg:pt-28">
      <div className="grid w-full items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* ---- Left: copy ---- */}
        <div className="relative z-10 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="inline-flex"
          >
            <span className="chip border-primary/25 bg-primary/5 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              The Future of Invisible Payments
            </span>
          </motion.div>

          <h1 className="mt-6 text-balance text-5xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
            <RevealWords text="Your Palm Is" />
            <span className="mt-1 block text-gradient">
              <RevealWords text="Now Your Wallet" delay={0.35} />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-mist-300 lg:mx-0"
          >
            Biometric payments powered by palm vein intelligence. No phone. No QR.
            No card. No cash — just you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.85 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start"
          >
            <GlowButton href="/authenticate" size="lg">
              Try the Live Demo
              <ArrowRight className="h-4 w-4" />
            </GlowButton>
            <GlowButton href="/investor" variant="outline" size="lg">
              <Zap className="h-4 w-4" />
              Investor Mode
            </GlowButton>
          </motion.div>

          {/* mini stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="mt-12 flex items-center justify-center gap-8 lg:justify-start"
          >
            <Stat value={<Counter to={99.4} decimals={1} suffix="%" />} label="Auth accuracy" />
            <Divider />
            <Stat value={<Counter to={0.7} decimals={1} suffix="s" />} label="Avg checkout" />
            <Divider />
            <Stat value={<Counter to={248} suffix="K+" />} label="Palms enrolled" />
          </motion.div>
        </div>

        {/* ---- Right: palm ---- */}
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <PalmMesh size={400} />

            {floatChips.map((c, i) => (
              <motion.div
                key={i}
                className="absolute hidden rounded-xl glass-strong px-3 py-2 text-xs font-medium text-white shadow-float md:block"
                style={{ left: c.x, top: c.y }}
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
                transition={{
                  opacity: { delay: c.delay, duration: 0.6 },
                  scale: { delay: c.delay, duration: 0.6 },
                  y: { delay: c.delay, duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                {c.label}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
      >
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/15 p-1">
          <motion.span
            className="h-1.5 w-1 rounded-full bg-primary"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
}

function RevealWords({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <span className="inline-block">
      {text.split(' ').map((w, i) => (
        <span key={i} className="mr-[0.25em] inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.9, delay: delay + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          >
            {w}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-mist-400">{label}</div>
    </div>
  );
}

function Divider() {
  return <span className="h-8 w-px bg-white/10" />;
}
