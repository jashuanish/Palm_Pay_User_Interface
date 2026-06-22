'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Check, Copy, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { WebcamScanner } from '@/components/WebcamScanner';
import { GlowButton } from '@/components/ui/GlowButton';
import { useCvWorker } from '@/lib/opencv/useCvWorker';
import { extractCv, grayToDataURL } from '@/lib/opencv/cvClient';
import { SerializedDescriptors } from '@/lib/opencv/matcher';
import { BiometricUser, useBiometrics } from '@/lib/biometricStore';
import { cn } from '@/lib/utils';

// Auto-capture until we have this many GOOD frames, then keep the best KEEP.
const TARGET_GOOD = 6;
const KEEP = 5;
const MIN_KP = 22;

function hex(n: number) {
  const c = '0123456789ABCDEF';
  let s = '';
  for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * 16)];
  return s;
}

interface Candidate {
  thumb: string;
  desc: SerializedDescriptors;
  kp: number;
}

type Phase = 'collect' | 'name' | 'done';

export function LiveEnroll() {
  const { ready, loading, error, load } = useCvWorker();
  const enroll = useBiometrics((s) => s.enroll);

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>('collect');
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState<BiometricUser | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [load]);

  const handleCapture = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!ready) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      setBusy(true);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      extractCv(img.data.buffer, canvas.width, canvas.height)
        .then((res) => {
          setAttempts((a) => a + 1);
          if (res.desc && res.kp >= MIN_KP) {
            const cand: Candidate = { thumb: grayToDataURL(res.gray), desc: res.desc, kp: res.kp };
            setCandidates((prev) => {
              const next = [...prev, cand];
              if (next.length >= TARGET_GOOD) setPhase('name');
              return next;
            });
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setBusy(false));
    },
    [ready]
  );

  const best = candidates.length
    ? candidates.reduce((a, b) => (b.kp > a.kp ? b : a))
    : null;

  const createIdentity = () => {
    // Keep the highest-quality frames as the consolidated identity template.
    const top = [...candidates].sort((a, b) => b.kp - a.kp).slice(0, KEEP);
    const user: BiometricUser = {
      id: `PLM-${hex(4)}-${hex(4)}`,
      name: name.trim() || 'New Member',
      palmId: '',
      walletId: `WLT-${hex(6)}`,
      token: `bt_${hex(16).toLowerCase()}`,
      createdAt: Date.now(),
      samples: top.map((c) => c.desc),
      thumb: best?.thumb ?? top[0]?.thumb ?? '',
    };
    user.palmId = user.id;
    enroll(user);
    setIdentity(user);
    setPhase('done');
  };

  const reset = () => {
    setCandidates([]);
    setAttempts(0);
    setPhase('collect');
    setName('');
    setIdentity(null);
  };

  const copy = (val: string, key: string) => {
    navigator.clipboard?.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
        Failed to load the on-device vision engine: {error}. Reload the page to retry.
      </div>
    );
  }

  const pct = Math.min(100, Math.round((candidates.length / TARGET_GOOD) * 100));
  const autoStatus = !ready
    ? 'Preparing engine…'
    : phase === 'collect'
      ? `Auto-capturing — ${candidates.length}/${TARGET_GOOD} strong frames`
      : 'Best identity locked';

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      {/* camera */}
      <div className="rounded-3xl glass-strong p-5 shadow-float sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Live Palm Capture</span>
          <EngineBadge ready={ready} loading={loading} />
        </div>
        {phase === 'done' ? (
          <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-accent/30 bg-accent/[0.04]">
            <div className="text-center">
              <BadgeCheck className="mx-auto h-10 w-10 text-accent" />
              <p className="mt-2 text-sm font-semibold text-white">Enrollment complete</p>
            </div>
          </div>
        ) : (
          <WebcamScanner
            onCapture={handleCapture}
            onStart={load}
            auto={phase === 'collect'}
            busy={busy}
            disabled={!ready}
            autoStatus={autoStatus}
          />
        )}
      </div>

      {/* right panel */}
      <div className="min-h-[360px]">
        <AnimatePresence mode="wait">
          {(phase === 'collect' || phase === 'name') && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-3xl glass-strong p-6 shadow-float"
            >
              <h3 className="text-lg font-bold text-white">
                {phase === 'name' ? 'Best identity captured' : 'Building your palm identity'}
              </h3>
              <p className="mt-1 text-sm text-mist-300">
                Just hold your palm in the frame — PalmPay captures continuously and keeps the
                strongest frames automatically (ROI → CLAHE → vein enhancement → ORB).
              </p>

              <div className="mt-5 flex items-center gap-4">
                {/* best ROI preview */}
                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-ink-700">
                  {best ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={best.thumb} alt="Best palm" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-mist-500">ROI</div>
                  )}
                  <span className="absolute bottom-1 left-1.5 rounded bg-ink-900/70 px-1.5 py-0.5 font-mono text-[9px] text-accent backdrop-blur">
                    {best ? `${best.kp} pts` : 'enhanced'}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-end justify-between">
                    <span className="text-xs text-mist-300">Strong frames</span>
                    <span className="text-sm font-bold text-white">{candidates.length}/{TARGET_GOOD}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent" animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-mist-400">
                    {attempts} frames analyzed · {candidates.length} kept
                  </p>
                  {phase === 'collect' && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-accent">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> {ready ? 'Scanning…' : 'Loading engine…'}
                    </p>
                  )}
                </div>
              </div>

              {phase === 'name' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/12 px-3 py-1 text-xs font-semibold text-accent">
                    <Sparkles className="h-3.5 w-3.5" /> Best of {attempts} frames selected
                  </div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-mist-400">Full name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    autoFocus
                    className="mt-2 w-full rounded-xl border border-white/10 bg-ink-800/60 px-4 py-3 text-white outline-none transition-colors placeholder:text-mist-500 focus:border-primary/60"
                  />
                  <div className="mt-4 flex gap-2">
                    <GlowButton onClick={createIdentity} size="md" className="flex-1" disabled={!name.trim()}>
                      Create Palm Identity <ArrowRight className="h-4 w-4" />
                    </GlowButton>
                    <GlowButton onClick={reset} variant="outline" size="md">
                      <RotateCcw className="h-4 w-4" />
                    </GlowButton>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {phase === 'done' && identity && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/[0.08] to-transparent p-6 shadow-float"
            >
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
              <span className="relative grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent">
                <BadgeCheck className="h-7 w-7" />
              </span>
              <h3 className="relative mt-4 text-2xl font-black text-white">Palm Enrolled</h3>
              <p className="relative text-sm text-mist-300">
                {identity.name} is registered from the {identity.samples.length} strongest frames.
              </p>

              <div className="relative mt-5 space-y-2.5">
                <IdRow label="Palm ID" value={identity.palmId} onCopy={() => copy(identity.palmId, 'p')} copied={copied === 'p'} />
                <IdRow label="Wallet ID" value={identity.walletId} onCopy={() => copy(identity.walletId, 'w')} copied={copied === 'w'} />
                <IdRow label="Biometric Token" value={identity.token} mono onCopy={() => copy(identity.token, 't')} copied={copied === 't'} />
              </div>

              <div className="relative mt-6 flex flex-col gap-2 sm:flex-row">
                <GlowButton href="/authenticate" size="md" className="flex-1">
                  Test Login Now <ArrowRight className="h-4 w-4" />
                </GlowButton>
                <GlowButton onClick={reset} variant="outline" size="md" className="flex-1">
                  Enroll Another
                </GlowButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && phase !== 'done' && (
          <p className="mt-3 flex items-center gap-2 text-xs text-mist-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading on-device vision engine (one-time ~11MB)…
          </p>
        )}
        <EnrolledNote />
      </div>
    </div>
  );
}

function EngineBadge({ ready, loading }: { ready: boolean; loading: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', ready ? 'bg-accent/12 text-accent' : 'bg-white/5 text-mist-400')}>
      <span className={cn('h-1.5 w-1.5 rounded-full', ready ? 'bg-accent' : loading ? 'bg-warn animate-pulse' : 'bg-mist-500')} />
      {ready ? 'OpenCV engine ready' : loading ? 'Loading engine' : 'Engine on standby'}
    </span>
  );
}

function EnrolledNote() {
  const count = useBiometrics((s) => s.users.length);
  if (count === 0) return null;
  return (
    <p className="mt-4 text-center text-xs text-mist-500">
      {count} palm{count > 1 ? 's' : ''} enrolled on this device ·{' '}
      <Link href="/authenticate" className="text-primary hover:underline">go to login</Link>
    </p>
  );
}

function IdRow({ label, value, onCopy, copied, mono }: { label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-ink-800/50 p-3">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-mist-400">{label}</p>
        <p className={cn('truncate text-sm text-white', mono && 'font-mono')}>{value}</p>
      </div>
      <button onClick={onCopy} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-mist-200 transition-colors hover:bg-white/10 hover:text-white" aria-label="Copy">
        {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
