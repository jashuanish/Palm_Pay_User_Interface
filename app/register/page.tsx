'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Copy,
  Cpu,
  Fingerprint,
  ScanLine,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { PalmUploader } from '@/components/PalmUploader';
import { NeuralNet } from '@/components/NeuralNet';
import { ProcessingStages, Stage } from '@/components/ProcessingStages';
import { GlowButton } from '@/components/ui/GlowButton';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { LiveEnroll } from '@/components/LiveEnroll';
import { BiometricModeToggle, BioMode } from '@/components/BiometricModeToggle';
import { cn } from '@/lib/utils';

const STEPS = [
  { icon: ScanLine, title: 'Capture Palm', sub: 'Upload a palm image' },
  { icon: Fingerprint, title: 'Vein Extraction', sub: 'Map the vein pattern' },
  { icon: Cpu, title: 'Feature Encoding', sub: 'Build the embedding' },
  { icon: Wallet, title: 'Wallet Creation', sub: 'Mint your identity' },
];

const ENCODE_STAGES: Stage[] = [
  { key: 'a', label: 'Vein graph construction', detail: 'Building minutiae adjacency graph', ms: 1100 },
  { key: 'b', label: 'CNN feature encoder', detail: 'ResNet-50 → 512-d embedding', ms: 1300 },
  { key: 'c', label: 'Template hardening', detail: 'AES-256 sealing of biometric template', ms: 1100 },
];

function hex(n: number) {
  let s = '';
  const chars = '0123456789ABCDEF';
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

interface Identity {
  palmId: string;
  walletId: string;
  token: string;
}

export default function RegisterPage() {
  const [mode, setMode] = useState<BioMode>('live');
  const [step, setStep] = useState(0);
  const [captured, setCaptured] = useState<string | 'sample' | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const goExtract = (src: string | 'sample') => {
    if (!src) {
      setCaptured(null);
      return;
    }
    setCaptured(src);
    setStep(1);
    // auto-advance to encoding after vein extraction
    setTimeout(() => setStep(2), 3200);
  };

  const finishEncoding = () => {
    setIdentity({
      palmId: `PLM-${hex(4)}-${hex(4)}`,
      walletId: `WLT-${hex(6)}`,
      token: `bt_${hex(16).toLowerCase()}`,
    });
    setTimeout(() => setStep(3), 500);
  };

  const copy = (val: string, key: string) => {
    navigator.clipboard?.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const reset = () => {
    setStep(0);
    setCaptured(null);
    setIdentity(null);
  };

  return (
    <PageShell particles={24} seed={11}>
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-32">
        <SectionHeading
          align="left"
          eyebrow="Palm Registration"
          title={
            <>
              Enroll into the <span className="text-gradient">future of banking.</span>
            </>
          }
          subtitle="Turn a palm into a sovereign payment identity. Enroll live from your camera — or replay the scripted demo."
        />

        <BiometricModeToggle mode={mode} onChange={setMode} liveLabel="Live Enroll" demoLabel="Scripted Demo" />

        {mode === 'live' && (
          <div className="mt-8">
            <LiveEnroll />
          </div>
        )}

        {mode === 'demo' && (
        <>
        {/* Stepper */}
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const state = i < step ? 'done' : i === step ? 'active' : 'idle';
            return (
              <div
                key={s.title}
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-4 transition-all duration-500',
                  state === 'active'
                    ? 'border-primary/40 bg-primary/5 shadow-glow'
                    : state === 'done'
                      ? 'border-accent/25 bg-accent/[0.04]'
                      : 'border-white/8 bg-white/[0.02] opacity-60'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'grid h-9 w-9 place-items-center rounded-xl transition-colors',
                      state === 'done'
                        ? 'bg-accent/15 text-accent'
                        : state === 'active'
                          ? 'bg-brand-gradient text-ink-900'
                          : 'bg-white/5 text-mist-400'
                    )}
                  >
                    {state === 'done' ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span className="font-mono text-[11px] text-mist-400">0{i + 1}</span>
                </div>
                <p className="mt-3 text-sm font-bold text-white">{s.title}</p>
                <p className="text-xs text-mist-400">{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* Panels */}
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* visual side */}
          <div className="rounded-3xl glass-strong p-6 shadow-float">
            {step === 0 ? (
              <PalmUploader onCapture={goExtract} captured={captured} />
            ) : (
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-white/10">
                <PalmUploader onCapture={() => {}} captured={captured} scanning={step === 1} />
              </div>
            )}
          </div>

          {/* content side */}
          <div className="min-h-[360px]">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <Panel key="s0" title="Step 1 · Capture Palm">
                  <p className="text-sm leading-relaxed text-mist-300">
                    Upload a clear image of an open palm. A near-infrared sensor would normally
                    illuminate the vein pattern beneath the skin — for this demo, any palm image
                    (or our sample) works perfectly.
                  </p>
                  <ul className="mt-5 space-y-2.5 text-sm">
                    <Bullet>Veins sit 3mm below the skin — invisible to cameras, unique to you</Bullet>
                    <Bullet>Cannot be lifted from a surface like a fingerprint</Bullet>
                    <Bullet>Requires a living hand — spoofing is near-impossible</Bullet>
                  </ul>
                </Panel>
              )}

              {step === 1 && (
                <Panel key="s1" title="Step 2 · Palm Vein Extraction">
                  <p className="text-sm leading-relaxed text-mist-300">
                    Isolating the vascular network and detecting bifurcation and endpoint
                    minutiae across the palm surface.
                  </p>
                  <div className="mt-5 space-y-3">
                    <Meter label="Vein segmentation" to={98} delay={0.2} />
                    <Meter label="Minutiae detected" to={1214} suffix=" pts" delay={0.5} raw />
                    <Meter label="Image quality (NFIQ)" to={94} delay={0.8} />
                  </div>
                  <div className="mt-5 flex items-center gap-2 text-sm text-accent">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                    Extracting vein graph…
                  </div>
                </Panel>
              )}

              {step === 2 && (
                <Panel key="s2" title="Step 3 · Feature Encoding">
                  <div className="mb-4 overflow-hidden rounded-xl border border-primary/20 bg-ink-700/50 p-2">
                    <NeuralNet layers={[6, 8, 8, 5]} height={150} />
                  </div>
                  <ProcessingStages stages={ENCODE_STAGES} running onComplete={finishEncoding} />
                </Panel>
              )}

              {step === 3 && identity && (
                <motion.div
                  key="s3"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                  className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/[0.08] to-transparent p-6 shadow-float"
                >
                  <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 240, damping: 14 }}
                    className="relative grid h-16 w-16 place-items-center rounded-full bg-accent/15 text-accent"
                  >
                    <BadgeCheck className="h-8 w-8" />
                  </motion.span>
                  <h3 className="relative mt-4 text-2xl font-black text-white">Wallet Created</h3>
                  <p className="relative text-sm text-mist-300">
                    Your palm is now a sovereign payment identity.
                  </p>

                  <div className="relative mt-5 space-y-3">
                    <IdRow label="Palm ID" value={identity.palmId} onCopy={() => copy(identity.palmId, 'palm')} copied={copied === 'palm'} />
                    <IdRow label="Wallet ID" value={identity.walletId} onCopy={() => copy(identity.walletId, 'wallet')} copied={copied === 'wallet'} />
                    <IdRow label="Biometric Token" value={identity.token} onCopy={() => copy(identity.token, 'token')} copied={copied === 'token'} mono />
                  </div>

                  <div className="relative mt-6 flex flex-col gap-2 sm:flex-row">
                    <GlowButton href="/authenticate" size="md" className="flex-1">
                      Authenticate Now <ArrowRight className="h-4 w-4" />
                    </GlowButton>
                    <GlowButton onClick={reset} variant="outline" size="md" className="flex-1">
                      Enroll another
                    </GlowButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </>
        )}
      </div>
    </PageShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl glass-strong p-6 shadow-float"
    >
      <h3 className="mb-4 text-lg font-bold text-white">{title}</h3>
      {children}
    </motion.div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-mist-200">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <span>{children}</span>
    </li>
  );
}

function Meter({ label, to, suffix = '%', delay = 0, raw = false }: { label: string; to: number; suffix?: string; delay?: number; raw?: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-mist-300">{label}</span>
        <span className="font-semibold text-white">
          {raw ? to.toLocaleString() : to}
          {suffix}
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: raw ? '100%' : `${to}%` }}
          transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

function IdRow({ label, value, onCopy, copied, mono }: { label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-ink-800/50 p-3">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-mist-400">{label}</p>
        <p className={cn('truncate text-sm text-white', mono && 'font-mono')}>{value}</p>
      </div>
      <button
        onClick={onCopy}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-mist-200 transition-colors hover:bg-white/10 hover:text-white"
        aria-label="Copy"
      >
        {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
