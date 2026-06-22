'use client';

import {
  Activity,
  CheckCircle2,
  Clock,
  Crosshair,
  Gauge,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Counter } from '@/components/ui/Counter';
import { GlassCard } from '@/components/ui/GlassCard';
import { RadialGauge } from '@/components/ui/RadialGauge';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { CategoryBars, GrowthArea, LatencyLine } from '@/components/charts/Charts';
import { GROWTH, LATENCY, MERCHANTS, METRICS } from '@/lib/mockData';
import { inr } from '@/lib/utils';

export default function AnalyticsPage() {
  const topMerchants = [...MERCHANTS].sort((a, b) => b.volume - a.volume).slice(0, 6);

  return (
    <PageShell particles={18} seed={29}>
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <SectionHeading
          align="left"
          eyebrow="Analytics"
          title={
            <>
              The business of <span className="text-gradient">invisible payments.</span>
            </>
          }
          subtitle="A live look at PalmPay’s network — growth, reliability and biometric accuracy at scale."
        />

        {/* KPI row */}
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Kpi icon={<Users className="h-5 w-5" />} label="Users enrolled" value={<Counter to={METRICS.usersEnrolled} group />} glow="cyan" />
          <Kpi icon={<Activity className="h-5 w-5" />} label="Transactions" value={<><Counter to={5.12} decimals={2} />M</>} glow="purple" />
          <Kpi icon={<CheckCircle2 className="h-5 w-5" />} label="Success rate" value={<><Counter to={METRICS.successRate} decimals={1} />%</>} glow="green" />
          <Kpi icon={<Clock className="h-5 w-5" />} label="Avg payment time" value={<><Counter to={METRICS.avgPaymentMs} />ms</>} glow="cyan" />
        </div>

        {/* charts */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Network Growth</h3>
              <div className="flex gap-3 text-xs">
                <Legend color="#7B61FF" label="Users" />
                <Legend color="#00FFA3" label="Transactions" />
              </div>
            </div>
            <div className="mt-4 h-64">
              <GrowthArea data={GROWTH} />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="font-bold text-white">Biometric Accuracy</h3>
            <div className="mt-3 grid place-items-center">
              <RadialGauge value={99.31} max={100} size={150} label="accuracy" suffix="%" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <AccuracyTile label="False Acceptance" value="0.0008%" detail="FAR · 1 in 125k" tone="text-accent" />
              <AccuracyTile label="False Rejection" value="0.42%" detail="FRR · retry succeeds" tone="text-primary" />
            </div>
          </GlassCard>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-6">
            <h3 className="font-bold text-white">Monthly Transaction Volume</h3>
            <div className="mt-4 h-56">
              <CategoryBars data={GROWTH.slice(6)} />
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Authentication Latency · 24h</h3>
              <span className="chip border-accent/25 text-accent">
                <Gauge className="h-3.5 w-3.5" /> p50 740ms
              </span>
            </div>
            <div className="mt-4 h-56">
              <LatencyLine data={LATENCY} />
            </div>
          </GlassCard>
        </div>

        {/* secondary KPIs */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Kpi icon={<UserCheck className="h-5 w-5" />} label="Auth accuracy" value={<><Counter to={METRICS.authAccuracy} decimals={2} />%</>} glow="green" />
          <Kpi icon={<Crosshair className="h-5 w-5" />} label="False accept rate" value={<><Counter to={0.0008} decimals={4} />%</>} glow="cyan" />
          <Kpi icon={<Crosshair className="h-5 w-5" />} label="False reject rate" value={<><Counter to={0.42} decimals={2} />%</>} glow="purple" />
          <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Network uptime" value={<><Counter to={99.99} decimals={2} />%</>} glow="green" />
        </div>

        {/* top merchants */}
        <GlassCard className="mt-6 overflow-hidden p-6">
          <h3 className="mb-4 font-bold text-white">Top Merchants by Volume</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-mist-400">
                  <th className="pb-3 font-medium">Merchant</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">City</th>
                  <th className="pb-3 text-center font-medium">Terminals</th>
                  <th className="pb-3 text-right font-medium">Volume</th>
                </tr>
              </thead>
              <tbody>
                {topMerchants.map((m) => (
                  <tr key={m.id} className="border-t border-white/5 transition-colors hover:bg-white/[0.02]">
                    <td className="py-3 font-semibold text-white">{m.name}</td>
                    <td className="py-3 text-mist-300">{m.category}</td>
                    <td className="py-3 text-mist-300">{m.city}</td>
                    <td className="py-3 text-center text-mist-300">{m.terminals}</td>
                    <td className="py-3 text-right font-bold text-accent">{inr(m.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </PageShell>
  );
}

function Kpi({ icon, label, value, glow }: { icon: React.ReactNode; label: string; value: React.ReactNode; glow: 'cyan' | 'purple' | 'green' }) {
  return (
    <GlassCard interactive glow={glow} className="p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-primary">{icon}</span>
      <p className="mt-3 text-xs uppercase tracking-wider text-mist-400">{label}</p>
      <div className="text-2xl font-black tracking-tight text-white sm:text-3xl">{value}</div>
    </GlassCard>
  );
}

function AccuracyTile({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <p className="text-[11px] uppercase tracking-wider text-mist-400">{label}</p>
      <p className={`text-lg font-black ${tone}`}>{value}</p>
      <p className="text-[11px] text-mist-500">{detail}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-mist-300">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
