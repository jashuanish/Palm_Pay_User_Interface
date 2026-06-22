'use client';

import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  ScanLine,
  ShieldCheck,
  TrendingUp,
  Wallet as WalletIcon,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { PalmCard } from '@/components/PalmCard';
import { Counter } from '@/components/ui/Counter';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { RadialGauge } from '@/components/ui/RadialGauge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SpendArea, Donut } from '@/components/charts/Charts';
import { usePalmStore } from '@/lib/store';
import {
  AUTH_LOGS,
  CATEGORY_SPLIT,
  PRIMARY_USER,
  SPEND_TREND,
  TRANSACTIONS,
} from '@/lib/mockData';
import { inr, timeAgo } from '@/lib/utils';

export default function WalletPage() {
  const balance = usePalmStore((s) => s.balance);
  const monthlySpend = usePalmStore((s) => s.monthlySpend);
  const ledger = usePalmStore((s) => s.ledger);
  const topUp = usePalmStore((s) => s.topUp);
  const u = PRIMARY_USER;

  const recent = [
    ...ledger,
    ...TRANSACTIONS.filter((t) => t.status === 'success').slice(0, 6),
  ].slice(0, 7);

  return (
    <PageShell particles={22} seed={5}>
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        {/* header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-mist-400">Welcome back</p>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              {u.name.split(' ')[0]}’s Wallet
            </h1>
          </div>
          <div className="flex gap-2">
            <GlowButton onClick={() => topUp(5000)} variant="outline" size="sm">
              <Plus className="h-4 w-4" /> Top up ₹5,000
            </GlowButton>
            <GlowButton href="/store" size="sm">
              <ScanLine className="h-4 w-4" /> Pay with Palm
            </GlowButton>
          </div>
        </div>

        {/* top grid */}
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_1.4fr]">
          <PalmCard name={u.name} walletId={u.walletId} balance={balance} tier={u.tier} />

          <div className="grid grid-cols-2 gap-4">
            <Tile
              icon={<WalletIcon className="h-5 w-5" />}
              label="Current Balance"
              value={<><span className="text-lg align-top">₹</span><Counter to={balance} /></>}
              sub="Available to spend"
              glow="cyan"
            />
            <Tile
              icon={<TrendingUp className="h-5 w-5" />}
              label="Monthly Spending"
              value={<><span className="text-lg align-top">₹</span><Counter to={monthlySpend} /></>}
              sub="June 2026"
              glow="purple"
            />
            <Tile
              icon={<ArrowUpRight className="h-5 w-5" />}
              label="Transactions"
              value={<Counter to={284} />}
              sub="Lifetime"
              glow="green"
            />
            <GlassCard interactive glow="cyan" className="flex items-center justify-between gap-2 p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-mist-300">Security Score</p>
                <p className="mt-1 text-xs text-accent">Excellent · biometric locked</p>
              </div>
              <RadialGauge value={u.securityScore} size={92} label="score" />
            </GlassCard>
          </div>
        </div>

        {/* charts */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Spending Trend</h3>
              <span className="chip">Last 6 months</span>
            </div>
            <div className="mt-4 h-64">
              <SpendArea data={SPEND_TREND} fmt={(v) => inr(v)} />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="font-bold text-white">Category Split</h3>
            <div className="relative mt-2 h-44">
              <Donut data={CATEGORY_SPLIT} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {CATEGORY_SPLIT.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-mist-200">
                    <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <span className="font-semibold text-white">{c.value}%</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* recent + auth */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <GlassCard className="p-6">
            <h3 className="mb-4 font-bold text-white">Recent Payments</h3>
            <div className="space-y-1.5">
              {recent.map((t, i) => (
                <motion.div
                  key={t.id + i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/[0.03]"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-danger/10 text-danger">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{t.merchant}</p>
                    <p className="text-xs text-mist-400">{t.category} · {timeAgo(t.minutesAgo * 60000)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">- {inr(t.amount)}</p>
                    <p className="font-mono text-[11px] text-accent">{t.confidence.toFixed(2)}%</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-white">
              <ShieldCheck className="h-4 w-4 text-accent" /> Authentication History
            </h3>
            <div className="space-y-2.5">
              {AUTH_LOGS.slice(0, 6).map((a, i) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className={`grid h-8 w-8 place-items-center rounded-lg ${
                    a.result === 'matched' ? 'bg-accent/10 text-accent' : a.result === 'review' ? 'bg-warn/10 text-warn' : 'bg-danger/10 text-danger'
                  }`}>
                    <ScanLine className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-mist-100">{a.device}</p>
                    <p className="text-[11px] text-mist-400">{timeAgo(a.minutesAgo * 60000)}</p>
                  </div>
                  <StatusBadge tone={a.result === 'matched' ? 'success' : a.result === 'review' ? 'warn' : 'declined'} dot={false}>
                    {a.confidence.toFixed(1)}%
                  </StatusBadge>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}

function Tile({ icon, label, value, sub, glow }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub: string; glow: 'cyan' | 'purple' | 'green' }) {
  return (
    <GlassCard interactive glow={glow} className="p-4">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-primary">{icon}</span>
      <p className="mt-3 text-xs font-medium uppercase tracking-wider text-mist-300">{label}</p>
      <div className="mt-1 text-2xl font-black tracking-tight text-white">{value}</div>
      <p className="text-xs text-mist-400">{sub}</p>
    </GlassCard>
  );
}
