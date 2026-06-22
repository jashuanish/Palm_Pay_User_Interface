'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Ban,
  Brain,
  Clock,
  IndianRupee,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Counter } from '@/components/ui/Counter';
import { GlassCard } from '@/components/ui/GlassCard';
import { RadialGauge } from '@/components/ui/RadialGauge';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FraudArea } from '@/components/charts/Charts';
import { FRAUD_ALERTS, FRAUD_BEHAVIOUR } from '@/lib/mockData';
import { inr, timeAgo } from '@/lib/utils';

const RISK_FACTORS = [
  { label: 'Amount vs. 30-day average', weight: 38, detail: '23.8× baseline' },
  { label: 'Merchant novelty', weight: 22, detail: 'First-time merchant' },
  { label: 'Time-of-day anomaly', weight: 18, detail: '03:14 — unusual' },
  { label: 'Velocity', weight: 14, detail: '2 attempts / 40s' },
  { label: 'Device trust', weight: 8, detail: 'Known terminal' },
];

const sevTone: Record<string, string> = {
  critical: 'bg-danger/15 text-danger border-danger/30',
  high: 'bg-warn/15 text-warn border-warn/30',
  medium: 'bg-primary/15 text-primary border-primary/30',
  low: 'bg-accent/15 text-accent border-accent/30',
};

export default function FraudPage() {
  return (
    <PageShell particles={20} seed={17}>
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <SectionHeading
          align="left"
          eyebrow="AI Fraud Detection"
          title={
            <>
              An AI that knows <span className="text-gradient">how you spend.</span>
            </>
          }
          subtitle="Every transaction is scored in real time against your behavioural baseline. Anomalies are flagged before money moves."
        />

        {/* top metrics */}
        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Metric icon={<Brain className="h-5 w-5" />} label="Transactions scored" value={<Counter to={5128740} group />} sub="today" />
          <Metric icon={<ShieldAlert className="h-5 w-5" />} label="Alerts raised" value={<Counter to={1284} />} sub="last 24h" tone="warn" />
          <Metric icon={<Ban className="h-5 w-5" />} label="Fraud blocked" value={<><span className="text-lg">₹</span><Counter to={4.2} decimals={1} />Cr</>} sub="this month" tone="danger" />
          <Metric icon={<Sparkles className="h-5 w-5" />} label="Model precision" value={<><Counter to={99.2} decimals={1} />%</>} sub="AUC 0.991" tone="accent" />
        </div>

        {/* featured anomaly */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <GlassCard className="relative overflow-hidden p-6">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-danger/15 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full border border-danger/30 bg-danger/10 px-3 py-1 text-sm font-bold text-danger">
                <AlertTriangle className="h-4 w-4" /> Anomaly Detected
              </span>
              <span className="text-xs text-mist-400">Aarav Sharma · {timeAgo(4 * 60000)}</span>
            </div>

            <div className="relative mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-ink-800/50 p-4">
                <p className="text-xs uppercase tracking-wider text-mist-400">Usual spend</p>
                <p className="mt-1 text-3xl font-black text-white">{inr(200)}</p>
                <p className="text-xs text-mist-400">30-day average</p>
              </div>
              <div className="rounded-2xl border border-danger/30 bg-danger/[0.06] p-4">
                <p className="text-xs uppercase tracking-wider text-danger/80">This attempt</p>
                <p className="mt-1 text-3xl font-black text-danger">{inr(5000)}</p>
                <p className="text-xs text-danger/70">23.8× higher</p>
              </div>
            </div>

            <div className="relative mt-5">
              <p className="mb-3 text-sm font-semibold text-white">Behaviour graph · 14-day spend</p>
              <div className="h-44">
                <FraudArea data={FRAUD_BEHAVIOUR} fmt={(v) => inr(v)} />
              </div>
            </div>

            <div className="relative mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/15 px-3 py-1 text-sm font-bold text-danger">
                <Ban className="h-4 w-4" /> Transaction blocked
              </span>
              <span className="chip">Step-up auth required</span>
              <span className="chip">User notified</span>
            </div>
          </GlassCard>

          {/* risk score */}
          <GlassCard className="flex flex-col p-6">
            <h3 className="font-bold text-white">AI Risk Score</h3>
            <div className="my-6 grid place-items-center">
              <div className="relative">
                <RadialGauge value={92} size={180} label="risk" />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-danger/15 px-3 py-0.5 text-xs font-bold text-danger">
                  HIGH RISK
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {RISK_FACTORS.map((f, i) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-mist-200">{f.label}</span>
                    <span className="font-semibold text-white">{f.weight}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-warn to-danger"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${f.weight * 2.4}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                    />
                  </div>
                  <p className="mt-0.5 text-[11px] text-mist-500">{f.detail}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* timeline */}
        <GlassCard className="mt-6 p-6">
          <h3 className="mb-5 flex items-center gap-2 font-bold text-white">
            <Clock className="h-4 w-4 text-primary" /> Suspicious Activity Timeline
          </h3>
          <div className="relative space-y-4 pl-6">
            <div className="absolute bottom-2 left-[7px] top-2 w-px bg-white/10" />
            {FRAUD_ALERTS.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative"
              >
                <span className={`absolute -left-[22px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-ink-900 ${
                  a.severity === 'critical' || a.severity === 'high' ? 'bg-danger' : a.severity === 'medium' ? 'bg-warn' : 'bg-accent'
                }`} />
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{a.userName}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${sevTone[a.severity]}`}>
                        {a.severity}
                      </span>
                    </div>
                    <span className="text-xs text-mist-400">{timeAgo(a.minutesAgo * 60000)}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-mist-200">{a.reason}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                    <span className="text-mist-400">Attempt: <span className="font-semibold text-white">{inr(a.amount)}</span></span>
                    <span className="text-mist-400">Usual: <span className="font-semibold text-white">{inr(a.usualAmount)}</span></span>
                    <span className="text-mist-400">Risk: <span className={`font-semibold ${a.riskScore > 80 ? 'text-danger' : a.riskScore > 60 ? 'text-warn' : 'text-accent'}`}>{a.riskScore}/100</span></span>
                    <span className={`ml-auto inline-flex items-center gap-1 font-semibold ${
                      a.status === 'blocked' ? 'text-danger' : a.status === 'cleared' ? 'text-accent' : 'text-warn'
                    }`}>
                      {a.status === 'cleared' ? <ShieldCheck className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
                      {a.status}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}

function Metric({ icon, label, value, sub, tone = 'cyan' }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub: string; tone?: string }) {
  const tones: Record<string, string> = {
    cyan: 'text-primary',
    warn: 'text-warn',
    danger: 'text-danger',
    accent: 'text-accent',
  };
  return (
    <GlassCard interactive className="p-5">
      <span className={`grid h-10 w-10 place-items-center rounded-xl bg-white/5 ${tones[tone]}`}>{icon}</span>
      <p className="mt-3 text-xs uppercase tracking-wider text-mist-400">{label}</p>
      <div className="text-2xl font-black text-white">{value}</div>
      <p className="text-xs text-mist-500">{sub}</p>
    </GlassCard>
  );
}
