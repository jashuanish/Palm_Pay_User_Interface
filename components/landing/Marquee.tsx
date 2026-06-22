'use client';

import { motion } from 'framer-motion';

const ITEMS = [
  'No Phone',
  'No QR Code',
  'No Card',
  'No Cash',
  'No PIN',
  'No Battery Anxiety',
  'No Network Required',
  'Just Your Palm',
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <section className="relative border-y border-white/5 py-6">
      <div className="mask-fade-x overflow-hidden">
        <motion.div
          className="flex w-max gap-8"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        >
          {row.map((item, i) => (
            <span key={i} className="flex items-center gap-8 whitespace-nowrap">
              <span className="text-2xl font-bold tracking-tight text-mist-200/80 sm:text-3xl">
                {item}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-accent" />
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
