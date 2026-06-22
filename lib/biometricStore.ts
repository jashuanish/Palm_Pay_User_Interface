'use client';

import { create } from 'zustand';
import { SerializedDescriptors } from './opencv/matcher';

export interface BiometricUser {
  id: string;
  name: string;
  palmId: string;
  walletId: string;
  token: string;
  createdAt: number;
  samples: SerializedDescriptors[];
  thumb: string; // dataURL preview of the enhanced ROI
}

const KEY = 'palmpay_biometrics_v1';

function load(): BiometricUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as BiometricUser[]) : [];
  } catch {
    return [];
  }
}

function persist(users: BiometricUser[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(users));
  } catch (e) {
    // localStorage quota — surface in console, keep in-memory state.
    console.warn('PalmPay: could not persist enrollments', e);
  }
}

interface BiometricStore {
  users: BiometricUser[];
  hydrated: boolean;
  hydrate: () => void;
  enroll: (user: BiometricUser) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useBiometrics = create<BiometricStore>((set, get) => ({
  users: [],
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ users: load(), hydrated: true });
  },
  enroll: (user) =>
    set((s) => {
      const users = [user, ...s.users.filter((u) => u.id !== user.id)];
      persist(users);
      return { users };
    }),
  remove: (id) =>
    set((s) => {
      const users = s.users.filter((u) => u.id !== id);
      persist(users);
      return { users };
    }),
  clear: () =>
    set(() => {
      persist([]);
      return { users: [] };
    }),
}));
