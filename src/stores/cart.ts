'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { CartItem, SelectedCustomization } from '@/types/order';
import { MenuItem } from '@/types/restaurant';

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  restaurantName: string | null;
  promoCode: string | null;
  discount: number;
  deliveryFee: number;
  serviceFee: number;
  freeDeliveryApplied: boolean;

  addItem: (
    item: MenuItem,
    qty: number,
    customizations?: SelectedCustomization[],
    restaurantId?: string,
    restaurantName?: string
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, qty: number) => void;
  applyPromo: (code: string, discount: number) => void;
  removePromo: () => void;
  applyFreeDelivery: () => void;
  clearCart: () => void;
  setRestaurant: (id: string, name: string) => void;

  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

function calculateItemPrice(
  item: MenuItem,
  qty: number,
  customizations?: SelectedCustomization[]
): number {
  let basePrice = item.price;
  if (customizations) {
    for (const c of customizations) {
      for (const opt of c.selectedOptions) {
        basePrice += opt.price;
      }
    }
  }
  return basePrice * qty;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      restaurantName: null,
      promoCode: null,
      discount: 0,
      deliveryFee: 3000,
      serviceFee: 1500,
      freeDeliveryApplied: false,

      addItem: (item, qty, customizations = [], restaurantId, restaurantName) => {
        set((state) => {
          // Check if an identical item (same menuItem.id + same customizations) already exists
          const custKey = JSON.stringify((customizations || []).map(c => ({ id: c.customizationId, opts: c.selectedOptions.map(o => o.id).sort() })));
          const existingIdx = state.items.findIndex((ci) => {
            const ciCustKey = JSON.stringify((ci.customizations || []).map(c => ({ id: c.customizationId, opts: c.selectedOptions.map(o => o.id).sort() })));
            return ci.menuItem.id === item.id && ciCustKey === custKey;
          });

          if (existingIdx >= 0) {
            // Group: increment quantity on existing item
            const updated = [...state.items];
            const existing = updated[existingIdx];
            const newQty = existing.quantity + qty;
            updated[existingIdx] = {
              ...existing,
              quantity: newQty,
              totalPrice: calculateItemPrice(existing.menuItem, newQty, existing.customizations),
            };
            return {
              items: updated,
              restaurantId: restaurantId ?? state.restaurantId,
              restaurantName: restaurantName ?? state.restaurantName,
            };
          }

          // New item
          const totalPrice = calculateItemPrice(item, qty, customizations);
          const cartItem: CartItem = {
            id: uuidv4(),
            menuItem: item,
            quantity: qty,
            customizations,
            totalPrice,
          };
          return {
            items: [...state.items, cartItem],
            restaurantId: restaurantId ?? state.restaurantId,
            restaurantName: restaurantName ?? state.restaurantName,
          };
        });
      },

      removeItem: (cartItemId) =>
        set((state) => {
          const newItems = state.items.filter((i) => i.id !== cartItemId);
          if (newItems.length === 0) {
            return {
              items: [],
              restaurantId: null,
              restaurantName: null,
              promoCode: null,
              discount: 0,
            };
          }
          return { items: newItems };
        }),

      updateQuantity: (cartItemId, qty) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === cartItemId
              ? {
                  ...item,
                  quantity: qty,
                  totalPrice: calculateItemPrice(item.menuItem, qty, item.customizations),
                }
              : item
          ),
        })),

      applyPromo: (code, discount) => set({ promoCode: code, discount }),
      removePromo: () => set({ promoCode: null, discount: 0 }),
      applyFreeDelivery: () => set({ freeDeliveryApplied: true }),

      clearCart: () =>
        set({
          items: [],
          restaurantId: null,
          restaurantName: null,
          promoCode: null,
          discount: 0,
          freeDeliveryApplied: false,
        }),

      setRestaurant: (id, name) => set({ restaurantId: id, restaurantName: name }),

      getSubtotal: () => get().items.reduce((sum, item) => sum + item.totalPrice, 0),

      getTotal: () => {
        const state = get();
        const subtotal = state.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const effectiveDeliveryFee = state.freeDeliveryApplied ? 0 : state.deliveryFee;
        return Math.max(0, subtotal + effectiveDeliveryFee + state.serviceFee - state.discount);
      },

      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'wadem-cart',
    }
  )
);
