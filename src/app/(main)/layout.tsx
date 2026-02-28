'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import TopBar from '@/components/home/TopBar';
import BottomNav from '@/components/home/BottomNav';
import FreeDeliveryBanner from '@/components/home/FreeDeliveryBanner';
import { useUserStore } from '@/stores/user';

const CartSheet = dynamic(() => import('@/components/cart/CartSheet'), { ssr: false });
const AIChat = dynamic(() => import('@/components/ai/AIChat'), { ssr: false });
const FreeDeliveryModal = dynamic(() => import('@/components/home/FreeDeliveryModal'), { ssr: false });

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const logout = useUserStore((s) => s.logout);

  // Validate session on mount — if user claims authenticated but server says no, clear state
  useEffect(() => {
    if (!isAuthenticated) return;
    // Check session validity via a lightweight API call (cookie is httpOnly, can't read from JS)
    fetch('/api/auth/session', { method: 'GET' })
      .then((res) => {
        if (res.status === 405 || res.status === 200) return; // session route exists, session valid or method not needed
        if (res.status === 401) logout(); // session invalid
      })
      .catch(() => {}); // network error — don't logout
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="pt-14 md:pt-16 pb-20 md:pb-6">{children}</main>
      <FreeDeliveryBanner />
      <BottomNav />
      <CartSheet />
      <AIChat />
      <FreeDeliveryModal />
    </div>
  );
}
