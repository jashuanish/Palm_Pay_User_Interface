'use client';

import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { ChevronDown, Menu, Rocket, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Logo } from '@/components/Logo';
import { GlowButton } from '@/components/ui/GlowButton';
import { PLATFORM_NAV } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [platformOpen, setPlatformOpen] = useState(false);
  const pathname = usePathname();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
      >
        <nav
          className={cn(
            'flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-2.5 transition-all duration-500',
            scrolled ? 'glass-strong shadow-float' : 'border border-transparent'
          )}
        >
          <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
            <Logo />
          </Link>

          {/* desktop links */}
          <div className="hidden items-center gap-1 lg:flex">
            <NavLink href="/" label="Home" active={pathname === '/'} />
            <Link
              href="/#why"
              className="rounded-full px-3.5 py-2 text-sm font-medium text-mist-200 transition-colors hover:text-white"
            >
              Why PalmPay
            </Link>

            {/* platform dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setPlatformOpen(true)}
              onMouseLeave={() => setPlatformOpen(false)}
            >
              <button className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium text-mist-200 transition-colors hover:text-white">
                Platform
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', platformOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {platformOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-1/2 top-full w-[460px] -translate-x-1/2 pt-3"
                  >
                    <div className="grid grid-cols-2 gap-1 rounded-2xl glass-strong p-2 shadow-float">
                      {PLATFORM_NAV.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="group flex items-start gap-3 rounded-xl p-2.5 transition-colors hover:bg-white/5"
                          >
                            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5 text-primary transition-colors group-hover:bg-primary/15">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-white">{item.label}</span>
                              <span className="block truncate text-xs text-mist-300">{item.desc}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <NavLink href="/investor" label="Investors" active={pathname === '/investor'} />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <GlowButton href="/authenticate" size="sm">
                <Rocket className="h-4 w-4" />
                Launch Demo
              </GlowButton>
            </div>
            <button
              className="grid h-10 w-10 place-items-center rounded-xl glass lg:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </motion.header>

      {/* mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ink-900/80 backdrop-blur-xl lg:hidden"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="mx-4 mt-24 max-h-[78vh] overflow-y-auto rounded-2xl glass-strong p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-white hover:bg-white/5"
              >
                Home
              </Link>
              {PLATFORM_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-white/5"
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-white">{item.label}</span>
                  </Link>
                );
              })}
              <Link
                href="/investor"
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-semibold text-white hover:bg-white/5"
              >
                Investor Mode
              </Link>
              <div className="p-2">
                <GlowButton href="/authenticate" className="w-full" size="md">
                  Launch Demo
                </GlowButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
        active ? 'text-white' : 'text-mist-200 hover:text-white'
      )}
    >
      {label}
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 -z-10 rounded-full bg-white/8"
        />
      )}
    </Link>
  );
}
