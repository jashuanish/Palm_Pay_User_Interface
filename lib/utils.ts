import { type ClassValue } from './types';

/** Tiny classnames combiner (no external dep). */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];
  for (const i of inputs) {
    if (!i) continue;
    if (typeof i === 'string' || typeof i === 'number') {
      out.push(String(i));
    } else if (Array.isArray(i)) {
      const inner = cn(...i);
      if (inner) out.push(inner);
    } else if (typeof i === 'object') {
      for (const [k, v] of Object.entries(i)) {
        if (v) out.push(k);
      }
    }
  }
  return out.join(' ');
}

/** Format a number as Indian Rupees. */
export function inr(amount: number, opts: { decimals?: boolean } = {}): string {
  const { decimals = false } = opts;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals ? 2 : 0,
    minimumFractionDigits: decimals ? 2 : 0,
  }).format(amount);
}

/** Compact number e.g. 12.4K, 1.2M */
export function compact(n: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(n);
}

/** Deterministic pseudo-random generator (seedable) so demo data is stable. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function range(n: number): number[] {
  return Array.from({ length: n }, (_, i) => i);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Relative time like "3m ago", "2h ago". Input: ms-ago. */
export function timeAgo(msAgo: number): string {
  const s = Math.floor(msAgo / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function maskId(id: string): string {
  if (id.length <= 8) return id;
  return `${id.slice(0, 6)}••••${id.slice(-4)}`;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
