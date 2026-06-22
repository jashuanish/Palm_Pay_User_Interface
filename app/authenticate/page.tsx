'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Fingerprint,
  RotateCcw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { PalmUploader } from '@/components/PalmUploader';
import { ProcessingStages, Stage } from '@/components/ProcessingStages';
import { MatchVisualizer } from '@/components/MatchVisualizer';
import { Counter } from '@/components/ui/Counter';
import { GlowButton } from '@/components/ui/GlowButton';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { LiveLogin } from '@/components/LiveLogin';
import { BiometricModeToggle, BioMode } from '@/components/BiometricModeToggle';
import { PRIMARY_USER } from '@/lib/mockData';
import { inr, maskId } from '@/lib/utils';

type Phase = 'idle' | 'analyzing' | 'identified';

const STAGES: Stage[] = [
  { key: 'pre', label: 'Preprocessing', detail: 'Normalizing · ROI crop · CLAHE contrast', ms: 1100 },
  { key: 'feat', label: 'Feature Extraction', detail: 'Detecting 1,214 vein minutiae points', ms: 1300 },
  { key: 'emb', label: 'Embedding Generation', detail: 'Encoding → 512-dimension vector', ms: 1200 },
  { key: 'search', label: 'Database Search', detail: 'Cosine ANN over 248,930 templates', ms: 1400 },
  { key: 'conf', label: 'Confidence Scoring', detail: 'Calibrating match probability', ms: 1000 },
];

export default function AuthenticatePage() {
  const [mode, setMode] = useState<BioMode>('live');
  const [captured, setCaptured] = useState<string | 'sample' | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');

  const onCapture = (src: string | 'sample') => {
    if (!src) {
      setCaptured(null);
      setPhase('idle');
      return;
    }
    setCaptured(src);
    setPhase('analyzing');
  };

  const reset = () => {
    setCaptured(null);
    setPhase('idle');
  };

  const u = PRIMARY_USER;

  return (
    <PageShell particles={26} seed={3}>
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <SectionHeading
          align="left"
          eyebrow="Authentication Terminal"
          title={
            <>
              Place a palm. <span className="text-gradient">Become known.</span>
            </>
          }
          subtitle="Scan your enrolled palm live to log in — or replay the scripted identification demo."
        />

        <BiometricModeToggle mode={mode} onChange={setMode} liveLabel="Live Login" demoLabel="Scripted Demo" />

        {mode === 'live' && (
          <div className="mt-8">
            <LiveLogin />
          </div>
        )}

        {mode === 'demo' && (
        <>
        <div className="mt-12 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* LEFT: capture */}
          <div className="rounded-3xl glass-strong p-5 shadow-float sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                <Fingerprint className="h-4 w-4 text-primary" /> Palm Capture
              </span>
              <span className="font-mono text-[11px] text-mist-400">PP-TERMINAL · v4.2</span>
            </div>
            <PalmUploader
              onCapture={onCapture}
              captured={captured}
              scanning={phase === 'analyzing'}
            />
            {phase !== 'idle' && (
              <button
                onClick={reset}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-medium text-mist-200 transition-colors hover:bg-white/5"
              >
                <RotateCcw className="h-4 w-4" /> Scan another palm
              </button>
            )}
          </div>

          {/* RIGHT: pipeline / result */}
          <div className="min-h-[420px]">
            <AnimatePresence mode="wait">
              {phase === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid h-full place-items-center rounded-3xl border border-dashed border-white/10 p-10 text-center"
                >
                  <div>
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-mist-300">
                      <ShieldCheck className="h-6 w-6" />
                    </span>
                    <p className="mt-4 text-lg font-semibold text-white">Awaiting palm</p>
                    <p className="mt-1 text-sm text-mist-400">
                      The identity pipeline will activate the moment a palm is captured.
                    </p>
                  </div>
                </motion.div>
              )}

              {phase === 'analyzing' && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-3xl glass-strong p-6 shadow-float"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                    </span>
                    <h3 className="text-lg font-bold text-white">Analyzing Palm…</h3>
                  </div>
                  <ProcessingStages
                    stages={STAGES}
                    running={phase === 'analyzing'}
                    onComplete={() => setTimeout(() => setPhase('identified'), 400)}
                  />
                </motion.div>
              )}

              {phase === 'identified' && (
                <motion.div
                  key="identified"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/[0.07] to-transparent p-6 shadow-float"
                >
                  <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
                    className="relative inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-sm font-bold text-accent"
                  >
                    <BadgeCheck className="h-4 w-4" /> USER IDENTIFIED
                  </motion.div>

                  <div className="relative mt-5 flex items-center gap-4">
                    <span
                      className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-xl font-black text-ink-900"
                      style={{
                        background: `linear-gradient(135deg, hsl(${u.avatarHue} 90% 60%), #7B61FF)`,
                      }}
                    >
                      {u.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-white">{u.name}</h3>
                      <p className="font-mono text-sm text-mist-300">{u.palmId}</p>
                    </div>
                    <span className="ml-auto rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                      {u.tier}
                    </span>
                  </div>

                  {/* confidence */}
                  <div className="relative mt-6 rounded-2xl border border-white/10 bg-ink-800/50 p-5">
                    <div className="flex items-end justify-between">
                      <span className="text-sm text-mist-300">Match confidence</span>
                      <span className="text-4xl font-black text-accent">
                        <Counter to={u.matchConfidence} decimals={2} duration={1.8} />%
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent"
                        initial={{ width: 0 }}
                        animate={{ width: `${u.matchConfidence}%` }}
                        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>

                  <div className="relative mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                      <p className="text-xs text-mist-400">Wallet balance</p>
                      <p className="mt-1 text-xl font-bold text-white">{inr(u.balance)}</p>
                    </div>
                    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                      <p className="text-xs text-mist-400">Wallet ID</p>
                      <p className="mt-1 font-mono text-sm text-white">{maskId(u.walletId)}</p>
                    </div>
                  </div>

                  <div className="relative mt-5 flex flex-col gap-2 sm:flex-row">
                    <GlowButton href="/wallet" size="md" className="flex-1">
                      <Wallet className="h-4 w-4" /> Open Wallet
                    </GlowButton>
                    <GlowButton href="/store" variant="outline" size="md" className="flex-1">
                      Pay at Store <ArrowRight className="h-4 w-4" />
                    </GlowButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Match visualization */}
        <AnimatePresence>
          {phase === 'identified' && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-8"
            >
              <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-mist-400">
                Match Visualization
              </h3>
              <MatchVisualizer
                uploaded={captured}
                matchedName={u.name}
                confidence={u.matchConfidence}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </>
        )}
      </div>
    </PageShell>
  );
}
