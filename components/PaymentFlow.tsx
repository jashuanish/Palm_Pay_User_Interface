'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Check, Hand, ScanLine, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Confetti } from '@/components/Confetti';
import { ProcessingStages, Stage } from '@/components/ProcessingStages';
import { GlowButton } from '@/components/ui/GlowButton';
import { Transaction } from '@/lib/types';
import { playScan, playSuccess } from '@/lib/sound';
import { inr } from '@/lib/utils';
import { PRIMARY_USER } from '@/lib/mockData';

type Phase = 'place' | 'processing' | 'success';

interface PaymentFlowProps {
  open: boolean;
  amount: number;
  merchant: string;
  items?: { name: string; qty: number; price: number }[];
  onCharge: () => Transaction;
  onClose: () => void;
}

const STAGES: Stage[] = [
  { key: 'auth', label: 'Authenticating identity', detail: 'Palm vein match · 98.72% confidence', ms: 1200 },
  { key: 'bal', label: 'Verifying balance', detail: 'Checking available funds & risk score', ms: 1000 },
  { key: 'appr', label: 'Authorizing transaction', detail: 'Signing with biometric token', ms: 1100 },
];

export function PaymentFlow({ open, amount, merchant, items = [], onCharge, onClose }: PaymentFlowProps) {
  const [phase, setPhase] = useState<Phase>('place');
  const [tx, setTx] = useState<Transaction | null>(null);
  // Freeze the amount + items at scan time — the live cart empties on charge,
  // so the processing/success/receipt views must read the snapshot, not props.
  const [frozen, setFrozen] = useState<{ amount: number; items: PaymentFlowProps['items'] }>({
    amount,
    items,
  });

  useEffect(() => {
    if (open) {
      setPhase('place');
      setTx(null);
      setFrozen({ amount, items });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const startScan = () => {
    setFrozen({ amount, items });
    playScan();
    setPhase('processing');
  };

  const complete = () => {
    const t = onCharge();
    setTx(t);
    setPhase('success');
    playSuccess();
  };

  const shownAmount = phase === 'place' ? amount : frozen.amount;
  const shownItems = phase === 'place' ? items : frozen.items ?? [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center bg-ink-900/85 p-4 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.94, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 20 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl glass-strong p-7 shadow-float"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-mist-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <AnimatePresence mode="wait">
              {/* ---- PLACE PALM ---- */}
              {phase === 'place' && (
                <motion.div
                  key="place"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <p className="text-xs font-semibold uppercase tracking-widest text-mist-400">
                    {merchant}
                  </p>
                  <p className="mt-2 text-4xl font-black tracking-tight text-white">{inr(shownAmount)}</p>

                  <button onClick={startScan} className="group relative mx-auto mt-8 grid h-44 w-44 place-items-center">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="absolute h-44 w-44 rounded-full border border-primary/40 animate-pulse-ring"
                        style={{ animationDelay: `${i * 0.8}s` }}
                      />
                    ))}
                    <span className="absolute h-36 w-36 rounded-full bg-primary/10 blur-xl transition-all group-hover:bg-primary/20" />
                    <span className="relative grid h-32 w-32 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-ink-600 to-ink-800 shadow-glow transition-transform group-hover:scale-105 group-active:scale-95">
                      <Hand className="h-14 w-14 text-primary" />
                    </span>
                  </button>

                  <p className="mt-8 text-lg font-bold text-white">Place Palm to Pay</p>
                  <p className="mt-1 text-sm text-mist-400">
                    Tap the scanner — no phone, no card, no PIN.
                  </p>
                </motion.div>
              )}

              {/* ---- PROCESSING ---- */}
              {phase === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mb-5 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                      <ScanLine className="h-5 w-5 animate-pulse" />
                    </span>
                    <div>
                      <h3 className="font-bold text-white">Processing payment…</h3>
                      <p className="text-xs text-mist-400">{merchant} · {inr(shownAmount)}</p>
                    </div>
                  </div>
                  <ProcessingStages stages={STAGES} running onComplete={complete} />
                </motion.div>
              )}

              {/* ---- SUCCESS ---- */}
              {phase === 'success' && tx && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative text-center"
                >
                  <Confetti count={90} />

                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 12 }}
                    className="relative mx-auto grid h-24 w-24 place-items-center rounded-full bg-accent/15"
                  >
                    <span className="absolute inset-0 rounded-full bg-accent/30 blur-xl" />
                    <span className="relative grid h-16 w-16 place-items-center rounded-full bg-brand-gradient shadow-glow-green">
                      <Check className="h-9 w-9 text-ink-900" strokeWidth={3} />
                    </span>
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-5 text-2xl font-black text-white"
                  >
                    Payment Completed
                  </motion.h3>
                  <p className="mt-1 text-sm text-mist-300">
                    <span className="font-semibold text-accent">{inr(shownAmount)}</span> paid to {merchant}
                  </p>

                  {/* digital receipt */}
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mt-6 rounded-2xl border border-white/10 bg-ink-800/60 p-4 text-left"
                  >
                    <div className="flex items-center justify-between border-b border-dashed border-white/10 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-mist-400">Receipt</span>
                      <BadgeCheck className="h-4 w-4 text-accent" />
                    </div>
                    {shownItems.length > 0 && (
                      <div className="space-y-1.5 py-3">
                        {shownItems.map((it, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-mist-200">{it.qty}× {it.name}</span>
                            <span className="text-white">{inr(it.price * it.qty)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold">
                      <span className="text-mist-200">Total</span>
                      <span className="text-white">{inr(shownAmount)}</span>
                    </div>
                    <div className="mt-3 space-y-1 text-[11px] text-mist-400">
                      <Row k="Paid by" v={PRIMARY_USER.name} />
                      <Row k="Method" v="Palm vein biometric" />
                      <Row k="Transaction" v={tx.id} mono />
                      <Row k="Confidence" v="98.72%" />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-5 flex gap-2"
                  >
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
    <div className="flex justify-between">
      <span>{k}</span>
      <span className={mono ? 'font-mono text-mist-200' : 'text-mist-200'}>{v}</span>
    </div>
  );
}
