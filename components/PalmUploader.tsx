'use client';

import { motion } from 'framer-motion';
import { ImageUp, Sparkles, UploadCloud, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface PalmUploaderProps {
  onCapture: (src: string | 'sample') => void;
  captured?: string | null;
  scanning?: boolean;
  className?: string;
}

/**
 * Drag-and-drop palm image uploader. No webcam (per demo spec).
 * Shows a live vein-scan overlay on the captured image.
 */
export function PalmUploader({ onCapture, captured, scanning, className }: PalmUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const readFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => onCapture(reader.result as string);
      reader.readAsDataURL(file);
    },
    [onCapture]
  );

  if (captured) {
    return (
      <div className={cn('relative aspect-square w-full overflow-hidden rounded-2xl', className)}>
        {captured === 'sample' ? (
          <SamplePalm />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={captured} alt="Captured palm" className="h-full w-full object-cover" />
        )}

        {/* vein overlay */}
        <VeinOverlay />

        {/* scan sweep */}
        {scanning && (
          <>
            <motion.div
              className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-accent/30 to-transparent"
              initial={{ top: '-20%' }}
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-accent/40" />
          </>
        )}

        {/* corner brackets */}
        {['top-3 left-3 border-t-2 border-l-2', 'top-3 right-3 border-t-2 border-r-2', 'bottom-3 left-3 border-b-2 border-l-2', 'bottom-3 right-3 border-b-2 border-r-2'].map(
          (c) => (
            <span key={c} className={cn('absolute h-6 w-6 border-primary/70', c)} />
          )
        )}

        {!scanning && (
          <button
            onClick={() => onCapture('')}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-ink-900/70 text-white backdrop-blur transition-colors hover:bg-danger/80"
            aria-label="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="absolute bottom-3 left-3 rounded-lg bg-ink-900/70 px-2.5 py-1 font-mono text-[11px] text-accent backdrop-blur">
          {scanning ? 'CAPTURING · NIR 850nm' : 'PALM CAPTURED ✓'}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) readFile(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'group relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300',
          drag
            ? 'border-primary bg-primary/5 scale-[1.01]'
            : 'border-white/15 glass hover:border-primary/50'
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-grid-faint [background-size:32px_32px] opacity-30" />
        <motion.span
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-primary"
        >
          <UploadCloud className="h-7 w-7" />
        </motion.span>
        <div>
          <p className="text-base font-semibold text-white">Drop a palm image to scan</p>
          <p className="mt-1 text-sm text-mist-300">or click to upload · PNG, JPG up to 10MB</p>
        </div>
        <span className="chip">
          <ImageUp className="h-3.5 w-3.5" /> Image upload only — no webcam
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) readFile(f);
          }}
        />
      </div>

      <button
        onClick={() => onCapture('sample')}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-medium text-mist-100 transition-colors hover:bg-white/10"
      >
        <Sparkles className="h-4 w-4 text-accent" />
        No image handy? Use a sample palm
      </button>
    </div>
  );
}

/** Animated vein network drawn over the captured palm. */
function VeinOverlay() {
  const veins = [
    'M50,95 C46,70 40,40 38,12',
    'M50,95 C52,65 54,30 56,8',
    'M50,95 C58,68 66,38 70,14',
    'M50,95 C40,80 26,66 16,52',
    'M50,80 C60,74 72,64 80,50',
  ];
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
      {veins.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke="#00FFA3"
          strokeWidth="0.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ duration: 1.4, delay: 0.2 + i * 0.15 }}
          style={{ filter: 'drop-shadow(0 0 2px #00FFA3)' }}
        />
      ))}
    </svg>
  );
}

/** Synthetic palm used when the user has no image to upload. */
function SamplePalm() {
  return (
    <div className="relative h-full w-full bg-gradient-to-br from-ink-600 to-ink-800">
      <div className="absolute inset-0 grid place-items-center">
        <svg viewBox="0 0 200 220" className="h-4/5 w-4/5" fill="none">
          <path
            d="M70,200 C62,150 78,124 100,122 C122,124 138,150 130,200 Z M62,120 c-2-40 0-58 6-58 s8,18,8,58 M84,118 c-2-50 0-70 8-70 s8,20,8,70 M108,120 c0-46 2-64 8-64 s8,18,6,64 M128,128 c4-34 6-48 12-46 s6,16,2,46"
            fill="rgba(0,229,255,0.08)"
            stroke="rgba(155,167,189,0.5)"
            strokeWidth="1.4"
          />
        </svg>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,rgba(123,97,255,0.18),transparent_60%)]" />
    </div>
  );
}
