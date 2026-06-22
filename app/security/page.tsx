'use client';

import { motion } from 'framer-motion';
import {
  Eye,
  Fingerprint,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Reveal, Stagger, staggerItem } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';

const LAYERS = [
  {
    icon: Lock,
    title: 'AES-256 Encryption',
    body: 'Every biometric template, token and ledger entry is sealed with AES-256-GCM. Keys rotate hourly and never leave the HSM.',
    chip: 'FIPS 140-2 Level 3',
  },
  {
    icon: Fingerprint,
    title: 'Biometric Templates',
    body: 'We never store palm images. Only an irreversible 512-dimension vector — useless to anyone who steals it.',
    chip: 'Irreversible',
  },
  {
    icon: Eye,
    title: 'Liveness Detection',
    body: 'Near-infrared blood-flow analysis confirms a living hand. Photos, prints and prosthetics are rejected instantly.',
    chip: 'Anti-spoof',
  },
  {
    icon: KeyRound,
    title: 'Encrypted Tokens',
    body: 'Payments are signed by a per-device biometric token. Tokens are scoped, short-lived and revocable.',
    chip: 'Per-device',
  },
  {
    icon: Sparkles,
    title: 'Zero-Knowledge Identity',
    body: 'Merchants verify you are you — without ever seeing your identity or biometrics. Proofs, not data.',
    chip: 'ZK proofs',
  },
  {
    icon: ShieldCheck,
    title: 'Continuous Audit',
    body: 'Every access is logged to an append-only ledger. SOC 2 Type II and ISO 27001 certified, independently audited.',
    chip: 'SOC 2 · ISO 27001',
  },
];

const CIPHER = '0123456789ABCDEF░▓▒█';

function Scrambler({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    let frame = 0;
    const id = setInterval(() => {
      frame++;
      setDisplay(
        text
          .split('')
          .map((c, i) => (i < frame / 2 ? c : CIPHER[Math.floor(Math.random() * CIPHER.length)]))
          .join('')
      );
      if (frame / 2 > text.length) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [text]);
  return <span className="font-mono text-accent">{display}</span>;
}

export default function SecurityPage() {
  return (
    <PageShell particles={22} seed={23}>
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <SectionHeading
          align="left"
          eyebrow="Security Center"
          title={
            <>
              Built like a vault. <span className="text-gradient">Invisible like air.</span>
            </>
          }
          subtitle="PalmPay never stores your palm. We store a one-way mathematical shadow of it, sealed behind military-grade cryptography."
        />

        {/* hero shield + encryption demo */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <GlassCard className="relative grid place-items-center overflow-hidden p-10">
              <div className="absolute inset-0 bg-aurora opacity-40" />
              {/* concentric shield rings */}
              <div className="relative grid place-items-center">
                {[220, 170, 120].map((s, i) => (
                  <motion.span
                    key={s}
                    className="absolute rounded-full border border-primary/20"
                    style={{ width: s, height: s }}
                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 24 + i * 8, repeat: Infinity, ease: 'linear' }}
                  >
                    <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-primary" />
                  </motion.span>
                ))}
                <motion.span
                  className="relative grid h-24 w-24 place-items-center rounded-3xl bg-brand-gradient text-ink-900 shadow-glow"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <ShieldCheck className="h-12 w-12" />
                </motion.span>
              </div>
              <p className="relative mt-8 text-center text-sm text-mist-300">
                Defense-in-depth across <span className="font-semibold text-white">7 independent layers</span>
              </p>
            </GlassCard>
          </Reveal>

          <Reveal delay={0.1}>
            <GlassCard className="flex h-full flex-col justify-center p-8">
              <span className="chip w-fit border-accent/25 bg-accent/5 text-accent">
                <Lock className="h-3.5 w-3.5" /> Live encryption
              </span>
              <h3 className="mt-4 text-xl font-bold text-white">Your palm, the moment it’s captured</h3>
              <div className="mt-5 space-y-3 font-mono text-sm">
                <div className="rounded-xl border border-white/8 bg-ink-800/50 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-mist-400">Raw template (discarded)</p>
                  <p className="mt-1 text-mist-500 line-through">vein-pattern-aarav-sharma.raw</p>
                </div>
                <div className="grid place-items-center text-mist-400">↓ AES-256-GCM ↓</div>
                <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-3">
                  <p className="text-[11px] uppercase tracking-wider text-mist-400">Sealed vector (stored)</p>
                  <p className="mt-1 break-all">
                    <Scrambler text="9F2A7C41E0B83D6519AE4F02C7D18B4490" />
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm text-mist-300">
                Even a full database breach reveals nothing — there is no image to steal and the
                vector cannot be reversed into a palm.
              </p>
            </GlassCard>
          </Reveal>
        </div>

        {/* layers grid */}
        <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LAYERS.map((l) => {
            const Icon = l.icon;
            return (
              <motion.div key={l.title} variants={staggerItem}>
                <GlassCard interactive glow="cyan" className="group h-full p-6">
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-primary transition-colors group-hover:bg-primary/15">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="chip">{l.chip}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{l.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-mist-300">{l.body}</p>
                </GlassCard>
              </motion.div>
            );
          })}
        </Stagger>

        {/* certifications band */}
        <Reveal>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 rounded-2xl glass p-6 text-center">
            <span className="text-sm text-mist-300">Independently certified &amp; audited:</span>
            {['SOC 2 Type II', 'ISO 27001', 'PCI-DSS Level 1', 'GDPR', 'FIPS 140-2'].map((c) => (
              <span key={c} className="chip border-white/15">{c}</span>
            ))}
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}
