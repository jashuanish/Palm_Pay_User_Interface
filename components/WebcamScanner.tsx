'use client';

import { motion } from 'framer-motion';
import { Camera, CameraOff, Hand, Loader2, ScanLine } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GlowButton } from '@/components/ui/GlowButton';
import { cn } from '@/lib/utils';

interface WebcamScannerProps {
  onCapture: (canvas: HTMLCanvasElement) => void;
  busy?: boolean;
  captureLabel?: string;
  /** Require good positioning before the capture button enables. */
  gated?: boolean;
  /** Fired once the camera stream is live — used to begin loading the vision engine. */
  onStart?: () => void;
}

type Status = 'idle' | 'requesting' | 'live' | 'denied' | 'nocam';

const CAP_W = 640;
const CAP_H = 480;

export function WebcamScanner({
  onCapture,
  busy = false,
  captureLabel = 'Capture Palm',
  gated = true,
  onStart,
}: WebcamScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sampleCanvas = useRef<HTMLCanvasElement | null>(null);
  const rafTimer = useRef<number | null>(null);

  const [status, setStatus] = useState<Status>('idle');
  const [ready, setReady] = useState(false);
  const [hint, setHint] = useState('Align your palm inside the frame');
  const [countdown, setCountdown] = useState<number | null>(null);

  const stop = useCallback(() => {
    if (rafTimer.current) window.clearInterval(rafTimer.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: CAP_W }, height: { ideal: CAP_H }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus('live');
      onStart?.(); // begin loading the vision engine now that the user is committed
    } catch (e: any) {
      if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') setStatus('denied');
      else setStatus('nocam');
    }
  }, []);

  useEffect(() => () => stop(), [stop]);

  // Live readiness probe — luminance mean + detail over the centre region.
  useEffect(() => {
    if (status !== 'live') return;
    if (!sampleCanvas.current) sampleCanvas.current = document.createElement('canvas');
    const sc = sampleCanvas.current;
    sc.width = 160;
    sc.height = 120;
    const ctx = sc.getContext('2d', { willReadFrequently: true })!;

    const id = window.setInterval(() => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return;
      ctx.drawImage(v, 0, 0, sc.width, sc.height);
      // centre box (palm guide region)
      const bx = 36;
      const by = 18;
      const bw = sc.width - bx * 2;
      const bh = sc.height - by * 2;
      const { data } = ctx.getImageData(bx, by, bw, bh);
      let sum = 0;
      let sumSq = 0;
      const n = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        sum += lum;
        sumSq += lum * lum;
      }
      const mean = sum / n;
      const std = Math.sqrt(Math.max(0, sumSq / n - mean * mean));

      const bright = mean > 45 && mean < 232;
      const detailed = std > 16; // something textured (a hand) is present
      const ok = bright && detailed;
      setReady(ok);
      setHint(
        !bright
          ? mean <= 45
            ? 'Too dark — find better lighting'
            : 'Too bright — reduce glare'
          : !detailed
            ? 'Move your palm closer to fill the frame'
            : 'Hold steady — palm detected'
      );
    }, 220);
    rafTimer.current = id;
    return () => window.clearInterval(id);
  }, [status]);

  const grab = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement('canvas');
    canvas.width = CAP_W;
    canvas.height = CAP_H;
    const ctx = canvas.getContext('2d')!;
    // capture the raw (un-mirrored) frame — consistent for enroll & login
    ctx.drawImage(v, 0, 0, CAP_W, CAP_H);
    onCapture(canvas);
  }, [onCapture]);

  const triggerCapture = useCallback(() => {
    if (busy) return;
    setCountdown(3);
    let c = 3;
    const tick = window.setInterval(() => {
      c -= 1;
      if (c <= 0) {
        window.clearInterval(tick);
        setCountdown(null);
        grab();
      } else {
        setCountdown(c);
      }
    }, 650);
  }, [busy, grab]);

  return (
    <div className="w-full">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10 bg-ink-800">
        {/* video */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn(
            'h-full w-full -scale-x-100 object-cover transition-opacity duration-500',
            status === 'live' ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* guide overlay */}
        {status === 'live' && (
          <div className="pointer-events-none absolute inset-0">
            {/* dim outside guide */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_46%_60%_at_50%_50%,transparent_55%,rgba(5,7,10,0.7)_100%)]" />
            {/* palm guide */}
            <div
              className={cn(
                'absolute left-1/2 top-1/2 grid h-[78%] w-[58%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[40%] border-2 transition-colors duration-300',
                ready ? 'border-accent/80' : 'border-white/30'
              )}
            >
              <Hand
                className={cn(
                  'h-2/3 w-2/3 transition-colors duration-300',
                  ready ? 'text-accent/30' : 'text-white/15'
                )}
                strokeWidth={1}
              />
              {/* corner brackets */}
              {[
                'left-2 top-2 border-l-2 border-t-2',
                'right-2 top-2 border-r-2 border-t-2',
                'left-2 bottom-2 border-l-2 border-b-2',
                'right-2 bottom-2 border-r-2 border-b-2',
              ].map((c) => (
                <span
                  key={c}
                  className={cn(
                    'absolute h-6 w-6 transition-colors duration-300',
                    ready ? 'border-accent' : 'border-primary/70',
                    c
                  )}
                />
              ))}
            </div>

            {/* scan sweep */}
            <motion.div
              className="absolute inset-x-[21%] h-16 bg-gradient-to-b from-transparent via-primary/25 to-transparent"
              initial={{ top: '12%' }}
              animate={{ top: ['12%', '78%', '12%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* readiness chip */}
            <div className="absolute inset-x-0 bottom-3 flex justify-center">
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur transition-colors',
                  ready ? 'bg-accent/20 text-accent' : 'bg-ink-900/70 text-mist-200'
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', ready ? 'bg-accent' : 'bg-warn')} />
                {hint}
              </span>
            </div>

            {/* live tag */}
            <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-ink-900/70 px-2 py-1 font-mono text-[10px] text-accent backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-danger" /> LIVE · NIR-SIM
            </div>
          </div>
        )}

        {/* countdown */}
        {countdown !== null && (
          <div className="absolute inset-0 grid place-items-center bg-ink-900/40 backdrop-blur-sm">
            <motion.span
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-7xl font-black text-white"
            >
              {countdown}
            </motion.span>
          </div>
        )}

        {/* busy overlay */}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-ink-900/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Processing palm…
            </div>
          </div>
        )}

        {/* non-live states */}
        {status !== 'live' && (
          <div className="absolute inset-0 grid place-items-center p-8 text-center">
            {status === 'idle' && (
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-primary">
                  <Camera className="h-7 w-7" />
                </span>
                <p className="mt-4 text-base font-semibold text-white">Camera access required</p>
                <p className="mt-1 text-sm text-mist-400">
                  We’ll guide you to position your palm, then capture & process it.
                </p>
              </div>
            )}
            {status === 'requesting' && (
              <div className="flex items-center gap-2 text-mist-200">
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Requesting camera…
              </div>
            )}
            {(status === 'denied' || status === 'nocam') && (
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger">
                  <CameraOff className="h-7 w-7" />
                </span>
                <p className="mt-4 text-base font-semibold text-white">
                  {status === 'denied' ? 'Camera permission denied' : 'No camera found'}
                </p>
                <p className="mt-1 text-sm text-mist-400">
                  {status === 'denied'
                    ? 'Enable camera access in your browser’s site settings, then retry.'
                    : 'Connect a webcam and retry.'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* controls */}
      <div className="mt-4 flex gap-2">
        {status !== 'live' ? (
          <GlowButton
            onClick={start}
            size="md"
            className="w-full"
            disabled={status === 'requesting'}
          >
            <Camera className="h-4 w-4" /> {status === 'idle' ? 'Enable Camera' : 'Retry'}
          </GlowButton>
        ) : (
          <>
            <GlowButton
              onClick={triggerCapture}
              size="md"
              className="flex-1"
              disabled={busy || countdown !== null || (gated && !ready)}
            >
              <ScanLine className="h-4 w-4" /> {captureLabel}
            </GlowButton>
            <button
              onClick={() => {
                stop();
                setStatus('idle');
                setReady(false);
              }}
              className="rounded-full border border-white/10 px-4 text-sm font-medium text-mist-200 transition-colors hover:bg-white/5"
            >
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
