'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { BadgeCheck, Cpu, Fingerprint, ScanLine, Wallet } from 'lucide-react';
import { SectionHeading } from '@/components/ui/SectionHeading';

const STEPS = [
  {
    icon: ScanLine,
    title: 'Place Palm',
    body: 'A near-infrared sensor reads the unique vein pattern beneath your skin — impossible to copy, alive by definition.',
    meta: '0.10s · capture',
  },
  {
    icon: Cpu,
    title: 'Extract Features',
    body: 'Over 1,200 vein minutiae are encoded into a 512-dimension biometric vector on-device.',
    meta: '0.18s · encode',
  },
  {
    icon: Fingerprint,
    title: 'Match Identity',
    body: 'The embedding is searched against the encrypted vault using approximate nearest-neighbour in milliseconds.',
    meta: '0.22s · match',
  },
  {
    icon: Wallet,
    title: 'Authorize Wallet',
    body: 'Balance verified, behavioural risk scored, and the payment is approved — no card, no PIN, no phone.',
    meta: '0.16s · authorize',
  },
  {
    icon: BadgeCheck,
    title: 'Done',
    body: 'The merchant is confirmed, a digital receipt is issued, and you simply walk away.',
    meta: '0.04s · settle',
  },
];

export function PaymentJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 65%', 'end 60%'],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section className="relative mx-auto max-w-5xl px-6 py-28">
      <SectionHeading
        eyebrow="The Journey"
        title={
          <>
            One gesture. <span className="text-gradient">Five invisible steps.</span>
          </>
        }
        subtitle="From the moment your palm hovers the sensor to a completed payment — under three quarters of a second."
      />

      <div ref={ref} className="relative mt-16 pl-4 sm:pl-0">
        {/* track */}
        <div className="absolute left-[27px] top-2 h-full w-px bg-white/8 sm:left-1/2" />
        {/* progress */}
        <motion.div
          style={{ height: lineHeight }}
          className="absolute left-[27px] top-2 w-px bg-gradient-to-b from-primary via-secondary to-accent shadow-glow sm:left-1/2"
        />

        <div className="space-y-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const left = i % 2 === 0;
            return (
              <div
                key={s.title}
                className={`relative flex items-center gap-6 sm:gap-0 ${
                  left ? 'sm:flex-row' : 'sm:flex-row-reverse'
                }`}
              >
                {/* node */}
                <div className="absolute left-[14px] z-10 sm:left-1/2 sm:-translate-x-1/2">
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, margin: '-20%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className="grid h-7 w-7 place-items-center rounded-full bg-ink-700 ring-1 ring-primary/40"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-gradient" />
                  </motion.span>
                </div>

                {/* card */}
                <motion.div
                  initial={{ opacity: 0, x: left ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-15%' }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className={`ml-12 w-full rounded-2xl glass p-5 shadow-glass sm:ml-0 sm:w-[44%] ${
                    left ? 'sm:mr-auto sm:text-right' : 'sm:ml-auto'
                  }`}
                >
                  <div
                    className={`flex items-center gap-3 ${
                      left ? 'sm:flex-row-reverse' : ''
                    }`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <span className="block font-mono text-[11px] uppercase tracking-wider text-accent">
                        Step {i + 1} · {s.meta}
                      </span>
                      <h3 className="text-lg font-bold text-white">{s.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-mist-300">{s.body}</p>
                </motion.div>

                <div className="hidden sm:block sm:w-[44%]" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
