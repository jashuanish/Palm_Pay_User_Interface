import {
  Activity,
  BadgeIndianRupee,
  Fingerprint,
  LayoutDashboard,
  LineChart,
  Network,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Store,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  desc: string;
  icon: any;
}

export const PLATFORM_NAV: NavItem[] = [
  { href: '/register', label: 'Palm Registration', desc: 'Enroll a palm vein identity', icon: Fingerprint },
  { href: '/authenticate', label: 'Authentication Terminal', desc: 'Identify a palm in real time', icon: ScanLine },
  { href: '/wallet', label: 'Wallet Dashboard', desc: 'Balance, spend & security', icon: LayoutDashboard },
  { href: '/store', label: 'Transaction Simulator', desc: 'Shop & pay with your palm', icon: ShoppingBag },
  { href: '/merchant', label: 'Merchant Terminal', desc: 'Request & collect payments', icon: Store },
  { href: '/fraud', label: 'AI Fraud Detection', desc: 'Behavioural risk engine', icon: ShieldCheck },
  { href: '/security', label: 'Security Center', desc: 'Encryption & liveness', icon: ShieldCheck },
  { href: '/analytics', label: 'Analytics', desc: 'Business intelligence', icon: LineChart },
  { href: '/architecture', label: 'System Architecture', desc: 'Live data flow', icon: Network },
];

export const QUICK_NAV: NavItem[] = [
  { href: '/authenticate', label: 'Authenticate', desc: '', icon: ScanLine },
  { href: '/store', label: 'Store', desc: '', icon: ShoppingBag },
  { href: '/wallet', label: 'Wallet', desc: '', icon: BadgeIndianRupee },
  { href: '/analytics', label: 'Analytics', desc: '', icon: Activity },
];
