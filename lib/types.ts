export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | ClassValue[]
  | Record<string, boolean | undefined | null>;

export interface User {
  id: string;
  name: string;
  email: string;
  palmId: string;
  walletId: string;
  biometricToken: string;
  balance: number;
  monthlySpend: number;
  avgSpend: number;
  securityScore: number;
  tier: 'Standard' | 'Plus' | 'Elite';
  enrolledDaysAgo: number;
  city: string;
  avatarHue: number;
  matchConfidence: number;
}

export type TxStatus = 'success' | 'pending' | 'declined' | 'flagged';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  merchant: string;
  category: string;
  amount: number;
  status: TxStatus;
  minutesAgo: number;
  confidence: number;
}

export interface Merchant {
  id: string;
  name: string;
  category: string;
  city: string;
  volume: number;
  terminals: number;
  rating: number;
}

export interface AuthLog {
  id: string;
  userName: string;
  palmId: string;
  result: 'matched' | 'rejected' | 'review';
  confidence: number;
  device: string;
  minutesAgo: number;
}

export interface FraudAlert {
  id: string;
  userName: string;
  reason: string;
  amount: number;
  usualAmount: number;
  riskScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  minutesAgo: number;
  status: 'flagged' | 'blocked' | 'cleared';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  blurb: string;
  emoji: string;
}
