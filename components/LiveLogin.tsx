'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Ban, BadgeCheck, Fingerprint, Loader2, RotateCcw, ShieldX } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { WebcamScanner } from '@/components/WebcamScanner';
import { Counter } from '@/components/ui/Counter';
import { GlowButton } from '@/components/ui/GlowButton';
import { useCvWorker } from '@/lib/opencv/useCvWorker';
import { extractCv, identifyCv, grayToDataURL } from '@/lib/opencv/cvClient';
import { IdentifyResult } from '@/lib/opencv/matcher';
import { useBiometrics } from '@/lib/biometricStore';
import { cn } from '@/lib/utils';

type Phase = 'scan' | 'result';

export function LiveLogin() {
  const { ready, loading, error, load } = useCvWorker();
  const hydrate = useBiometrics((s) => s.hydrate);
  const hydrated = useBiometrics((s) => s.hydrated);
  const users = useBiometrics((s) => s.users);

  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>('scan');
  const [probeThumb, setProbeThumb] = useState<string | null>(null);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [bestGood, setBestGood] = useState(0);

  useEffect(() => {
    hydrate();
    load();
  }, [hydrate, load]);

  const matchedUser = result?.best ? users.find((u) => u.id === result.best!.id) : null;

  const handleCapture = useCallback(
    (canvas: HTMLCanvasElement) => {
      if (!ready) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      setBusy(true);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      extractCv(img.data.buffer, canvas.width, canvas.height)
        .then(async (res) => {
          if (res.gray) setProbeThumb(grayToDataURL(res.gray));
          if (!res.desc) return; // unreadable frame — keep scanning
          const { result: r } = await identifyCv(
            res.desc,
            users.map((u) => ({ id: u.id, name: u.name, samples: u.samples }))
          );
          setAttempts((a) => a + 1);
          setBestGood((g) => Math.max(g, r.best?.good ?? 0));
          if (r.matched) {
            setResult(r);
            setPhase('result');
          }
        })
        .catch((e) => console.error(e))
        .finally(() => setBusy(false));
    },
    [ready, users]
  );

  const reset = () => {
    setPhase('scan');
    setResult(null);
    setProbeThumb(null);
    setAttempts(0);
    setBestGood(0);
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/5 p-6 text-sm text-danger">
        Failed to load the on-device vision engine: {error}.
      </div>
    );
  }

  if (hydrated && users.length === 0) {
    return (
      <div className="rounded-3xl glass-strong p-10 text-center shadow-float">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/5 text-mist-300">
          <Fingerprint className="h-7 w-7" />
        </span>
        <h3 className="mt-4 text-lg font-bold text-white">No palms enrolled on this device</h3>
        <p className="mt-1 text-sm text-mist-400">Enroll a palm first — then return here to log in automatically.</p>
        <div className="mt-5 flex justify-center">
          <GlowButton href="/register" size="md">Enroll a Palm <ArrowRight className="h-4 w-4" /></GlowButton>
        </div>
      </div>
    );
  }

  const granted = result?.matched && matchedUser;
  const autoStatus = !ready ? 'Preparing engine…' : `Scanning… ${attempts} attempt${attempts === 1 ? '' : 's'}`;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      {/* camera */}
      <div className="rounded-3xl glass-strong p-5 shadow-float sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-white">Live Palm Login</span>
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', ready ? 'bg-accent/12 text-accent' : 'bg-white/5 text-mist-400')}>
            <span className={cn('h-1.5 w-1.5 rounded-full', ready ? 'bg-accent' : loading ? 'bg-warn animate-pulse' : 'bg-mist-500')} />
            {users.length} enrolled
          </span>
        </div>
        {phase === 'result' ? (
          <div className={cn('grid aspect-[4/3] place-items-center rounded-2xl border', granted ? 'border-accent/30 bg-accent/[0.04]' : 'border-danger/30 bg-danger/[0.04]')}>
            <div className="text-center">
              {granted ? <BadgeCheck className="mx-auto h-10 w-10 text-accent" /> : <ShieldX className="mx-auto h-10 w-10 text-danger" />}
              <p className="mt-2 text-sm font-semibold text-white">{granted ? 'Identity verified' : 'Not recognised'}</p>
            </div>
          </div>
        ) : (
          <WebcamScanner
            onCapture={handleCapture}
            onStart={load}
            auto={phase === 'scan'}
            busy={busy}
            disabled={!ready}
            autoStatus={autoStatus}
          />
        )}
        {loading && (
          <p className="mt-3 flex items-center gap-2 text-xs text-mist-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading on-device vision engine (one-time ~11MB)…
          </p>
        )}
      </div>

      {/* result / live */}
      <div className="min-h-[360px]">
        <AnimatePresence mode="wait">
          {phase === 'scan' && (
            <motion.div
              key="await"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-3xl glass-strong p-6 shadow-float"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                <h3 className="text-lg font-bold text-white">Scanning for a match…</h3>
              </div>
              <p className="mt-1 text-sm text-mist-300">
                Hold your enrolled palm in the frame — PalmPay matches it automatically and grants
                access the instant it recognises you. No buttons.
              </p>

              <div className="mt-5 flex items-center gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-ink-700">
                  {probeThumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={probeThumb} alt="Live scan" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-mist-500">live</div>
                  )}
                </div>
                <div className="flex-1 space-y-2 text-sm">
                  <Row label="Frames matched" value={`${attempts}`} />
                  <Row label="Best similarity" value={`${bestGood} pts`} />
                  <Row label="Threshold" value="14 pts" />
                  {ready ? (
                    <p className="flex items-center gap-1.5 text-xs text-accent">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Live scanning…
                    </p>
                  ) : (
                    <p className="text-xs text-mist-400">Engine warming up…</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className={cn('relative overflow-hidden rounded-3xl border p-6 shadow-float', granted ? 'border-accent/30 bg-gradient-to-br from-accent/[0.08] to-transparent' : 'border-danger/30 bg-gradient-to-br from-danger/[0.07] to-transparent')}
            >
              <div className={cn('absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl', granted ? 'bg-accent/20' : 'bg-danger/20')} />
              <span className={cn('relative inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold', granted ? 'bg-accent/15 text-accent' : 'bg-danger/15 text-danger')}>
                {granted ? <BadgeCheck className="h-4 w-4" /> : <ShieldX className="h-4 w-4" />}
                {granted ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
              </span>

              <div className="relative mt-5 grid grid-cols-2 gap-3">
                <Thumb src={probeThumb} label="Live scan" />
                <Thumb src={matchedUser?.thumb ?? null} label={matchedUser ? matchedUser.name.split(' ')[0] : 'No match'} muted={!granted} />
              </div>

              {granted ? (
                <>
                  <div className="relative mt-5 flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-lg font-black text-ink-900">
                      {matchedUser!.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                    <div>
                      <h3 className="text-xl font-black text-white">{matchedUser!.name}</h3>
                      <p className="font-mono text-xs text-mist-300">{matchedUser!.palmId}</p>
                    </div>
                  </div>
                  <div className="relative mt-5 rounded-2xl border border-white/10 bg-ink-800/50 p-4">
                    <div className="flex items-end justify-between">
                      <span className="text-sm text-mist-300">Match confidence</span>
                      <span className="text-3xl font-black text-accent"><Counter to={result.confidence} decimals={1} duration={1.2} />%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-primary via-secondary to-accent" initial={{ width: 0 }} animate={{ width: `${result.confidence}%` }} transition={{ duration: 1.2 }} />
                    </div>
                    <p className="mt-2 font-mono text-[11px] text-mist-400">{result.best!.good} ORB inliers · runner-up {result.runnerUpGood}</p>
                  </div>
                  <div className="relative mt-5 flex flex-col gap-2 sm:flex-row">
                    <GlowButton href="/wallet" size="md" className="flex-1">Open Wallet <ArrowRight className="h-4 w-4" /></GlowButton>
                    <GlowButton onClick={reset} variant="outline" size="md" className="flex-1"><RotateCcw className="h-4 w-4" /> Scan Again</GlowButton>
                  </div>
                </>
              ) : (
                <>
                  <p className="relative mt-5 text-sm text-mist-300">
                    {result.best ? `Closest template was ${result.best.name} with only ${result.best.good} matching features — below the security threshold.` : 'No palm structure could be read.'}
                  </p>
                  <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/[0.04] px-3 py-2 text-xs text-danger">
                    <Ban className="h-4 w-4" /> Identity not verified — access blocked.
                  </div>
                  <div className="relative mt-5">
                    <GlowButton onClick={reset} size="md" className="w-full"><RotateCcw className="h-4 w-4" /> Scan Again</GlowButton>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-4 text-center text-xs text-mist-500">
          Not enrolled? <Link href="/register" className="text-primary hover:underline">Register a palm</Link>
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-mist-400">{label}</span>
      <span className="font-mono font-semibold text-white">{value}</span>
    </div>
  );
}

function Thumb({ src, label, muted }: { src: string | null; label: string; muted?: boolean }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-ink-700">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className={cn('h-full w-full object-cover', muted && 'opacity-30 grayscale')} />
      ) : (
        <div className="grid h-full place-items-center text-xs text-mist-500">—</div>
      )}
      <span className="absolute bottom-1.5 left-1.5 rounded-md bg-ink-900/70 px-2 py-0.5 font-mono text-[10px] uppercase text-mist-100 backdrop-blur">{label}</span>
    </div>
  );
}
