'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useOrdersStore } from '@/stores/orders';
import { OrderStatus } from '@/types/order';
import { formatPrice } from '@/lib/utils';

const STATUS_CONFIG: Record<OrderStatus, { color: string; bg: string; icon: string }> = {
  New: { color: 'text-blue-600', bg: 'bg-blue-50', icon: '🆕' },
  Accepted: { color: 'text-indigo-600', bg: 'bg-indigo-50', icon: '✅' },
  Preparing: { color: 'text-orange-600', bg: 'bg-orange-50', icon: '👨‍🍳' },
  'On The Way': { color: 'text-purple-600', bg: 'bg-purple-50', icon: '🛵' },
  Delivered: { color: 'text-green-600', bg: 'bg-green-50', icon: '🎉' },
  Cancelled: { color: 'text-red-600', bg: 'bg-red-50', icon: '❌' },
};

function formatOrderDate(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function OrdersPage() {
  const router = useRouter();
  const orders = useOrdersStore((s) => s.orders);

  const activeOrders = orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status));
  const pastOrders = orders.filter((o) => ['Delivered', 'Cancelled'].includes(o.status));

  if (orders.length === 0) {
    return (
      <div className="px-4 pt-4">
        <h1 className="text-[28px] font-extrabold text-text-primary mb-6">Your Orders</h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <span className="text-6xl mb-4">📋</span>
          <h3 className="text-lg font-bold text-text-primary mb-2">No orders yet</h3>
          <p className="text-text-secondary text-sm text-center mb-6 max-w-xs">
            When you place your first order, it will appear here. Start browsing restaurants!
          </p>
          <Button onClick={() => router.push('/')}>Browse Restaurants</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-24">
      <h1 className="text-[28px] font-extrabold text-text-primary mb-6">Your Orders</h1>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Active</h2>
          <div className="space-y-3">
            <AnimatePresence>
              {activeOrders.map((order, i) => {
                const cfg = STATUS_CONFIG[order.status];
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-bold text-text-primary truncate">{order.restaurantName}</p>
                        <p className="text-xs text-text-secondary mt-0.5">{order.id} · {formatOrderDate(order.timestamp)}</p>
                      </div>
                      <span className={`${cfg.bg} ${cfg.color} text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1`}>
                        <span>{cfg.icon}</span> {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <p className="text-xs text-text-secondary">
                        {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-sm font-bold text-text-primary">{formatPrice(order.total)}</p>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 flex gap-1">
                      {['New', 'Accepted', 'Preparing', 'On The Way', 'Delivered'].map((step, si) => {
                        const stepIdx = ['New', 'Accepted', 'Preparing', 'On The Way', 'Delivered'].indexOf(order.status);
                        return (
                          <div
                            key={step}
                            className={`h-1 flex-1 rounded-full ${si <= stepIdx ? 'bg-primary' : 'bg-gray-200'}`}
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Past Orders */}
      {pastOrders.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Past Orders</h2>
          <div className="space-y-3">
            {pastOrders.map((order, i) => {
              const cfg = STATUS_CONFIG[order.status];
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push(`/orders/${order.id}`)}
                  className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow opacity-80"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-text-primary truncate">{order.restaurantName}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{order.id} · {formatOrderDate(order.timestamp)}</p>
                    </div>
                    <span className={`${cfg.bg} ${cfg.color} text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1`}>
                      <span>{cfg.icon}</span> {order.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <p className="text-xs text-text-secondary">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-text-primary">{formatPrice(order.total)}</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => { e.stopPropagation(); router.push(`/restaurant/${order.restaurantId}`); }}
                      >
                        Reorder
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
