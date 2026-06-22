'use client';

import { motion } from 'framer-motion';
import {
  Check,
  CreditCard,
  Hand,
  KeyRound,
  Loader,
  QrCode,
  Smartphone,
  Wifi,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';

const OLD_STEPS = [
  { icon: Smartphone, label: 'Unlock Phone' },
  { icon: QrCode, label: 'Open & Scan QR' },
  { icon: KeyRound, label: 'Enter PIN' },
  { icon: Wifi, label: 'Wait for Network' },
  { icon: Check, label: 'Confirmation' },
];

const NEW_STEPS = [
  { icon: Hand, label: 'Place Palm' },
  { icon: Check, label: 'Done' },
];

export function WhyPalmPay() {
  return (
    <section id="why" className="relative mx-auto max-w-7xl scroll-mt-28 px-6 py-28">
      <SectionHeading
        eyebrow="Why PalmPay"
        title={
          <>
            Five steps of friction,{' '}
            <span className="text-gradient">replaced by one gesture.</span>
          </>
        }
        subtitle="Every other payment method is a chain of dependencies. PalmPay removes the entire chain — the palm is the wallet."
      />

      <div className="mt-16 grid items-stretch gap-6 lg:grid-cols-2">
        {/* OLD WORLD */}
        <Reveal>
          <GlassCard className="h-full p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-mist-400">
                  The Old World
                </p>
                <h3 className="mt-1 text-xl font-bold text-mist-100">
                  Phone → QR → PIN → Payment
                </h3>
              </div>
              <span className="rounded-full bg-danger/10 px-3 py-1 text-sm font-bold text-danger">
                ~32s
              </span>
            </div>

            <div className="mt-8 space-y-3">
              {OLD_STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.18, duration: 0.5 }}
                    className="flex items-center gap-4"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-mist-300">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" />
                    <span className="text-sm font-medium text-mist-200">{s.label}</span>
                    {i < OLD_STEPS.length - 1 && (
                      <Loader className="h-3.5 w-3.5 animate-spin text-mist-500" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-8 grid grid-cols-3 gap-2 text-center text-xs">
              <Pain label="Dead battery = no pay" />
              <Pain label="Network dependent" />
              <Pain label="PIN can be stolen" />
            </div>
          </GlassCard>
        </Reveal>

        {/* NEW WORLD */}
        <Reveal delay={0.1}>
          <GlassCard glow="green" interactive className="relative h-full overflow-hidden p-7 border-glow">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                  The New World
                </p>
                <h3 className="mt-1 text-xl font-bold text-white">Palm → Identity → Payment</h3>
              </div>
              <span className="rounded-full bg-accent/15 px-3 py-1 text-sm font-bold text-accent">
                0.7s
              </span>
            </div>

            <div className="relative mt-8 space-y-3">
              {NEW_STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.25, type: 'spring', stiffness: 260, damping: 18 }}
                    className="flex items-center gap-4 rounded-xl border border-accent/20 bg-accent/5 p-3"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-gradient text-ink-900 shadow-glow-green">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-lg font-bold text-white">{s.label}</span>
                    {i === 1 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1, type: 'spring' }}
                        className="ml-auto text-sm font-semibold text-accent"
                      >
                        Payment complete ✓
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="relative mt-8 grid grid-cols-3 gap-2 text-center text-xs">
              <Gain label="Works offline" />
              <Gain label="Nothing to steal" />
              <Gain label="45× faster" />
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}

function Pain({ label }: { label: string }) {
  return (
    <span className="rounded-lg border border-danger/15 bg-danger/5 px-2 py-2 text-danger/90">
      {label}
    </span>
  );
}

function Gain({ label }: { label: string }) {
  return (
    <span className="rounded-lg border border-accent/20 bg-accent/5 px-2 py-2 font-medium text-accent">
      {label}
    </span>
  );
}
