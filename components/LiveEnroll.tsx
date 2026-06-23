'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Check, Copy, Loader2, RotateCcw, ShieldAlert, ShieldCheck, TriangleAlert, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { WebcamScanner } from '@/components/WebcamScanner';
import { GlowButton } from '@/components/ui/GlowButton';
import { analyzePalm, getMlStatus, PalmAnalysis } from '@/lib/palm/palmApi';
import { BiometricUser, useBiometrics } from '@/lib/biometricStore';
import { cn } from '@/lib/utils';

const TARGET = 5; // strong frames to collect

function hex(n: number) {
  const c = '0123456789ABCDEF';
  let s = '';
  for (let i = 0; i < n; i++) s += c[Math.floor(Math.random() * 16)];
  return s;
}

interface Sample {
  embedding: number[];
  pattern: string;
  roi: string;
  imageType: 'print' | 'vein';
  secure: boolean;
}

type Phase = 'profile' | 'collect' | 'done';

export function LiveEnroll() {
  const enroll = useBiometrics((s) => s.enroll);

  const [phase, setPhase] = useState<Phase>('profile');
  const [name, setName] = useState('');
  const [samples, setSamples] = useState<Sample[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [identity, setIdentity] = useState<BiometricUser | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    getMlStatus().then((s) => setOnline(s.online && s.modelLoaded));
  }, []);

  const handleCapture = useCallback((canvas: HTMLCanvasElement) => {
    setBusy(true);
    setErr(null);
    analyzePalm(canvas)
      .then((a: PalmAnalysis) => {
        setSamples((prev) => {
          if (prev.length >= TARGET) return prev;
          const next = [
            ...prev,
            { embedding: a.embedding, pattern: a.pattern, roi: a.roi, imageType: a.imageType, secure: a.secure },
          ];
          if (next.length >= TARGET) {
            // auto-create identity once we have enough frames
            setTimeout(() => finalize(next), 250);
          }
          return next;
        });
      })
      .catch((e) => setErr(e?.message ?? 'Analysis failed'))
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finalize = (collected: Sample[]) => {
    const anyVein = collected.some((s) => s.imageType === 'vein');
    const user: BiometricUser = {
      id: `PLM-${hex(4)}-${hex(4)}`,
      name: name.trim() || 'New Member',
      palmId: '',
      walletId: `WLT-${hex(6)}`,
      token: `bt_${hex(16).toLowerCase()}`,
      createdAt: Date.now(),
      embeddings: collected.map((s) => s.embedding),
      thumb: collected[collected.length - 1]?.pattern ?? '',
      imageType: anyVein ? 'vein' : 'print',
      secure: anyVein,
    };
    user.palmId = user.id;
    enroll(user);
    setIdentity(user);
    setPhase('done');
  };

  const reset = () => {
    setPhase('profile');
    setName('');
    setSamples([]);
    setIdentity(null);
    setErr(null);
  };

  const copy = (val: string, key: string) => {
    navigator.clipboard?.writeText(val);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const latest = samples[samples.length - 1] ?? null;
  const pct = Math.min(100, Math.round((samples.length / TARGET) * 100));

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      {/* LEFT: camera / profile */}
      <div className="rounded-3xl glass-strong p-5 shadow-float sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            {phase === 'profile' ? 'Create Profile' : 'Live Palm Enrollment'}
          </span>
          <ModelBadge online={online} />
        </div>

        {phase === 'profile' && (
          <div className="grid aspect-[4/3] place-content-center gap-4 rounded-2xl border border-white/10 bg-ink-800/40 p-8">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-primary">
              <User className="h-7 w-7" />
            </span>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-mist-400">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) setPhase('collect'); }}
                className="mt-2 w-full rounded-xl border border-white/10 bg-ink-900/60 px-4 py-3 text-center text-white outline-none transition-colors placeholder:text-mist-500 focus:border-primary/60"
              />
            </div>
            <p className="text-center text-xs text-mist-400">
              Next you’ll register your palm — just hold it up, capture is automatic.
            </p>
          </div>
        )}

        {phase === 'collect' && (
          <WebcamScanner
            onCapture={handleCapture}
            auto
            busy={busy}
            autoStatus={`Capturing ${samples.length}/${TARGET} palm frames`}
          />
        )}

        {phase === 'done' && (
          <div className="grid aspect-[4/3] place-items-center rounded-2xl border border-accent/30 bg-accent/[0.04]">
            <div className="text-center">
              <BadgeCheck className="mx-auto h-10 w-10 text-accent" />
              <p className="mt-2 text-sm font-semibold text-white">Profile + palm enrolled</p>
            </div>
          </div>
        )}

        {phase === 'profile' && (
          <GlowButton onClick={() => setPhase('collect')} size="md" className="mt-4 w-full" disabled={!name.trim()}>
            Register My Palm <ArrowRight className="h-4 w-4" />
          </GlowButton>
        )}

        {err && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-danger/25 bg-danger/5 px-3 py-2 text-xs text-danger">
            <TriangleAlert className="h-4 w-4 shrink-0" /> {err}
          </div>
        )}
        {online === false && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-warn/25 bg-warn/5 px-3 py-2 text-xs text-warn">
            <TriangleAlert className="h-4 w-4 shrink-0" /> Model backend offline — start it with{' '}
            <code className="rounded bg-ink-900/60 px-1">uvicorn main:app --app-dir backend --port 8000</code>
          </div>
        )}
      </div>

      {/* RIGHT: preprocessing + identity pattern */}
      <div className="min-h-[360px]">
        <AnimatePresence mode="wait">
          {phase !== 'done' && (
            <motion.div key="build" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="rounded-3xl glass-strong p-6 shadow-float">
              <h3 className="text-lg font-bold text-white">
                {phase === 'profile' ? `Welcome${name.trim() ? `, ${name.trim().split(' ')[0]}` : ''}` : 'Building your palm identity'}
              </h3>
              <p className="mt-1 text-sm text-mist-300">
                Your palm is preprocessed (ROI → CLAHE → vein enhancement) and encoded into a
                128-d biometric template by the trained model. Shown only to you, during enrollment.
              </p>

              {/* preprocessing → pattern */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <StageThumb src={latest?.roi} label="1 · Palm ROI" />
                <StageThumb src={latest?.pattern} label="2 · Identity pattern" accent />
              </div>

              {/* progress */}
              <div className="mt-5">
                <div className="flex items-end justify-between">
                  <span className="text-xs text-mist-300">Biometric samples</span>
                  <span className="text-sm font-bold text-white">{samples.length}/{TARGET}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent" animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
                </div>
                {phase === 'collect' && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-accent">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Auto-capturing — hold your open palm steady
                  </p>
                )}
              </div>

              {/* print/vein security notice */}
              {latest && <SecurityNotice imageType={latest.imageType} secure={latest.secure} />}
            </motion.div>
          )}

          {phase === 'done' && identity && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/[0.08] to-transparent p-6 shadow-float">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
              <div className="relative flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/15">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {identity.thumb && <img src={identity.thumb} alt="Identity pattern" className="h-full w-full object-cover" />}
                </div>
                <div>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-accent"><BadgeCheck className="h-6 w-6" /></span>
                  <h3 className="mt-2 text-2xl font-black text-white">{identity.name}</h3>
                  <p className="text-sm text-mist-300">Enrolled with {identity.embeddings.length} palm samples</p>
                </div>
              </div>

              <div className="relative mt-5 space-y-2.5">
                <IdRow label="Palm ID" value={identity.palmId} onCopy={() => copy(identity.palmId, 'p')} copied={copied === 'p'} />
                <IdRow label="Wallet ID" value={identity.walletId} onCopy={() => copy(identity.walletId, 'w')} copied={copied === 'w'} />
                <IdRow label="Biometric Token" value={identity.token} mono onCopy={() => copy(identity.token, 't')} copied={copied === 't'} />
              </div>

              <SecurityNotice imageType={identity.imageType} secure={identity.secure} />

              <div className="relative mt-5 flex flex-col gap-2 sm:flex-row">
                <GlowButton href="/authenticate" size="md" className="flex-1">Test Login <ArrowRight className="h-4 w-4" /></GlowButton>
                <GlowButton onClick={reset} variant="outline" size="md" className="flex-1">Enroll Another</GlowButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <EnrolledNote />
      </div>
    </div>
  );
}

function SecurityNotice({ imageType, secure }: { imageType: 'print' | 'vein'; secure: boolean }) {
  if (secure) {
    return (
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-accent/25 bg-accent/[0.05] px-3.5 py-3 text-sm">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <div>
          <p className="font-semibold text-accent">Palm-vein verified · spoof-resistant</p>
          <p className="text-xs text-mist-300">Internal vascular pattern captured — secure for payments.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-warn/30 bg-warn/[0.06] px-3.5 py-3 text-sm">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
      <div>
        <p className="font-semibold text-warn">Palm-print only — not fully secure</p>
        <p className="text-xs text-mist-300">
          This is the <strong>external</strong> surface ({imageType}). Add a <strong>palm-vein (NIR)</strong> scan
          as soon as possible — surface prints can be photographed and spoofed.
        </p>
      </div>
    </div>
  );
}

function StageThumb({ src, label, accent }: { src?: string; label: string; accent?: boolean }) {
  return (
    <div className={cn('relative aspect-square overflow-hidden rounded-xl border bg-ink-700', accent ? 'border-accent/40' : 'border-white/10')}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full place-items-center text-xs text-mist-500">{accent ? 'pattern' : 'ROI'}</div>
      )}
      <span className="absolute bottom-1.5 left-1.5 rounded bg-ink-900/70 px-1.5 py-0.5 font-mono text-[9px] uppercase text-mist-100 backdrop-blur">{label}</span>
    </div>
  );
}

function ModelBadge({ online }: { online: boolean | null }) {
  const ok = online === true;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', ok ? 'bg-accent/12 text-accent' : 'bg-white/5 text-mist-400')}>
      <span className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-accent' : online === false ? 'bg-danger' : 'bg-warn animate-pulse')} />
      {ok ? 'Trained model online' : online === false ? 'Model offline' : 'Checking model…'}
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
