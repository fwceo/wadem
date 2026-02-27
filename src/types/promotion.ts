export type PromoType = 'percentage' | 'fixed' | 'free_delivery';
export type TargetAudience = 'all' | 'new' | 'returning' | 'referral';

export interface Promotion {
  code: string;
  type: PromoType;
  value: number;
  minOrder: number;
  maxDiscount: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  targetAudience: TargetAudience;
  active: boolean;
}

export interface PromoResult {
  valid: boolean;
  discount: number;
  message: string;
}
