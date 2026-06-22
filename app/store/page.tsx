'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ScanLine, ShoppingBag, ShoppingCart, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { PaymentFlow } from '@/components/PaymentFlow';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlowButton } from '@/components/ui/GlowButton';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { DEFAULT_PRODUCTS, usePalmStore } from '@/lib/store';
import { playTap } from '@/lib/sound';
import { inr } from '@/lib/utils';

export default function StorePage() {
  const cart = usePalmStore((s) => s.cart);
  const addToCart = usePalmStore((s) => s.addToCart);
  const setQty = usePalmStore((s) => s.setQty);
  const removeFromCart = usePalmStore((s) => s.removeFromCart);
  const total = usePalmStore((s) => s.cartTotal());
  const count = usePalmStore((s) => s.cartCount());
  const charge = usePalmStore((s) => s.charge);

  const [checkout, setCheckout] = useState(false);

  const receiptItems = cart.map((c) => ({ name: c.product.name, qty: c.qty, price: c.product.price }));

  return (
    <PageShell particles={20} seed={9} footer={false}>
      <div className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <SectionHeading
          align="left"
          eyebrow="Transaction Simulator"
          title={
            <>
              The store of the future <span className="text-gradient">has no checkout line.</span>
            </>
          }
          subtitle="Add items to your cart, then pay with nothing but your palm. No QR. No card. No phone."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          {/* products */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {DEFAULT_PRODUCTS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
              >
                <GlassCard interactive glow="cyan" className="group flex h-full flex-col p-5">
                  <div className="relative mb-4 grid h-32 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-ink-600 to-ink-800">
                    <div className="absolute inset-0 bg-grid-faint [background-size:24px_24px] opacity-30" />
                    <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-all group-hover:bg-primary/20" />
                    <span className="relative text-5xl transition-transform duration-500 group-hover:scale-110">
                      {p.emoji}
                    </span>
                    <span className="absolute left-3 top-3 chip">{p.category}</span>
                  </div>
                  <h3 className="font-bold text-white">{p.name}</h3>
                  <p className="text-xs text-mist-400">{p.blurb}</p>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="text-lg font-black text-white">{inr(p.price)}</span>
                    <GlowButton
                      size="sm"
                      onClick={() => {
                        addToCart(p);
                        playTap();
                      }}
                    >
                      <Plus className="h-4 w-4" /> Add
                    </GlowButton>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* cart */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-white">
                  <ShoppingCart className="h-5 w-5 text-primary" /> Your Cart
                </h3>
                <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {count} {count === 1 ? 'item' : 'items'}
                </span>
              </div>

              <div className="mt-4 min-h-[120px] space-y-2">
                <AnimatePresence initial={false}>
                  {cart.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid place-items-center py-8 text-center"
                    >
                      <ShoppingBag className="h-8 w-8 text-mist-500" />
                      <p className="mt-2 text-sm text-mist-400">Your cart is empty</p>
                    </motion.div>
                  ) : (
                    cart.map((c) => (
                      <motion.div
                        key={c.product.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-2.5"
                      >
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-ink-700 text-xl">
                          {c.product.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{c.product.name}</p>
                          <p className="text-xs text-mist-400">{inr(c.product.price)}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setQty(c.product.id, c.qty - 1)}
                            className="grid h-6 w-6 place-items-center rounded-md bg-white/5 text-mist-200 hover:bg-white/10"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-semibold text-white">{c.qty}</span>
                          <button
                            onClick={() => setQty(c.product.id, c.qty + 1)}
                            className="grid h-6 w-6 place-items-center rounded-md bg-white/5 text-mist-200 hover:bg-white/10"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeFromCart(c.product.id)}
                            className="ml-1 grid h-6 w-6 place-items-center rounded-md text-mist-400 hover:text-danger"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm">
                <div className="flex justify-between text-mist-300">
                  <span>Subtotal</span>
                  <span>{inr(total)}</span>
                </div>
                <div className="flex justify-between text-mist-300">
                  <span>PalmPay fee</span>
                  <span className="text-accent">₹0 · free</span>
                </div>
                <div className="flex justify-between pt-1 text-lg font-black text-white">
                  <span>Total</span>
                  <span>{inr(total)}</span>
                </div>
              </div>

              <div className="mt-5">
                <GlowButton
                  size="lg"
                  className="w-full"
                  disabled={cart.length === 0}
                  onClick={() => setCheckout(true)}
                >
                  <ScanLine className="h-4 w-4" /> Place Palm to Pay
                </GlowButton>
                <p className="mt-2 text-center text-xs text-mist-500">
                  Secured by palm vein biometrics
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      <PaymentFlow
        open={checkout}
        amount={total}
        merchant="PalmPay Store"
        items={receiptItems}
        onCharge={() => charge(total, 'PalmPay Store')}
        onClose={() => setCheckout(false)}
      />
    </PageShell>
  );
}
