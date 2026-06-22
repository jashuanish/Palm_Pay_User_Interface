'use client';

import { Counter } from '@/components/ui/Counter';
import { Reveal } from '@/components/ui/Reveal';
import { METRICS } from '@/lib/mockData';

const STATS = [
  { value: <Counter to={248930} group suffix="" />, label: 'Palms enrolled', sub: 'across 9 countries' },
  { value: <Counter to={5.1} decimals={1} suffix="M+" />, label: 'Transactions processed', sub: 'and counting' },
  { value: <Counter to={99.4} decimals={1} suffix="%" />, label: 'Authentication accuracy', sub: 'FAR 0.0008%' },
  { value: <Counter to={740} suffix="ms" />, label: 'Average payment time', sub: '45× faster than QR' },
];

export function StatsBand() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-16">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl glass-strong p-8 shadow-float sm:p-12">
          <div className="absolute inset-0 bg-brand-soft opacity-40" />
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

          <div className="relative grid grid-cols-2 gap-8 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <div key={i} className="text-center lg:text-left">
                <div className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                  {s.value}
                </div>
                <div className="mt-2 text-sm font-semibold text-mist-100">{s.label}</div>
                <div className="text-xs text-mist-400">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
