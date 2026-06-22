import {
  AuthLog,
  FraudAlert,
  Merchant,
  Product,
  Transaction,
  TxStatus,
  User,
} from './types';
import { mulberry32, pick, range } from './utils';

// Deterministic seed → identical data on server & client (no hydration drift).
const rng = mulberry32(20260622);

const FIRST = [
  'Aarav', 'Vivaan', 'Aditya', 'Diya', 'Ananya', 'Ishaan', 'Kabir', 'Meera',
  'Riya', 'Arjun', 'Saanvi', 'Reyansh', 'Anika', 'Vihaan', 'Myra', 'Aryan',
  'Kiara', 'Rohan', 'Tara', 'Dev', 'Naina', 'Karan', 'Zara', 'Yash',
  'Sara', 'Aditi', 'Neil', 'Ira', 'Veer', 'Pari', 'Advait', 'Nisha',
  'Rahul', 'Sneha', 'Manav', 'Aisha', 'Krish', 'Tanvi', 'Ved', 'Mira',
  'Arnav', 'Kavya', 'Shaurya', 'Avni', 'Laksh', 'Diya', 'Om', 'Siya',
  'Ayaan', 'Navya',
];
const LAST = [
  'Sharma', 'Verma', 'Iyer', 'Nair', 'Reddy', 'Mehta', 'Kapoor', 'Singh',
  'Patel', 'Gupta', 'Bose', 'Khanna', 'Malhotra', 'Rao', 'Joshi', 'Desai',
  'Chopra', 'Banerjee', 'Menon', 'Pillai',
];
const CITIES = [
  'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai',
  'Gurugram', 'Ahmedabad', 'Kolkata', 'Jaipur',
];
const TIERS = ['Standard', 'Plus', 'Elite'] as const;
const MERCHANT_NAMES = [
  'Blue Tokai Coffee', 'Aurora Mart', 'Nova Electronics', 'Pulse Pharmacy',
  'Halo Fashion', 'Orbit Books', 'Quantum Cafe', 'Vertex Grocers',
  'Lumen Bistro', 'Atlas Fuel', 'Echo Bakery', 'Prism Salon',
];
const CATEGORIES = [
  'Coffee', 'Groceries', 'Electronics', 'Pharmacy', 'Fashion', 'Books',
  'Dining', 'Fuel', 'Transit',
];
const DEVICES = [
  'Terminal · PP-Nova-04', 'Terminal · PP-Halo-11', 'Terminal · PP-Atlas-02',
  'Kiosk · PP-Metro-19', 'Terminal · PP-Pulse-07', 'Gate · PP-Transit-31',
];

function hex(len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) s += Math.floor(rng() * 16).toString(16);
  return s.toUpperCase();
}

function makeUser(i: number): User {
  const name = `${pick(rng, FIRST)} ${pick(rng, LAST)}`;
  const avgSpend = Math.round(180 + rng() * 520);
  return {
    id: `u_${i.toString().padStart(3, '0')}`,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]/g, '.')}@palm.id`,
    palmId: `PLM-${hex(4)}-${hex(4)}`,
    walletId: `WLT-${hex(6)}`,
    biometricToken: `bt_${hex(10).toLowerCase()}`,
    balance: Math.round(2400 + rng() * 88000),
    monthlySpend: Math.round(3200 + rng() * 28000),
    avgSpend,
    securityScore: Math.round(82 + rng() * 17),
    tier: pick(rng, [...TIERS]),
    enrolledDaysAgo: Math.round(2 + rng() * 420),
    city: pick(rng, CITIES),
    avatarHue: Math.round(rng() * 360),
    matchConfidence: 94 + Math.round(rng() * 59) / 10, // 94.x – 99.x
  };
}

export const USERS: User[] = range(50).map((i) => makeUser(i + 1));

// The "you" account used across wallet / store / auth demo flows.
export const PRIMARY_USER: User = {
  ...USERS[0],
  name: 'Aarav Sharma',
  email: 'aarav.sharma@palm.id',
  palmId: 'PLM-7F3A-9C21',
  walletId: 'WLT-4B8E1D',
  biometricToken: 'bt_9f2a7c41e0',
  balance: 48250,
  monthlySpend: 18420,
  avgSpend: 210,
  securityScore: 98,
  tier: 'Elite',
  city: 'Bengaluru',
  matchConfidence: 98.72,
};

export const TRANSACTIONS: Transaction[] = range(60).map((i) => {
  const u = pick(rng, USERS);
  const statusRoll = rng();
  const status: TxStatus =
    statusRoll > 0.93
      ? 'flagged'
      : statusRoll > 0.88
        ? 'declined'
        : statusRoll > 0.83
          ? 'pending'
          : 'success';
  return {
    id: `tx_${hex(8).toLowerCase()}`,
    userId: u.id,
    userName: u.name,
    merchant: pick(rng, MERCHANT_NAMES),
    category: pick(rng, CATEGORIES),
    amount: Math.round(60 + rng() * 4200),
    status,
    minutesAgo: Math.round(rng() * 60 * 36),
    confidence: 95 + Math.round(rng() * 49) / 10,
  };
}).sort((a, b) => a.minutesAgo - b.minutesAgo);

export const MERCHANTS: Merchant[] = MERCHANT_NAMES.map((name, i) => ({
  id: `m_${(i + 1).toString().padStart(2, '0')}`,
  name,
  category: pick(rng, CATEGORIES),
  city: pick(rng, CITIES),
  volume: Math.round(120000 + rng() * 4200000),
  terminals: Math.round(2 + rng() * 40),
  rating: 4 + Math.round(rng() * 9) / 10,
}));

export const AUTH_LOGS: AuthLog[] = range(40).map(() => {
  const u = pick(rng, USERS);
  const roll = rng();
  const result: AuthLog['result'] = roll > 0.92 ? 'rejected' : roll > 0.86 ? 'review' : 'matched';
  return {
    id: `auth_${hex(6).toLowerCase()}`,
    userName: u.name,
    palmId: u.palmId,
    result,
    confidence:
      result === 'matched'
        ? 96 + Math.round(rng() * 39) / 10
        : 40 + Math.round(rng() * 450) / 10,
    device: pick(rng, DEVICES),
    minutesAgo: Math.round(rng() * 60 * 12),
  };
}).sort((a, b) => a.minutesAgo - b.minutesAgo);

export const FRAUD_ALERTS: FraudAlert[] = [
  {
    id: 'fr_a1',
    userName: 'Aarav Sharma',
    reason: 'Spend 23.8× above 30-day average',
    amount: 5000,
    usualAmount: 210,
    riskScore: 92,
    severity: 'high',
    minutesAgo: 4,
    status: 'flagged',
  },
  {
    id: 'fr_b2',
    userName: 'Meera Nair',
    reason: 'Impossible travel — 2 cities in 9 min',
    amount: 1840,
    usualAmount: 460,
    riskScore: 97,
    severity: 'critical',
    minutesAgo: 12,
    status: 'blocked',
  },
  {
    id: 'fr_c3',
    userName: 'Rohan Mehta',
    reason: 'New merchant + off-hours pattern',
    amount: 2200,
    usualAmount: 700,
    riskScore: 64,
    severity: 'medium',
    minutesAgo: 26,
    status: 'flagged',
  },
  {
    id: 'fr_d4',
    userName: 'Anika Reddy',
    reason: 'Liveness confidence below threshold',
    amount: 980,
    usualAmount: 540,
    riskScore: 71,
    severity: 'high',
    minutesAgo: 38,
    status: 'blocked',
  },
  {
    id: 'fr_e5',
    userName: 'Kabir Singh',
    reason: 'Velocity: 6 taps in 90 seconds',
    amount: 320,
    usualAmount: 150,
    riskScore: 48,
    severity: 'low',
    minutesAgo: 51,
    status: 'cleared',
  },
  {
    id: 'fr_f6',
    userName: 'Tara Bose',
    reason: 'Device fingerprint mismatch',
    amount: 3400,
    usualAmount: 890,
    riskScore: 83,
    severity: 'high',
    minutesAgo: 73,
    status: 'flagged',
  },
];

export const PRODUCTS: Product[] = [
  { id: 'p_coffee', name: 'Single-Origin Coffee', price: 240, category: 'Cafe', blurb: 'Hand-roasted, 250g', emoji: '☕' },
  { id: 'p_head', name: 'Aura Headphones', price: 12990, category: 'Audio', blurb: 'Spatial ANC, 40h', emoji: '🎧' },
  { id: 'p_laptop', name: 'Nova Ultrabook 14', price: 98990, category: 'Computing', blurb: 'OLED · 32GB · 1TB', emoji: '💻' },
  { id: 'p_watch', name: 'Pulse Smartwatch', price: 24990, category: 'Wearable', blurb: 'ECG · LTE · Titanium', emoji: '⌚' },
  { id: 'p_books', name: 'Design Anthology', price: 1490, category: 'Books', blurb: 'Hardcover set of 3', emoji: '📚' },
  { id: 'p_snacks', name: 'Artisan Snack Box', price: 690, category: 'Grocery', blurb: 'Curated, 12 pieces', emoji: '🥨' },
];

// ---- Aggregate metrics for analytics dashboard ----
export const METRICS = {
  usersEnrolled: 248930,
  transactions: 5128740,
  successRate: 99.4,
  far: 0.0008, // false acceptance rate %
  frr: 0.42, // false rejection rate %
  authAccuracy: 99.31,
  avgPaymentMs: 740,
  uptime: 99.99,
  merchants: 14280,
  countries: 9,
};

export const SPEND_TREND = [
  { m: 'Jan', spend: 9200, txns: 41 },
  { m: 'Feb', spend: 12400, txns: 53 },
  { m: 'Mar', spend: 10800, txns: 48 },
  { m: 'Apr', spend: 15600, txns: 67 },
  { m: 'May', spend: 14200, txns: 61 },
  { m: 'Jun', spend: 18420, txns: 78 },
];

export const CATEGORY_SPLIT = [
  { name: 'Dining', value: 32, color: '#00E5FF' },
  { name: 'Groceries', value: 24, color: '#7B61FF' },
  { name: 'Transit', value: 16, color: '#00FFA3' },
  { name: 'Shopping', value: 18, color: '#FFB020' },
  { name: 'Other', value: 10, color: '#FF4D6D' },
];

export const GROWTH = range(12).map((i) => ({
  m: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
  users: Math.round(28000 * Math.pow(1.22, i)),
  txns: Math.round(120000 * Math.pow(1.27, i)),
}));

export const LATENCY = range(24).map((i) => ({
  h: `${i}:00`,
  ms: Math.round(620 + Math.sin(i / 3) * 120 + (i % 5) * 18),
}));

// Behaviour graph for the fraud demo (normal baseline vs. anomalous spike)
export const FRAUD_BEHAVIOUR = range(14).map((i) => ({
  d: `D${i + 1}`,
  amount: i === 13 ? 5000 : Math.round(150 + Math.sin(i) * 60 + (i % 3) * 30),
  baseline: 210,
}));
