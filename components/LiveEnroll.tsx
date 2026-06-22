'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Check, Copy, Loader2, RotateCcw, TriangleAlert } from 'lucide-react';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { WebcamScanner } from '@/components/WebcamScanner';
import { GlowButton } from '@/components/ui/GlowButton';
import { useOpenCV } from '@/lib/opencv/useOpenCV';
import { canvasToGray, matToDataURL, preprocess } from '@/lib/opencv/pipeline';
import { extractFeatures, SerializedDescriptors } from '@/lib/opencv/matcher';
import { BiometricUser, useBiometrics } from '@/lib/biometricStore';
import { cn } from '@/lib/utils';

const NEEDED = 3;

function hex(n: number) {
  const c = '0123456789ABCDEF';
  let s = '';
  for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * 16)];
  return s;
}

interface Sample {
  thumb: string;
  desc: SerializedDescriptors;
}

type Phase = 'collect' | 'name' | 'done';

export function LiveEnroll() {
  const { cv, ready, loading, error, load } = useOpenCV();
  const enroll = useBiometrics((s) => s.enroll);

  const [samples, setSamples] = useState<Sample[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('collect');
  const [name, setName] = useState('');
  const [identity, setIdentity] = useState<BiometricUser | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCapture = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!cv || !ready) {
        setNote('Engine still loading — try again in a moment.');
        return;
      }
      setBusy(true);
      setNote(null);
      // defer so the busy overlay paints before the (sync) WASM work
      setTimeout(() => {
        let gray: any = null;
        let result: any = null;
        try {
          gray = canvasToGray(cv, canvas);
          result = preprocess(cv, gray);
          const thumb = matToDataURL(cv, result.mat);
          const desc = extractFeatures(cv, result.mat);
          if (!desc || desc.kp < 18) {
            setNote('Could not read enough palm detail — fill the frame & hold steady.');
          } else {
            setSamples((prev) => {
              const next = [...prev, { thumb, desc }];
              if (next.length >= NEEDED) setPhase('name');
              return next;
            });
          }
        } catch (e) {
          console.error(e);
          setNote('Processing failed for that frame — please retry.');
        } finally {
          gray?.delete?.();
          result?.mat?.delete?.();
          setBusy(false);
        }
      }, 30);
    },
    [cv, ready]
  );

  const createIdentity = () => {
    const user: BiometricUser = {
      id: `PLM-${hex(4)}-${hex(4)}`,
      name: name.trim() || 'New Member',
      palmId: `PLM-${hex(4)}-${hex(4)}`,
      walletId: `WLT-${hex(6)}`,
      token: `bt_${hex(16).toLowerCase()}`,
      createdAt: Date.now(),
      samples: samples.map((s) => s.desc),
      thumb: samples[0]?.thumb ?? '',
    };
    user.palmId = user.id;
    enroll(user);
    setIdentity(user);
    setPhase('done');
  };

  const reset = () => {
    setSamples([]);
    setPhase('collect');
    setName('');
    setIdentity(null);
    setNote(null);
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
            busy={busy || (!ready && loading)}
            captureLabel={ready ? `Capture Sample ${Math.min(samples.length + 1, NEEDED)} / ${NEEDED}` : 'Preparing engine…'}
          />
        )}

        {note && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-warn/25 bg-warn/5 px-3 py-2 text-xs text-warn">
            <TriangleAlert className="h-4 w-4 shrink-0" /> {note}
          </div>
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
                {phase === 'name' ? 'Name your identity' : 'Capturing biometric samples'}
              </h3>
              <p className="mt-1 text-sm text-mist-300">
                We capture {NEEDED} samples and run each through the palm-vein pipeline
                (ROI → CLAHE → vein enhancement → ORB features).
              </p>

              {/* sample slots */}
              <div className="mt-5 grid grid-cols-3 gap-3">
                {Array.from({ length: NEEDED }).map((_, i) => {
                  const s = samples[i];
                  return (
                    <div
                      key={i}
                      className={cn(
                        'relative aspect-square overflow-hidden rounded-xl border',
                        s ? 'border-accent/40' : 'border-dashed border-white/15 bg-white/[0.02]'
                      )}
                    >
                      {s ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.thumb} alt={`Sample ${i + 1}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-xs text-mist-500">
                          {i + 1}
                        </div>
                      )}
                      {s && (
                        <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-accent text-ink-900">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      )}
                      <span className="absolute bottom-1 left-1.5 font-mono text-[9px] uppercase text-mist-300">
                        {s ? `${s.desc.kp} pts` : 'enhanced ROI'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {phase === 'name' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
                  <label className="text-xs font-medium uppercase tracking-wider text-mist-400">
                    Full name
                  </label>
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

              {phase === 'collect' && (
                <p className="mt-5 text-sm text-mist-400">
                  {samples.length} / {NEEDED} captured — vary the angle slightly between captures
                  for a more robust template.
                </p>
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
                {identity.name} is now registered with {identity.samples.length} biometric samples.
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
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        ready ? 'bg-accent/12 text-accent' : 'bg-white/5 text-mist-400'
      )}
    >
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
      <Link href="/authenticate" className="text-primary hover:underline">
        go to login
      </Link>
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
