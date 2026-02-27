'use client';

import { use, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { useOrdersStore } from '@/stores/orders';
import { OrderStatus } from '@/types/order';
import { formatPrice } from '@/lib/utils';

const STEPS: { status: OrderStatus; label: string; pastLabel: string; icon: string; desc: string; pastDesc: string }[] = [
  { status: 'New', label: 'Order Placed', pastLabel: 'Order Placed', icon: '📝', desc: 'Your order has been received', pastDesc: 'Order was received' },
  { status: 'Accepted', label: 'Accepting', pastLabel: 'Accepted', icon: '✅', desc: 'Restaurant is confirming your order', pastDesc: 'Restaurant confirmed your order' },
  { status: 'Preparing', label: 'Preparing', pastLabel: 'Prepared', icon: '👨‍🍳', desc: 'Your food is being prepared', pastDesc: 'Food was prepared' },
  { status: 'On The Way', label: 'On The Way', pastLabel: 'Was On The Way', icon: '🛵', desc: 'Your rider is heading to you', pastDesc: 'Rider picked up your order' },
  { status: 'Delivered', label: 'Delivering', pastLabel: 'Delivered', icon: '🎉', desc: 'Almost there!', pastDesc: 'Enjoy your meal!' },
];

function formatStepTime(orderTimestamp: string, stepIndex: number, currentStepIndex: number): string | null {
  if (stepIndex > currentStepIndex) return null;
  const orderDate = new Date(orderTimestamp);
  const offsetMinutes = stepIndex * (3 + Math.floor(stepIndex * 2.5));
  const stepDate = new Date(orderDate.getTime() + offsetMinutes * 60000);
  return stepDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const order = useOrdersStore((s) => s.getOrder(id));
  const updateStatus = useOrdersStore((s) => s.updateStatus);
  const [simulating, setSimulating] = useState(false);

  // Simulate order progress for demo
  useEffect(() => {
    if (!order || order.status === 'Delivered' || order.status === 'Cancelled') return;

    const statusFlow: OrderStatus[] = ['New', 'Accepted', 'Preparing', 'On The Way', 'Delivered'];
    const currentIdx = statusFlow.indexOf(order.status);
    if (currentIdx < 0 || currentIdx >= statusFlow.length - 1) return;

    setSimulating(true);
    const timer = setTimeout(() => {
      updateStatus(id, statusFlow[currentIdx + 1]);
      setSimulating(false);
    }, 8000 + Math.random() * 7000); // 8-15 seconds between steps

    return () => clearTimeout(timer);
  }, [order?.status, id, updateStatus, order]);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <span className="text-5xl mb-4">🔍</span>
        <p className="text-text-secondary mb-4">Order not found</p>
        <Button onClick={() => router.push('/orders')}>Back to Orders</Button>
      </div>
    );
  }

  const currentStepIdx = STEPS.findIndex((s) => s.status === order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="px-4 pt-4 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/orders')} className="p-1">
          <svg className="w-5 h-5 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-text-primary">Track Order</h1>
          <p className="text-xs text-text-secondary">{order.id}</p>
        </div>
      </div>

      {/* Status Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6"
      >
        <div className="text-center mb-6">
          <motion.span
            key={order.status}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-5xl block mb-2"
          >
            {isCancelled ? '❌' : STEPS[currentStepIdx]?.icon || '📝'}
          </motion.span>
          <motion.h2
            key={`label-${order.status}`}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-lg font-bold text-text-primary"
          >
            {isCancelled ? 'Order Cancelled' : STEPS[currentStepIdx]?.label}
          </motion.h2>
          <p className="text-sm text-text-secondary mt-1">
            {isCancelled ? 'This order was cancelled' : STEPS[currentStepIdx]?.desc}
          </p>
          {simulating && !isCancelled && order.status !== 'Delivered' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-1.5 mt-3"
            >
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              <span className="text-xs text-primary font-medium">Updating...</span>
            </motion.div>
          )}
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <div className="space-y-0">
            {STEPS.map((step, i) => {
              const isCompleted = i <= currentStepIdx;
              const isCurrent = i === currentStepIdx;
              const isLast = i === STEPS.length - 1;

              return (
                <div key={step.status} className="flex gap-3">
                  {/* Line + Dot */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={isCurrent ? { scale: 0 } : {}}
                      animate={{ scale: 1 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                        isCompleted
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                    >
                      {isCompleted ? step.icon : (i + 1)}
                    </motion.div>
                    {!isLast && (
                      <div className={`w-0.5 h-8 ${i < currentStepIdx ? 'bg-primary' : 'bg-gray-200'}`} />
                    )}
                  </div>

                  {/* Text */}
                  <div className="pt-1 pb-4">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${isCompleted ? 'text-text-primary' : 'text-text-tertiary'}`}>
                        {isCompleted && !isCurrent ? step.pastLabel : step.label}
                      </p>
                      {isCompleted && (() => {
                        const time = formatStepTime(order.timestamp, i, currentStepIdx);
                        return time ? <span className="text-[11px] text-text-tertiary">{time}</span> : null;
                      })()}
                    </div>
                    <p className={`text-xs ${isCompleted ? 'text-text-secondary' : 'text-text-tertiary'}`}>
                      {isCompleted && !isCurrent ? step.pastDesc : step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Order Details */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6"
      >
        <h3 className="text-[15px] font-bold text-text-primary mb-3">Order Details</h3>

        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-50">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-lg">🏪</div>
          <div>
            <p className="text-sm font-semibold text-text-primary">{order.restaurantName}</p>
            {order.estimatedDelivery && (
              <p className="text-xs text-text-secondary">Est. delivery: {order.estimatedDelivery}</p>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs font-bold text-primary bg-primary/10 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0">
                  {item.quantity}x
                </span>
                <span className="text-text-primary truncate">{item.name}</span>
              </div>
              <span className="text-text-secondary ml-2 flex-shrink-0">{formatPrice(item.totalPrice || item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="pt-3 border-t border-gray-50 space-y-1.5 text-sm">
          <div className="flex justify-between text-text-secondary">
            <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Delivery</span><span>{formatPrice(order.deliveryFee)}</span>
          </div>
          {order.serviceFee > 0 && (
            <div className="flex justify-between text-text-secondary">
              <span>Service Fee</span><span>{formatPrice(order.serviceFee)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span><span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-text-primary text-base pt-1">
            <span>Total</span><span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </motion.div>

      {/* Delivery Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6"
      >
        <h3 className="text-[15px] font-bold text-text-primary mb-3">Delivery Info</h3>
        <div className="space-y-2 text-sm">
          {order.deliveryAddress && (
            <div className="flex gap-2">
              <span className="text-text-secondary">📍</span>
              <span className="text-text-primary">{order.deliveryAddress}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="text-text-secondary">💳</span>
            <span className="text-text-primary">{order.paymentMethod || 'Cash on Delivery'}</span>
          </div>
          {order.deliveryNotes && (
            <div className="flex gap-2">
              <span className="text-text-secondary">📝</span>
              <span className="text-text-primary">{order.deliveryNotes}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          fullWidth
          variant="secondary"
          onClick={() => router.push('/orders')}
        >
          Back to Orders
        </Button>
        {order.status === 'Delivered' && (
          <Button
            fullWidth
            onClick={() => router.push(`/restaurant/${order.restaurantId}`)}
          >
            Order Again
          </Button>
        )}
      </div>
    </div>
  );
}
