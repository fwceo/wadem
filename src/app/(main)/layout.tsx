'use client';

import dynamic from 'next/dynamic';
import TopBar from '@/components/home/TopBar';
import BottomNav from '@/components/home/BottomNav';

const CartSheet = dynamic(() => import('@/components/cart/CartSheet'), { ssr: false });
const AIChat = dynamic(() => import('@/components/ai/AIChat'), { ssr: false });

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <main className="pt-14 md:pt-16 pb-20 md:pb-6">{children}</main>
      <BottomNav />
      <CartSheet />
      <AIChat />
    </div>
  );
}
