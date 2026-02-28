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

  // Clear stale user state if no session cookie exists
  useEffect(() => {
    if (isAuthenticated) {
      const hasSession = document.cookie.includes('__session');
      if (!hasSession) {
        logout();
      }
    }
  }, [isAuthenticated, logout]);

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
