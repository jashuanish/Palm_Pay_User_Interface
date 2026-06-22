'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { PLATFORM_NAV } from '@/lib/nav';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Stagger, staggerItem } from '@/components/ui/Reveal';

// Bento sizing for visual rhythm
const SPANS = [
  'md:col-span-2 md:row-span-2',
  'md:col-span-1',
  'md:col-span-1',
  'md:col-span-1',
  'md:col-span-1',
  'md:col-span-2',
  'md:col-span-1',
  'md:col-span-1',
  'md:col-span-1',
];

export function FeatureGrid() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-28">
      <SectionHeading
        eyebrow="The Platform"
        title={
          <>
            One identity layer. <span className="text-gradient">Every surface of payment.</span>
          </>
        }
        subtitle="Explore the full PalmPay stack — each module is a live, interactive demo."
      />

      <Stagger className="mt-14 grid auto-rows-[150px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {PLATFORM_NAV.map((item, i) => {
          const Icon = item.icon;
          const big = i === 0;
          return (
            <motion.div key={item.href} variants={staggerItem} className={SPANS[i]}>
              <Link
                href={item.href}
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl glass p-5 shadow-glass transition-all duration-500 hover:border-white/20 hover:shadow-glow"
              >
                {/* hover bloom */}
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />

                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/5 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className={big ? 'h-6 w-6' : 'h-5 w-5'} />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-mist-400 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
                </div>

                <div>
                  <h3 className={`font-bold text-white ${big ? 'text-2xl' : 'text-base'}`}>
                    {item.label}
                  </h3>
                  <p className={`mt-1 text-mist-300 ${big ? 'text-sm max-w-md' : 'text-xs'}`}>
                    {big
                      ? 'Upload a palm and watch the engine preprocess, embed, search the vault and identify the user with a live confidence score.'
                      : item.desc}
                  </p>
                </div>

                {big && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="chip">Live engine</span>
                    <span className="chip">98.72% match</span>
                    <span className="chip">No webcam needed</span>
                  </div>
                )}
              </Link>
            </motion.div>
          );
        })}
      </Stagger>
    </section>
  );
}
