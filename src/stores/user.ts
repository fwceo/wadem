'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DeliveryAddress, SavedAddress, UserProfile } from '@/types';

interface UserState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  phone: string;
  confirmationResult: unknown;

  setPhone: (phone: string) => void;
  setConfirmationResult: (result: unknown) => void;
  setUser: (user: UserProfile) => void;
  setName: (name: string) => void;
  setAddress: (address: DeliveryAddress) => void;
  setLoading: (loading: boolean) => void;
  updateProfile: (fields: Partial<Pick<UserProfile, 'name' | 'phone' | 'email' | 'preferences' | 'dietaryRestrictions'>>) => void;
  addSavedAddress: (address: SavedAddress) => void;
  removeSavedAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  useFreeDelivery: () => void;
  setFreeDeliveryModalSeen: () => void;
  logout: () => void;
}

const emptyUser = (phone: string): UserProfile => ({
  uid: '',
  name: '',
  phone,
  address: { formatted: '', lat: 0, lng: 0 },
  savedAddresses: [],
  signupDate: new Date().toISOString(),
  totalOrders: 0,
  totalSpent: 0,
  referralCode: '',
  preferences: [],
  dietaryRestrictions: [],
});

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      phone: '',
      confirmationResult: null,

      setPhone: (phone) => set({ phone }),
      setConfirmationResult: (result) => set({ confirmationResult: result }),
      setUser: (user) => set({ user: { ...user, savedAddresses: user.savedAddresses || [] }, isAuthenticated: true }),
      setName: (name) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, name }
            : { ...emptyUser(state.phone), name },
        })),
      setAddress: (address) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, address }
            : { ...emptyUser(state.phone), address },
        })),
      updateProfile: (fields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...fields } : null,
        })),
      addSavedAddress: (address) =>
        set((state) => {
          if (!state.user) return {};
          const existing = state.user.savedAddresses || [];
          // If new address is default, unset others
          const updated = address.isDefault
            ? existing.map((a) => ({ ...a, isDefault: false }))
            : existing;
          return {
            user: {
              ...state.user,
              savedAddresses: [...updated, address],
              // Also set as active address if default
              ...(address.isDefault ? { address } : {}),
            },
          };
        }),
      removeSavedAddress: (id) =>
        set((state) => {
          if (!state.user) return {};
          return {
            user: {
              ...state.user,
              savedAddresses: (state.user.savedAddresses || []).filter((a) => a.id !== id),
            },
          };
        }),
      setDefaultAddress: (id) =>
        set((state) => {
          if (!state.user) return {};
          const addresses = (state.user.savedAddresses || []).map((a) => ({
            ...a,
            isDefault: a.id === id,
          }));
          const defaultAddr = addresses.find((a) => a.isDefault);
          return {
            user: {
              ...state.user,
              savedAddresses: addresses,
              ...(defaultAddr ? { address: defaultAddr } : {}),
            },
          };
        }),
      setLoading: (isLoading) => set({ isLoading }),
      useFreeDelivery: () =>
        set((state) => {
          if (!state.user || !state.user.freeDeliveries || state.user.freeDeliveries <= 0) return {};
          return { user: { ...state.user, freeDeliveries: state.user.freeDeliveries - 1 } };
        }),
      setFreeDeliveryModalSeen: () =>
        set((state) => {
          if (!state.user) return {};
          return { user: { ...state.user, hasSeenFreeDeliveryModal: true } };
        }),
      logout: () => {
        // Clear server session cookie
        fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
        set({
          user: null,
          isAuthenticated: false,
          phone: '',
          confirmationResult: null,
        });
      },
    }),
    {
      name: 'wadem-user',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
