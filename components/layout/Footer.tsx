'use client';

import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { PLATFORM_NAV } from '@/lib/nav';

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-white/5">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist-300">
              The future of invisible payments. Your palm vein becomes your
              identity, your wallet, and your signature — all at once.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip">SOC 2 Type II</span>
              <span className="chip">ISO 27001</span>
              <span className="chip">PCI-DSS</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-mist-400">
              Platform
            </h4>
            <ul className="mt-4 space-y-2.5">
              {PLATFORM_NAV.slice(0, 5).map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="text-sm text-mist-200 transition-colors hover:text-white">
                    {i.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-mist-400">
              Company
            </h4>
            <ul className="mt-4 space-y-2.5">
              {PLATFORM_NAV.slice(5).map((i) => (
                <li key={i.href}>
                  <Link href={i.href} className="text-sm text-mist-200 transition-colors hover:text-white">
                    {i.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/investor" className="text-sm text-mist-200 transition-colors hover:text-white">
                  Investor Mode
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-mist-400 sm:flex-row">
          <p>© 2026 PalmPay Technologies. Concept demo — biometric payments reimagined.</p>
          <p className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            All systems operational · 99.99% uptime
          </p>
        </div>
      </div>
    </footer>
  );
}
