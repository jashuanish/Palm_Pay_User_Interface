'use client';

import { IdentifyResult, SerializedDescriptors } from './matcher';
import { EnrolledTemplate } from './matcher';

/**
 * Main-thread client for the PalmPay vision worker. The 11MB OpenCV.js WASM is
 * loaded + run entirely inside the worker, so the UI thread never blocks.
 */
interface Pending {
  resolve: (v: any) => void;
  reject: (e: Error) => void;
}

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();
let initPromise: Promise<void> | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker('/opencv-worker.js');
    worker.onmessage = (e: MessageEvent) => {
      const { id, ok, error, ...rest } = e.data;
      const p = pending.get(id);
      if (!p) return;
      pending.delete(id);
      if (ok) p.resolve(rest);
      else p.reject(new Error(error || 'worker error'));
    };
    worker.onerror = (e) => {
      // reject everything in flight
      pending.forEach((p) => p.reject(new Error(e.message || 'worker crashed')));
      pending.clear();
    };
  }
  return worker;
}

function call<T = any>(cmd: string, payload?: Record<string, any>, transfer?: Transferable[]): Promise<T> {
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ id, cmd, ...payload }, transfer || []);
  });
}

/** Load OpenCV inside the worker. Resolves once ready (idempotent). */
export function initCv(): Promise<void> {
  if (!initPromise) initPromise = call('init').then(() => undefined);
  return initPromise;
}

export interface ExtractResult {
  kp: number;
  desc: SerializedDescriptors | null;
  gray: ArrayBuffer; // 224*224 grayscale of the enhanced ROI
  segmented: boolean;
}

/** Run the full pipeline + ORB extraction on an RGBA frame buffer (transferred). */
export function extractCv(rgba: ArrayBuffer, w: number, h: number): Promise<ExtractResult> {
  return call<ExtractResult>('extract', { buf: rgba, w, h }, [rgba]);
}

/** Match a probe descriptor set against enrolled templates. */
export function identifyCv(
  probe: SerializedDescriptors,
  enrolled: EnrolledTemplate[]
): Promise<{ result: IdentifyResult }> {
  return call('identify', { probe, enrolled });
}

/** Render a 224×224 grayscale buffer to a data URL (main thread, cheap). */
export function grayToDataURL(buf: ArrayBuffer, size = 224): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const g = new Uint8Array(buf);
  for (let i = 0; i < g.length; i++) {
    const v = g[i];
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL('image/png');
}
