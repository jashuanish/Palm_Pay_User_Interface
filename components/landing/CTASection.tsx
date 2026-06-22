'use client';

import { ArrowRight } from 'lucide-react';
import { PalmMesh } from '@/components/PalmMesh';
import { GlowButton } from '@/components/ui/GlowButton';
import { Reveal } from '@/components/ui/Reveal';

export function CTASection() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-ink-700/80 to-ink-800/80 p-10 text-center shadow-float sm:p-16">
          <div className="absolute inset-0 bg-aurora opacity-50" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 opacity-30 lg:block">
            <PalmMesh size={520} scanning={false} />
          </div>

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-balance text-4xl font-black tracking-tight text-white sm:text-5xl">
              Leave your wallet. <span className="text-gradient">Bring your palm.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-mist-300">
              Experience the entire PalmPay flow — enroll, authenticate, shop and
              pay — in a fully interactive demo.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <GlowButton href="/register" size="lg">
                Enroll Your Palm
                <ArrowRight className="h-4 w-4" />
              </GlowButton>
              <GlowButton href="/store" variant="outline" size="lg">
                Try Paying with a Palm
              </GlowButton>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
