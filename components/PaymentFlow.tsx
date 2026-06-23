'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Check, Fingerprint, Loader2, ScanLine, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Confetti } from '@/components/Confetti';
import { ProcessingStages, Stage } from '@/components/ProcessingStages';
import { WebcamScanner } from '@/components/WebcamScanner';
import { GlowButton } from '@/components/ui/GlowButton';
import { Transaction } from '@/lib/types';
import { playScan, playSuccess } from '@/lib/sound';
import { inr } from '@/lib/utils';
import { PRIMARY_USER } from '@/lib/mockData';
import { analyzePalm, identify, MATCH_THRESHOLD } from '@/lib/palm/palmApi';
import { useBiometrics } from '@/lib/biometricStore';

type Phase = 'auth' | 'processing' | 'success';

interface PaymentFlowProps {
  open: boolean;
  amount: number;
  merchant: string;
  items?: { name: string; qty: number; price: number }[];
  onCharge: () => Transaction;
  onClose: () => void;
}

const STAGES: Stage[] = [
  { key: 'bal', label: 'Verifying balance', detail: 'Checking available funds & risk score', ms: 900 },
  { key: 'appr', label: 'Authorizing transaction', detail: 'Signing with biometric token', ms: 1000 },
];

export function PaymentFlow({ open, amount, merchant, items = [], onCharge, onClose }: PaymentFlowProps) {
  const hydrate = useBiometrics((s) => s.hydrate);
  const hydrated = useBiometrics((s) => s.hydrated);
  const users = useBiometrics((s) => s.users);

  const [phase, setPhase] = useState<Phase>('auth');
  const [tx, setTx] = useState<Transaction | null>(null);
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [bestSim, setBestSim] = useState(0);
  const [payer, setPayer] = useState<{ name: string; palmId: string; confidence: number; imageType: 'print' | 'vein' } | null>(null);
  const [frozen, setFrozen] = useState<{ amount: number; items: PaymentFlowProps['items'] }>({ amount, items });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (open) {
      setPhase('auth');
      setTx(null);
      setAttempts(0);
      setBestSim(0);
      setPayer(null);
      setFrozen({ amount, items });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const complete = useCallback(() => {
    const t = onCharge();
    setTx(t);
    setPhase('success');
    playSuccess();
  }, [onCharge]);

  const handleCapture = useCallback((canvas: HTMLCanvasElement) => {
    setBusy(true);
    analyzePalm(canvas)
      .then((a) => {
        setAttempts((n) => n + 1);
        const r = identify(a.embedding, users.map((u) => ({ id: u.id, name: u.name, embeddings: u.embeddings })));
        setBestSim((s) => Math.max(s, r.best?.similarity ?? 0));
        if (r.matched && r.best) {
          const u = users.find((x) => x.id === r.best!.id);
          setPayer({ name: u?.name ?? r.best.name, palmId: u?.palmId ?? '', confidence: r.confidence, imageType: a.imageType });
          setFrozen({ amount, items });
          playScan();
          setPhase('processing');
        }
      })
      .catch(() => {})
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, amount, items]);

  const shownAmount = frozen.amount;
  const shownItems = frozen.items ?? [];
  const noEnrolled = hydrated && users.length === 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center bg-ink-900/85 p-4 backdrop-blur-xl">
          <motion.div initial={{ scale: 0.94, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.94, y: 20 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl glass-strong p-6 shadow-float">
            <button onClick={onClose} className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-mist-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Close">
              <X className="h-4 w-4" />
            </button>

            <AnimatePresence mode="wait">
              {/* ---- AUTHENTICATE (live palm) ---- */}
              {phase === 'auth' && (
                <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-center text-xs font-semibold uppercase tracking-widest text-mist-400">{merchant}</p>
                  <p className="mt-1 text-center text-4xl font-black tracking-tight text-white">{inr(shownAmount)}</p>
                  <p className="mt-1 text-center text-sm font-semibold text-primary">Place your palm to pay</p>

                  {noEnrolled ? (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-ink-800/40 p-8 text-center">
                      <Fingerprint className="mx-auto h-9 w-9 text-mist-300" />
                      <p className="mt-3 text-sm font-semibold text-white">No palm enrolled on this device</p>
                      <p className="mt-1 text-xs text-mist-400">Register a profile first to pay with your palm.</p>
                      <div className="mt-4 flex justify-center">
                        <GlowButton href="/register" size="sm">Register a Profile</GlowButton>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <WebcamScanner onCapture={handleCapture} auto busy={busy} autoStatus={`Authenticating… ${attempts} scan${attempts === 1 ? '' : 's'}`} />
                      <p className="mt-3 text-center font-mono text-[11px] text-mist-400">
                        best match {(bestSim * 100).toFixed(1)}% · need {(MATCH_THRESHOLD * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ---- PROCESSING ---- */}
              {phase === 'processing' && (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="mb-4 flex items-center gap-3 rounded-xl border border-accent/25 bg-accent/[0.05] p-3">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent"><BadgeCheck className="h-5 w-5" /></span>
                    <div>
                      <p className="text-sm font-bold text-white">Identity verified · {payer?.name}</p>
                      <p className="text-xs text-mist-400">Palm match {payer?.confidence.toFixed(1)}% · {inr(shownAmount)} to {merchant}</p>
                    </div>
                  </div>
                  <ProcessingStages stages={STAGES} running onComplete={complete} />
                </motion.div>
              )}

              {/* ---- SUCCESS ---- */}
              {phase === 'success' && tx && (
                <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative text-center">
                  <Confetti count={90} />
                  <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 12 }} className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-accent/15">
                    <span className="absolute inset-0 rounded-full bg-accent/30 blur-xl" />
                    <span className="relative grid h-16 w-16 place-items-center rounded-full bg-brand-gradient shadow-glow-green"><Check className="h-9 w-9 text-ink-900" strokeWidth={3} /></span>
                  </motion.div>
                  <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5 text-2xl font-black text-white">Payment Completed</motion.h3>
                  <p className="mt-1 text-sm text-mist-300"><span className="font-semibold text-accent">{inr(shownAmount)}</span> paid to {merchant}</p>

                  <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-6 rounded-2xl border border-white/10 bg-ink-800/60 p-4 text-left">
                    <div className="flex items-center justify-between border-b border-dashed border-white/10 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-mist-400">Receipt</span>
                      <BadgeCheck className="h-4 w-4 text-accent" />
                    </div>
                    {shownItems.length > 0 && (
                      <div className="space-y-1.5 py-3">
                        {shownItems.map((it, i) => (
                          <div key={i} className="flex justify-between text-sm"><span className="text-mist-200">{it.qty}× {it.name}</span><span className="text-white">{inr(it.price * it.qty)}</span></div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold"><span className="text-mist-200">Total</span><span className="text-white">{inr(shownAmount)}</span></div>
                    <div className="mt-3 space-y-1 text-[11px] text-mist-400">
                      <Row k="Paid by" v={payer?.name ?? PRIMARY_USER.name} />
                      <Row k="Method" v={payer?.imageType === 'vein' ? 'Palm vein (secure)' : 'Palm print biometric'} />
                      <Row k="Transaction" v={tx.id} mono />
                      <Row k="Match confidence" v={`${(payer?.confidence ?? 98.7).toFixed(1)}%`} />
                    </div>
                  </motion.div>

                  {payer?.imageType === 'vein' ? (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent"><ShieldCheck className="h-3.5 w-3.5" /> Secured by internal palm-vein</p>
                  ) : (
                    <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-warn"><ShieldAlert className="h-3.5 w-3.5" /> Palm-print auth — add vein for high-value payments</p>
                  )}

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-5 flex gap-2">
                    <GlowButton href="/wallet" size="md" className="flex-1">View Wallet</GlowButton>
                    <GlowButton onClick={onClose} variant="outline" size="md" className="flex-1">Done</GlowButton>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between"><span>{k}</span><span className={mono ? 'font-mono text-mist-200' : 'text-mist-200'}>{v}</span></div>
  );
}
