'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DeliveryAddress, SavedAddress, UserProfile } from '@/types';

// Sync user profile to backend (fire-and-forget)
function syncToBackend(user: UserProfile | null) {
  if (!user || !user.uid) return;
  fetch('/api/user/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  }).catch(() => {});
}

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
      setUser: (user) => {
        const fullUser = { ...user, savedAddresses: user.savedAddresses || [] };
        set({ user: fullUser, isAuthenticated: true });
        syncToBackend(fullUser);
      },
      setName: (name) =>
        set((state) => {
          if (!state.user) return {};
          const updated = { ...state.user, name };
          syncToBackend(updated);
          return { user: updated };
        }),
      setAddress: (address) =>
        set((state) => {
          if (!state.user) return {};
          const updated = { ...state.user, address };
          syncToBackend(updated);
          return { user: updated };
        }),
      updateProfile: (fields) =>
        set((state) => {
          if (!state.user) return {};
          const updated = { ...state.user, ...fields };
          syncToBackend(updated);
          return { user: updated };
        }),
      addSavedAddress: (address) =>
        set((state) => {
          if (!state.user) return {};
          const existing = state.user.savedAddresses || [];
          const updated = address.isDefault
            ? existing.map((a) => ({ ...a, isDefault: false }))
            : existing;
          const newUser = {
            ...state.user,
            savedAddresses: [...updated, address],
            ...(address.isDefault ? { address } : {}),
          };
          syncToBackend(newUser);
          return { user: newUser };
        }),
      removeSavedAddress: (id) =>
        set((state) => {
          if (!state.user) return {};
          const newUser = {
            ...state.user,
            savedAddresses: (state.user.savedAddresses || []).filter((a) => a.id !== id),
          };
          syncToBackend(newUser);
          return { user: newUser };
        }),
      setDefaultAddress: (id) =>
        set((state) => {
          if (!state.user) return {};
          const addresses = (state.user.savedAddresses || []).map((a) => ({
            ...a,
            isDefault: a.id === id,
          }));
          const defaultAddr = addresses.find((a) => a.isDefault);
          const newUser = {
            ...state.user,
            savedAddresses: addresses,
            ...(defaultAddr ? { address: defaultAddr } : {}),
          };
          syncToBackend(newUser);
          return { user: newUser };
        }),
      setLoading: (isLoading) => set({ isLoading }),
      useFreeDelivery: () =>
        set((state) => {
          if (!state.user || !state.user.freeDeliveries || state.user.freeDeliveries <= 0) return {};
          const newUser = { ...state.user, freeDeliveries: state.user.freeDeliveries - 1 };
          syncToBackend(newUser);
          return { user: newUser };
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
