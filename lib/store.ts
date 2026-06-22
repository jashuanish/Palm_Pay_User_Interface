'use client';

import { create } from 'zustand';
import { PRIMARY_USER, PRODUCTS } from './mockData';
import { Product, Transaction } from './types';

interface CartItem {
  product: Product;
  qty: number;
}

interface PalmStore {
  // wallet
  balance: number;
  monthlySpend: number;
  // cart
  cart: CartItem[];
  // session
  authenticated: boolean;
  // ledger (recent payments made during the demo)
  ledger: Transaction[];

  addToCart: (p: Product) => void;
  removeFromCart: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartCount: () => number;

  setAuthenticated: (v: boolean) => void;
  charge: (amount: number, merchant: string) => Transaction;
  topUp: (amount: number) => void;
}

export const usePalmStore = create<PalmStore>((set, get) => ({
  balance: PRIMARY_USER.balance,
  monthlySpend: PRIMARY_USER.monthlySpend,
  cart: [],
  authenticated: false,
  ledger: [],

  addToCart: (p) =>
    set((s) => {
      const existing = s.cart.find((c) => c.product.id === p.id);
      if (existing) {
        return {
          cart: s.cart.map((c) =>
            c.product.id === p.id ? { ...c, qty: c.qty + 1 } : c
          ),
        };
      }
      return { cart: [...s.cart, { product: p, qty: 1 }] };
    }),

  removeFromCart: (id) =>
    set((s) => ({ cart: s.cart.filter((c) => c.product.id !== id) })),

  setQty: (id, qty) =>
    set((s) => ({
      cart:
        qty <= 0
          ? s.cart.filter((c) => c.product.id !== id)
          : s.cart.map((c) => (c.product.id === id ? { ...c, qty } : c)),
    })),

  clearCart: () => set({ cart: [] }),

  cartTotal: () =>
    get().cart.reduce((sum, c) => sum + c.product.price * c.qty, 0),

  cartCount: () => get().cart.reduce((sum, c) => sum + c.qty, 0),

  setAuthenticated: (v) => set({ authenticated: v }),

  charge: (amount, merchant) => {
    const tx: Transaction = {
      id: `tx_${Math.abs(amount * 7 + merchant.length).toString(16)}${Date.now().toString(16).slice(-5)}`,
      userId: PRIMARY_USER.id,
      userName: PRIMARY_USER.name,
      merchant,
      category: 'Shopping',
      amount,
      status: 'success',
      minutesAgo: 0,
      confidence: 98.72,
    };
    set((s) => ({
      balance: Math.max(0, s.balance - amount),
      monthlySpend: s.monthlySpend + amount,
      ledger: [tx, ...s.ledger],
      cart: [],
      authenticated: false,
    }));
    return tx;
  },

  topUp: (amount) => set((s) => ({ balance: s.balance + amount })),
}));

export const DEFAULT_PRODUCTS = PRODUCTS;
