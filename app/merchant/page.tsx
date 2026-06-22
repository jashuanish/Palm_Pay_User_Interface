'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Delete, IndianRupee, Radio, Store, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { PaymentFlow } from '@/components/PaymentFlow';
import { Counter } from '@/components/ui/Counter';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePalmStore } from '@/lib/store';
import { TRANSACTIONS } from '@/lib/mockData';
import { Transaction } from '@/lib/types';
import { inr, timeAgo } from '@/lib/utils';

const MERCHANT = 'Aurora Mart';
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'del'];

export default function MerchantPage() {
  const charge = usePalmStore((s) => s.charge);
  const [amount, setAmount] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [feed, setFeed] = useState<Transaction[]>(() =>
    TRANSACTIONS.filter((t) => t.status === 'success').slice(0, 8)
  );

  const numericAmount = parseInt(amount || '0', 10);

  const press = (k: string) => {
    if (k === 'del') return setAmount((a) => a.slice(0, -1));
    if (amount.length >= 7) return;
    setAmount((a) => (a === '0' ? k : a + k));
  };

  const onCharge = () => {
    const tx = charge(numericAmount, MERCHANT);
    setFeed((f) => [{ ...tx, userName: 'Aarav Sharma', minutesAgo: 0 }, ...f].slice(0, 12));
    setAmount('');
    return tx;
  };

  const todayVolume = feed.reduce((s, t) => s + t.amount, 0);

  return (
    <PageShell particles={18} seed={13} footer={false}>
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <SectionHeading
          align="left"
          eyebrow="Merchant Terminal"
          title={
            <>
              Collect payments with <span className="text-gradient">a wave, not a swipe.</span>
            </>
          }
          subtitle="Enter an amount, request payment, and let the customer authorize with their palm. Confirmation lands in real time."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* POS terminal */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-ink-900">
                  <Store className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{MERCHANT}</p>
                  <p className="text-[11px] text-mist-400">Terminal · PP-Aurora-07</p>
                </div>
              </div>
              <StatusBadge tone="success">Online</StatusBadge>
            </div>

            {/* amount display */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-ink-800/60 p-6 text-center">
              <p className="text-xs uppercase tracking-widest text-mist-400">Amount to charge</p>
              <div className="mt-2 flex items-center justify-center text-5xl font-black tracking-tight text-white">
                <IndianRupee className="h-8 w-8 text-mist-300" />
                <span>{numericAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* keypad */}
            <div className="mt-5 grid grid-cols-3 gap-2.5">
              {KEYS.map((k) => (
                <motion.button
                  key={k}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => press(k)}
                  className="grid h-14 place-items-center rounded-xl border border-white/8 bg-white/[0.03] text-lg font-bold text-white transition-colors hover:bg-white/[0.08]"
                >
                  {k === 'del' ? <Delete className="h-5 w-5 text-mist-300" /> : k}
                </motion.button>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              {[100, 500, 1000].map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(String(q))}
                  className="flex-1 rounded-lg border border-white/10 py-2 text-sm font-medium text-mist-200 transition-colors hover:bg-white/5"
                >
                  ₹{q}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <GlowButton
                size="lg"
                className="w-full"
                disabled={numericAmount <= 0}
                onClick={() => setRequesting(true)}
              >
                <Radio className="h-4 w-4" /> Request Payment
              </GlowButton>
            </div>
          </GlassCard>

          {/* live feed + stats */}
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <MiniStat label="Today" value={<><span className="text-base">₹</span><Counter to={todayVolume} /></>} icon={<TrendingUp className="h-4 w-4" />} />
              <MiniStat label="Payments" value={<Counter to={feed.length} />} icon={<Activity className="h-4 w-4" />} />
              <MiniStat label="Avg ticket" value={<><span className="text-base">₹</span><Counter to={Math.round(todayVolume / Math.max(1, feed.length))} /></>} icon={<IndianRupee className="h-4 w-4" />} />
            </div>

            <GlassCard className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-white">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  Live Transaction Feed
                </h3>
              </div>
              <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {feed.map((t, i) => (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: -12, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.4 }}
                      className={`flex items-center gap-3 rounded-xl border p-3 ${
                        i === 0 && t.minutesAgo === 0
                          ? 'border-accent/30 bg-accent/[0.05]'
                          : 'border-white/8 bg-white/[0.02]'
                      }`}
                    >
                      <span
                        className="grid h-9 w-9 place-items-center rounded-lg text-xs font-black text-ink-900"
                        style={{ background: 'linear-gradient(135deg,#00E5FF,#7B61FF)' }}
                      >
                        {t.userName.split(' ').map((n) => n[0]).join('')}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{t.userName}</p>
                        <p className="text-xs text-mist-400">
                          Palm auth · {t.confidence.toFixed(2)}% · {timeAgo(t.minutesAgo * 60000)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-accent">+ {inr(t.amount)}</p>
                        <StatusBadge tone="success" dot={false} className="mt-0.5">paid</StatusBadge>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      <PaymentFlow
        open={requesting}
        amount={numericAmount}
        merchant={MERCHANT}
        onCharge={onCharge}
        onClose={() => setRequesting(false)}
      />
    </PageShell>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: React.ReactNode; icon: React.ReactNode }) {
  return (
    <GlassCard className="p-4">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-primary">{icon}</span>
      <p className="mt-2 text-[11px] uppercase tracking-wider text-mist-400">{label}</p>
      <div className="text-xl font-black text-white">{value}</div>
    </GlassCard>
  );
}
