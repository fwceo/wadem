export interface DeliveryAddress {
  formatted: string;
  lat: number;
  lng: number;
  building?: string;
  floor?: string;
  desk?: string;
  unit?: string;
  addressType?: 'home' | 'apartment' | 'office' | 'other';
  notes?: string;
}

export interface SavedAddress extends DeliveryAddress {
  id: string;
  label: string;
  isDefault: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  address: DeliveryAddress;
  savedAddresses?: SavedAddress[];
  signupDate: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  referralCode: string;
  referredBy?: string;
  preferences: string[];
  dietaryRestrictions: string[];
  freeDeliveries?: number;
  hasSeenFreeDeliveryModal?: boolean;
}
