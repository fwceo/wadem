'use client';

import { create } from 'zustand';

interface UIState {
  isCartOpen: boolean;
  isAIOpen: boolean;
  isSearchOpen: boolean;
  isDarkMode: boolean;
  activeTab: 'home' | 'search' | 'orders';
  toasts: Toast[];

  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openAI: () => void;
  closeAI: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  setDarkMode: (dark: boolean) => void;
  setActiveTab: (tab: 'home' | 'search' | 'orders') => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

let toastId = 0;

export const useUIStore = create<UIState>()((set) => ({
  isCartOpen: false,
  isAIOpen: false,
  isSearchOpen: false,
  isDarkMode: false,
  activeTab: 'home',
  toasts: [],

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((s) => ({ isCartOpen: !s.isCartOpen })),
  openAI: () => set({ isAIOpen: true }),
  closeAI: () => set({ isAIOpen: false }),
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  setDarkMode: (dark) => set({ isDarkMode: dark }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  addToast: (toast) => {
    const id = String(++toastId);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
