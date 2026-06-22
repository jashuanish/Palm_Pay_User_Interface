'use client';

import { motion } from 'framer-motion';
import {
  Accessibility,
  ArrowRight,
  Check,
  CreditCard,
  Minus,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Timer,
  TrendingUp,
  WifiOff,
  X,
} from 'lucide-react';
import { PageShell } from '@/components/layout/PageShell';
import { Counter } from '@/components/ui/Counter';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { Reveal, Stagger, staggerItem } from '@/components/ui/Reveal';

const TAM = [
  { label: 'TAM', value: '$2.4T', sub: 'Global retail payments by 2030' },
  { label: 'SAM', value: '$310B', sub: 'In-person biometric checkout' },
  { label: 'SOM', value: '$14B', sub: 'India + SEA, 5-year target' },
];

const COMPARISON = [
  { feature: 'Checkout speed', palmpay: '0.7s', amazon: '~1.5s', qr: '~30s', card: '~12s', phone: '~25s' },
  { feature: 'Works with no phone', palmpay: true, amazon: true, qr: false, card: true, phone: false },
  { feature: 'Works offline', palmpay: true, amazon: false, qr: false, card: true, phone: false },
  { feature: 'Nothing to lose / steal', palmpay: true, amazon: true, qr: false, card: false, phone: false },
  { feature: 'Liveness anti-spoof', palmpay: true, amazon: true, qr: false, card: false, phone: 'partial' },
  { feature: 'Behavioural fraud AI', palmpay: true, amazon: 'partial', qr: false, card: 'partial', phone: 'partial' },
  { feature: 'Open merchant network', palmpay: true, amazon: false, qr: true, card: true, phone: true },
];

const ADVANTAGES = [
  { icon: Timer, title: '45× faster checkout', body: 'Sub-second payments vs. ~30s for QR. Shorter queues, higher throughput, more revenue per terminal.' },
  { icon: Smartphone, title: 'Phone-free by design', body: 'No app, no battery, no SIM. Works for the 400M+ Indians without smartphones — and everyone who forgot theirs.' },
  { icon: ShieldCheck, title: '90% fraud reduction', body: 'Palm veins can’t be phished, skimmed or shoulder-surfed. Behavioural AI catches the rest.' },
  { icon: Accessibility, title: 'Radically accessible', body: 'No screens to read, no PINs to remember. A gift for the elderly, the visually impaired and the unbanked.' },
  { icon: WifiOff, title: 'Offline-capable', body: 'On-device matching with deferred settlement keeps payments flowing through network outages.' },
  { icon: TrendingUp, title: 'Network effects', body: 'Every enrolled palm and every merchant terminal makes the network more valuable — a classic flywheel.' },
];

const ROADMAP = [
  { q: 'Q3 2026', title: 'Pilot — 50 merchants', body: 'Bengaluru cafes & retail. Prove sub-second UX and enrollment funnel.', done: true },
  { q: 'Q1 2027', title: '1,000 terminals', body: 'Expand to Mumbai & Delhi. Launch merchant SDK and fraud AI v2.', done: false },
  { q: 'Q4 2027', title: 'Transit + offline', body: 'Metro gates and offline settlement. 1M enrolled palms.', done: false },
  { q: '2028', title: 'Southeast Asia', body: 'Cross-border identity layer. Banking & loyalty partnerships.', done: false },
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Check className="mx-auto h-5 w-5 text-accent" />;
  if (v === false) return <X className="mx-auto h-5 w-5 text-mist-500" />;
  if (v === 'partial') return <Minus className="mx-auto h-5 w-5 text-warn" />;
  return <span className="font-semibold text-white">{v}</span>;
}

export default function InvestorPage() {
  return (
    <PageShell particles={30} seed={37}>
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        {/* hero */}
        <Reveal>
          <span className="chip border-secondary/25 bg-secondary/5 text-secondary">
            <Sparkles className="h-3.5 w-3.5" /> Series A · Investor Brief
          </span>
        </Reveal>
        <Reveal delay={0.05}>
          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">
            The operating system for{' '}
            <span className="text-gradient">invisible payments.</span>
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-5 max-w-2xl text-lg text-mist-300">
            PalmPay turns the human palm into a universal payment identity — faster than Amazon One,
            phone-free, fraud-resistant and built for the next billion users.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mt-8 flex flex-wrap gap-3">
            <GlowButton href="/store" size="lg">See the live demo <ArrowRight className="h-4 w-4" /></GlowButton>
            <GlowButton href="/analytics" variant="outline" size="lg">View traction</GlowButton>
          </div>
        </Reveal>

        {/* headline metrics */}
        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { v: <><Counter to={248} suffix="K+" /></>, l: 'Palms enrolled' },
            { v: <><Counter to={5.1} decimals={1} suffix="M" /></>, l: 'Transactions' },
            { v: <><Counter to={22} suffix="%" /></>, l: 'MoM growth' },
            { v: <>₹<Counter to={4.2} decimals={1} suffix="Cr" /></>, l: 'Fraud blocked / mo' },
          ].map((m, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <GlassCard className="p-5 text-center">
                <div className="text-3xl font-black text-white">{m.v}</div>
                <div className="mt-1 text-xs text-mist-400">{m.l}</div>
              </GlassCard>
            </Reveal>
          ))}
        </div>

        {/* market opportunity */}
        <Section eyebrow="Market Opportunity" title="A trillion-dollar shift, just beginning.">
          <div className="grid gap-4 sm:grid-cols-3">
            {TAM.map((t, i) => (
              <motion.div key={t.label} variants={staggerItem}>
                <GlassCard interactive glow="purple" className="p-6">
                  <span className="chip">{t.label}</span>
                  <p className="mt-4 text-4xl font-black text-gradient">{t.value}</p>
                  <p className="mt-2 text-sm text-mist-300">{t.sub}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* comparison matrix */}
        <Section eyebrow="Competitive Advantage" title="Why we win against every alternative.">
          <GlassCard className="overflow-x-auto p-2">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-mist-300">
                  <th className="p-4 text-left font-medium">Capability</th>
                  <th className="p-4 text-center">
                    <span className="inline-flex flex-col items-center gap-1">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-gradient text-ink-900"><ShieldCheck className="h-4 w-4" /></span>
                      <span className="font-bold text-white">PalmPay</span>
                    </span>
                  </th>
                  <th className="p-4 text-center font-medium">Amazon One</th>
                  <th className="p-4 text-center font-medium"><QrCode className="mx-auto h-4 w-4" />QR</th>
                  <th className="p-4 text-center font-medium"><CreditCard className="mx-auto h-4 w-4" />Cards</th>
                  <th className="p-4 text-center font-medium"><Smartphone className="mx-auto h-4 w-4" />Phones</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <motion.tr
                    key={row.feature}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="border-t border-white/5"
                  >
                    <td className="p-4 text-left font-medium text-mist-100">{row.feature}</td>
                    <td className="bg-primary/[0.04] p-4 text-center"><Cell v={row.palmpay} /></td>
                    <td className="p-4 text-center"><Cell v={row.amazon} /></td>
                    <td className="p-4 text-center"><Cell v={row.qr} /></td>
                    <td className="p-4 text-center"><Cell v={row.card} /></td>
                    <td className="p-4 text-center"><Cell v={row.phone} /></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </Section>

        {/* advantages */}
        <Section eyebrow="Why PalmPay" title="Six structural advantages competitors can’t copy.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADVANTAGES.map((a) => {
              const Icon = a.icon;
              return (
                <motion.div key={a.title} variants={staggerItem}>
                  <GlassCard interactive glow="green" className="group h-full p-6">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-accent transition-colors group-hover:bg-accent/15">
                      <Icon className="h-6 w-6" />
                    </span>
                    <h3 className="mt-4 text-lg font-bold text-white">{a.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-mist-300">{a.body}</p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </Section>

        {/* roadmap */}
        <Section eyebrow="Future Roadmap" title="The path from pilot to a billion palms.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROADMAP.map((r, i) => (
              <motion.div key={r.q} variants={staggerItem}>
                <GlassCard className={`h-full p-5 ${r.done ? 'border-accent/30' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-primary">{r.q}</span>
                    {r.done ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">LIVE</span>
                    ) : (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold text-mist-400">PLANNED</span>
                    )}
                  </div>
                  <h3 className="mt-3 font-bold text-white">{r.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-mist-300">{r.body}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* the ask */}
        <Reveal>
          <div className="relative mt-20 overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-secondary/10 to-ink-800/60 p-10 text-center shadow-float sm:p-16">
            <div className="absolute inset-0 bg-aurora opacity-50" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl text-balance text-3xl font-black tracking-tight text-white sm:text-5xl">
                Raising <span className="text-gradient">$12M Series A</span> to put a palm scanner in every checkout.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-mist-300">
                Join us in building the payment layer for the next billion people — phone-free,
                card-free, and impossibly fast.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <GlowButton href="/" size="lg">Read the full story <ArrowRight className="h-4 w-4" /></GlowButton>
                <GlowButton href="/architecture" variant="outline" size="lg">See the tech</GlowButton>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </PageShell>
  );
}

function Section({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="mt-20">
      <Reveal>
        <span className="chip border-primary/20 bg-primary/5 text-primary">{eyebrow}</span>
      </Reveal>
      <Reveal delay={0.05}>
        <h2 className="mt-4 max-w-3xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
      </Reveal>
      <Stagger className="mt-8">{children}</Stagger>
    </div>
  );
}
