import { Request } from 'express';

// Define enum types locally to avoid Prisma dependency issues
export type UserRole = 'ADMIN' | 'AGENT' | 'USER';
export type PackType = 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
export type PaymentMethod = 'CASH' | 'ORANGE_MONEY' | 'WAVE' | 'FREE_MONEY' | 'CARD' | 'OTHER';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING';

// Export enum values for runtime use
export const UserRole = {
  ADMIN: 'ADMIN',
  AGENT: 'AGENT',
  USER: 'USER',
} as const;

export const PackType = {
  BASIC: 'BASIC',
  PREMIUM: 'PREMIUM',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export const PaymentMethod = {
  CASH: 'CASH',
  ORANGE_MONEY: 'ORANGE_MONEY',
  WAVE: 'WAVE',
  FREE_MONEY: 'FREE_MONEY',
  CARD: 'CARD',
  OTHER: 'OTHER',
} as const;

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
  PENDING: 'PENDING',
} as const;

// Extension de la requête Express pour inclure l'utilisateur authentifié
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

// Types pour la création d'un commerçant
export interface CreateMerchantDTO {
  businessName: string;
  ownerName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email?: string;
  description?: string;
  category?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  primaryColor?: string;
  secondaryColor?: string;
  useGradient?: boolean;
}

// Types pour la mise à jour d'un commerçant
export interface UpdateMerchantDTO {
  businessName?: string;
  ownerName?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  email?: string;
  description?: string;
  category?: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  primaryColor?: string;
  secondaryColor?: string;
  useGradient?: boolean;
  isActive?: boolean;
  isVerified?: boolean;
}

// Types pour les horaires d'ouverture
export interface OpeningHoursDTO {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

// Types pour les moyens de paiement
export interface PaymentMethodDTO {
  paymentMethod: PaymentMethod;
  accountNumber: string;
  accountName: string;
}

// Types pour la création d'une carte
export interface CreateBusinessCardDTO {
  merchantId: string;
  cardType: PackType;
  nfcEnabled?: boolean;
  expiresAt: Date;
}

// Types pour l'authentification
export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Types pour les statistiques
export interface ScanStats {
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  scansThisMonth: number;
  scansByDay: Array<{ date: string; count: number }>;
  scansByDevice: Array<{ deviceType: string; count: number }>;
}

export interface DashboardStats {
  totalMerchants: number;
  activeMerchants: number;
  totalScans: number;
  totalRevenue: number;
  recentMerchants: any[];
  recentScans: any[];
}