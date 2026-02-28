'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/ui/Button';
import QuantitySelector from '@/components/ui/QuantitySelector';
import PriceDisplay from '@/components/ui/PriceDisplay';
import { useUIStore } from '@/stores/ui';
import { useCartStore } from '@/stores/cart';
import { useOrdersStore } from '@/stores/orders';
import { useUserStore } from '@/stores/user';
import { formatPrice, generateOrderId } from '@/lib/utils';
import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Order } from '@/types/order';

export default function CartSheet() {
  const router = useRouter();
  const { isCartOpen, closeCart, addToast, setActiveTab } = useUIStore();
  const {
    items,
    restaurantId,
    restaurantName,
    promoCode,
    discount,
    deliveryFee,
    serviceFee,
    freeDeliveryApplied,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTotal,
    applyFreeDelivery,
  } = useCartStore();
  const addOrder = useOrdersStore((s) => s.addOrder);
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const useFreeDelivery = useUserStore((s) => s.useFreeDelivery);

  // Check active address, fallback to first saved address
  const activeAddress = (user?.address?.formatted && user.address.formatted.trim())
    ? user.address
    : user?.savedAddresses?.find((a) => a.isDefault) || user?.savedAddresses?.[0] || null;
  const hasAddress = !!activeAddress;

  const [promoInput, setPromoInput] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const checkoutScrollRef = useRef<HTMLDivElement>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const subtotal = getSubtotal();
  const total = getTotal();

  const [lastOrderId, setLastOrderId] = useState('');

  const handlePlaceOrder = async () => {
    setIsPlacing(true);

    try {
      const orderId = generateOrderId();
      const orderItems = items.map((ci) => ({
        menuItemId: ci.menuItem.id,
        name: ci.menuItem.name,
        quantity: ci.quantity,
        price: ci.menuItem.price,
        customizations: ci.customizations,
        totalPrice: ci.totalPrice,
      }));

      const order: Order = {
        id: orderId,
        timestamp: new Date().toISOString(),
        customerName: user?.name || '',
        customerPhone: user?.phone || '',
        customerUid: user?.uid || '',
        deliveryAddress: activeAddress?.formatted || '',
        latLng: activeAddress?.lat && activeAddress?.lng ? `${activeAddress.lat},${activeAddress.lng}` : '',
        restaurantId: restaurantId || '',
        restaurantName: restaurantName || '',
        items: orderItems,
        subtotal,
        deliveryFee,
        serviceFee,
        discount,
        total,
        promoCode: promoCode || null,
        status: 'New',
        paymentMethod: 'Cash on Delivery',
        deliveryNotes,
        estimatedDelivery: '25-35 min',
      };

      // Save to local orders store
      addOrder(order);
      setLastOrderId(orderId);

      // Push to API
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });

      // Decrement free delivery if used
      if (freeDeliveryApplied) {
        useFreeDelivery();
      }

      setOrderPlaced(true);
    } catch {
      addToast({ type: 'error', message: 'Failed to place order. Please try again.' });
    } finally {
      setIsPlacing(false);
    }
  };

  const handleClearCart = useCallback(() => {
    clearCart();
    setShowClearConfirm(false);
    setShowCheckout(false);
    addToast({ type: 'info', message: 'Cart cleared' });
  }, [clearCart, addToast]);

  const [promoLoading, setPromoLoading] = useState(false);

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, userId: user?.uid || '', orderTotal: subtotal }),
      });
      const data = await res.json();
      if (data.valid && data.discount > 0) {
        useCartStore.getState().applyPromo(code, data.discount);
        setPromoInput('');
        addToast({ type: 'success', message: data.message || `Promo ${code} applied! -${formatPrice(data.discount)}` });
      } else {
        addToast({ type: 'error', message: data.message || 'Invalid promo code' });
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to validate promo code' });
    } finally {
      setPromoLoading(false);
    }
  };

  if (items.length === 0 && isCartOpen) {
    return (
      <BottomSheet isOpen={isCartOpen} onClose={closeCart} title="Your Cart">
        <div className="flex flex-col items-center justify-center py-16 px-6">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="text-6xl mb-4 block"
          >
            🛒
          </motion.span>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-bold text-text-primary mb-2"
          >
            Your cart is empty
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-text-secondary text-sm text-center mb-6"
          >
            Browse restaurants and add items to get started
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Button onClick={() => { closeCart(); setActiveTab('home'); router.push('/'); }}>Browse Restaurants</Button>
          </motion.div>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet isOpen={isCartOpen} onClose={closeCart} title={restaurantName || 'Your Cart'}>
      <AnimatePresence mode="wait">
        {orderPlaced ? (
          /* ── Order Placed Success Animation ── */
          <motion.div
            key="order-success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16 px-6"
          >
            {/* Animated checkmark circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
              className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-6"
            >
              <motion.svg
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-12 h-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </motion.div>

            {/* Confetti dots */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0.8],
                  x: Math.cos((i * Math.PI * 2) / 8) * 80,
                  y: Math.sin((i * Math.PI * 2) / 8) * 80 - 120,
                }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                className="absolute w-3 h-3 rounded-full"
                style={{ backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'][i] }}
              />
            ))}

            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-xl font-bold text-text-primary mb-2"
            >
              Order Placed!
            </motion.h3>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="text-text-secondary text-sm text-center mb-6"
            >
              Your order is being prepared. Track it in the Orders tab.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              <Button
                onClick={() => {
                  const oid = lastOrderId;
                  clearCart();
                  setOrderPlaced(false);
                  setShowCheckout(false);
                  closeCart();
                  router.push(oid ? `/orders/${oid}` : '/orders');
                }}
              >
                Track Your Order
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          /* ── Cart Contents ── */
          <motion.div key="cart-contents" className="flex flex-col h-full">
            {/* Clear Cart + Item count header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50">
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-text-secondary"
              >
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </motion.span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowClearConfirm(true)}
                className="text-sm text-red-500 font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear Cart
              </motion.button>
            </div>

            {/* Clear cart confirmation */}
            <AnimatePresence>
              {showClearConfirm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mx-4 mt-2 p-3 bg-red-50 rounded-xl flex items-center justify-between">
                    <span className="text-sm text-red-700">Remove all items?</span>
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowClearConfirm(false)}
                        className="text-sm text-text-secondary font-medium px-3 py-1 rounded-lg bg-white"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleClearCart}
                        className="text-sm text-white font-medium px-3 py-1 rounded-lg bg-red-500"
                      >
                        Clear
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto px-4 py-2">
              <AnimatePresence>
                {items.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-3 py-3 border-b border-gray-100"
                  >
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {item.menuItem.image ? (
                        <Image
                          src={item.menuItem.image}
                          alt={item.menuItem.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl text-gray-300">🍽️</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">
                        {item.menuItem.name}
                      </p>
                      {item.customizations.length > 0 && (
                        <p className="text-xs text-text-secondary truncate">
                          {item.customizations
                            .flatMap((c) => c.selectedOptions.map((o) => o.name))
                            .join(', ')}
                        </p>
                      )}
                      <PriceDisplay price={item.totalPrice} size="sm" />
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <QuantitySelector
                        quantity={item.quantity}
                        onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
                        onDecrement={() => {
                          if (item.quantity <= 1) {
                            removeItem(item.id);
                          } else {
                            updateQuantity(item.id, item.quantity - 1);
                          }
                        }}
                        min={0}
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Price breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 space-y-2 text-sm"
              >
                <div className="flex justify-between">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="text-text-primary">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Delivery Fee</span>
                  {freeDeliveryApplied ? (
                    <span className="text-accent font-medium">Free 🎉</span>
                  ) : (
                    <span className="text-text-primary">{formatPrice(deliveryFee)}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Service Fee</span>
                  <span className="text-text-primary">{formatPrice(serviceFee)}</span>
                </div>
                {promoCode && discount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between"
                  >
                    <span className="text-success font-medium">Promo: {promoCode}</span>
                    <span className="text-success font-medium">-{formatPrice(discount)}</span>
                  </motion.div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="text-lg font-bold text-text-primary">Total</span>
                  <motion.span
                    key={total}
                    initial={{ scale: 1.15 }}
                    animate={{ scale: 1 }}
                    className="text-lg font-bold text-text-primary"
                  >
                    {formatPrice(total)}
                  </motion.span>
                </div>
              </motion.div>

              {/* Promo code input */}
              {!promoCode && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <form onSubmit={(e) => { e.preventDefault(); handleApplyPromo(); }} className="flex gap-2 mt-4">
                    <input
                      type="text"
                      placeholder="🎟️ Enter promo code"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                    />
                    <Button type="submit" size="sm" onClick={handleApplyPromo} disabled={!promoInput.trim()} loading={promoLoading}>
                      Apply
                    </Button>
                  </form>
                </motion.div>
              )}

            </div>

            {/* Sticky bottom — checkout details + CTA always visible */}
            <div className="flex-shrink-0 border-t border-gray-100 bg-white">
              <AnimatePresence>
                {showCheckout && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 pt-3 space-y-2.5 overflow-hidden"
                  >
                    <div className={`rounded-xl p-3 ${hasAddress ? 'bg-gray-50' : 'bg-red-50 border border-red-200'}`}>
                      <p className="text-xs text-text-secondary mb-1">Delivery Address</p>
                      {hasAddress ? (
                        <p className="text-sm font-medium text-text-primary">{activeAddress?.formatted}</p>
                      ) : (
                        <button
                          onClick={() => { closeCart(); router.push('/onboarding'); }}
                          className="text-sm font-semibold text-red-600 hover:text-red-700"
                        >
                          ⚠ No address set — tap to add one
                        </button>
                      )}
                    </div>
                    <textarea
                      placeholder="Delivery instructions (optional)"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary resize-none transition-colors"
                    />
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-text-secondary mb-1">Payment Method</p>
                      <p className="text-sm font-medium text-text-primary">💵 Cash on Delivery</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="p-4">
                {!showCheckout ? (
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Button fullWidth size="lg" onClick={() => {
                      if (!isAuthenticated) {
                        closeCart();
                        router.push('/login?redirect=/');
                        return;
                      }
                      if (!freeDeliveryApplied && (user?.freeDeliveries ?? 0) > 0) {
                        applyFreeDelivery();
                      }
                      setShowCheckout(true);
                    }}>
                      {isAuthenticated ? `Checkout — ${formatPrice(total)}` : 'Sign in to checkout'}
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.98 }}
                    ref={checkoutScrollRef}
                  >
                    <Button fullWidth size="lg" onClick={() => {
                      if (!hasAddress) return;
                      if (!hasScrolledToBottom) {
                        checkoutScrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        setHasScrolledToBottom(true);
                        return;
                      }
                      handlePlaceOrder();
                    }} loading={isPlacing} disabled={!hasAddress}>
                      {!hasAddress ? 'Add address to order' : isPlacing ? 'Placing Order...' : !hasScrolledToBottom ? `Review & Place Order — ${formatPrice(total)}` : `Place Order — ${formatPrice(total)}`}
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BottomSheet>
  );
}
