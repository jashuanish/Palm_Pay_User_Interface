'use client';

import { motion } from 'framer-motion';
import {
  BadgeCheck,
  Cpu,
  Fingerprint,
  Network,
  ScanLine,
  Server,
  Store,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Counter } from '@/components/ui/Counter';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { cn } from '@/lib/utils';

const NODES = [
  { icon: ScanLine, title: 'Palm Scanner', detail: 'NIR capture · 850nm', metric: '0.10s', tps: '12.4k/s' },
  { icon: Cpu, title: 'Preprocessing Engine', detail: 'ROI crop · CLAHE · denoise', metric: '0.06s', tps: '12.4k/s' },
  { icon: Network, title: 'Feature Extraction', detail: '1,214 vein minutiae', metric: '0.18s', tps: '11.9k/s' },
  { icon: Fingerprint, title: 'Palm Matching Model', detail: '512-d cosine ANN', metric: '0.22s', tps: '11.9k/s' },
  { icon: UserCheck, title: 'Identity Verification', detail: 'Liveness + confidence gate', metric: '0.08s', tps: '11.8k/s' },
  { icon: Wallet, title: 'Wallet Engine', detail: 'Balance + risk scoring', metric: '0.09s', tps: '11.8k/s' },
  { icon: Server, title: 'Transaction Processor', detail: 'Sign · settle · ledger', metric: '0.05s', tps: '11.8k/s' },
  { icon: Store, title: 'Merchant Confirmation', detail: 'Receipt + webhook', metric: '0.03s', tps: '11.8k/s' },
];

export default function ArchitecturePage() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % NODES.length), 700);
    return () => clearInterval(id);
  }, []);

  return (
    <PageShell particles={20} seed={31}>
      <div className="mx-auto max-w-5xl px-6 pb-24 pt-32">
        <SectionHeading
          align="left"
          eyebrow="Live System Architecture"
          title={
            <>
              From palm to payment in <span className="text-gradient">eight stages.</span>
            </>
          }
          subtitle="Watch a single transaction flow through the PalmPay pipeline in real time — under 0.8 seconds, end to end."
        />

        {/* pipeline summary */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Summary label="End-to-end latency" value={<><Counter to={0.74} decimals={2} />s</>} />
          <Summary label="Throughput" value={<><Counter to={11.8} decimals={1} />k/s</>} />
          <Summary label="Pipeline stages" value={<Counter to={8} />} />
          <Summary label="Uptime" value={<><Counter to={99.99} decimals={2} />%</>} />
        </div>

        {/* vertical pipeline */}
        <div className="relative mt-12 pb-4">
          {/* spine */}
          <div className="absolute left-[31px] top-4 h-[calc(100%-2rem)] w-0.5 bg-white/8 sm:left-1/2 sm:-translate-x-1/2" />
          {/* animated flow on spine */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute left-[28px] top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-accent shadow-glow-green sm:left-1/2"
              animate={{ top: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
              transition={{ duration: 3, delay: i * 1, repeat: Infinity, ease: 'linear' }}
            />
          ))}

          <div className="space-y-5">
            {NODES.map((n, i) => {
              const Icon = n.icon;
              const isActive = i === active;
              const left = i % 2 === 0;
              return (
                <div
                  key={n.title}
                  className={cn(
                    'relative flex items-center gap-5 sm:gap-0',
                    left ? 'sm:flex-row' : 'sm:flex-row-reverse'
                  )}
                >
                  {/* node marker */}
                  <motion.div
                    className="absolute left-[18px] z-10 sm:left-1/2 sm:-translate-x-1/2"
                    animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                  >
                    <span
                      className={cn(
                        'grid h-9 w-9 place-items-center rounded-full border-2 transition-all duration-300',
                        isActive
                          ? 'border-accent bg-accent/20 shadow-glow-green'
                          : 'border-white/15 bg-ink-700'
                      )}
                    >
                      <span className={cn('h-2.5 w-2.5 rounded-full transition-colors', isActive ? 'bg-accent' : 'bg-mist-500')} />
                    </span>
                  </motion.div>

                  {/* card */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-10%' }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      'ml-14 w-full rounded-2xl border p-4 shadow-glass transition-all duration-300 sm:ml-0 sm:w-[45%]',
                      isActive ? 'border-accent/40 bg-accent/[0.05]' : 'border-white/8 glass',
                      left ? 'sm:mr-auto' : 'sm:ml-auto'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors',
                          isActive ? 'bg-brand-gradient text-ink-900' : 'bg-white/5 text-primary'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-bold text-white">
                            <span className="mr-1.5 font-mono text-mist-400">{String(i + 1).padStart(2, '0')}</span>
                            {n.title}
                          </h3>
                          <span className="font-mono text-[11px] text-accent">{n.metric}</span>
                        </div>
                        <p className="truncate text-xs text-mist-400">{n.detail}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px]">
                      <span className="flex items-center gap-1.5 text-mist-400">
                        <span className={cn('h-1.5 w-1.5 rounded-full', isActive ? 'bg-accent' : 'bg-accent/50')} />
                        {isActive ? 'Processing' : 'Healthy'}
                      </span>
                      <span className="font-mono text-mist-400">{n.tps}</span>
                    </div>
                  </motion.div>

                  <div className="hidden sm:block sm:w-[45%]" />
                </div>
              );
            })}
          </div>

          {/* terminal node */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative mt-6 flex justify-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-5 py-2.5 text-sm font-bold text-accent">
              <BadgeCheck className="h-4 w-4" /> Payment settled · receipt issued
            </span>
          </motion.div>
        </div>
      </div>
    </PageShell>
  );
}

function Summary({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl glass p-4 text-center shadow-glass">
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-xs text-mist-400">{label}</div>
    </div>
  );
}
