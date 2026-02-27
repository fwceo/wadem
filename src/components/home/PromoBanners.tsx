'use client';

import { ReactNode } from 'react';
import { useUIStore } from '@/stores/ui';
import { SpeedIcon, FreeDeliveryIcon, AiPicksIcon } from '@/components/icons/ThemedIcons';

const banners: {
  id: string;
  bg: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  accent: string;
  action?: string;
}[] = [
  {
    id: 'speed',
    bg: 'bg-gradient-to-br from-secondary to-secondary/80',
    icon: <SpeedIcon size={40} />,
    title: '30 mins delivery',
    subtitle: 'Fresh food at your door, fast',
    accent: 'text-primary',
  },
  {
    id: 'office',
    bg: 'bg-gradient-to-br from-accent to-accent/80',
    icon: <FreeDeliveryIcon size={40} />,
    title: 'Free Delivery',
    subtitle: 'Our free delivery waiting for you',
    accent: 'text-white/80',
  },
  {
    id: 'ai',
    bg: 'bg-gradient-to-br from-primary to-primary-dark',
    icon: <AiPicksIcon size={40} />,
    title: 'AI-powered picks',
    subtitle: 'We know what you crave',
    accent: 'text-secondary/60',
    action: 'openAI',
  },
];

export default function PromoBanners() {
  const { openAI } = useUIStore();

  const handleBannerClick = (banner: typeof banners[number]) => {
    if (banner.action === 'openAI') {
      openAI();
    }
  };

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
      {banners.map((banner, i) => (
        <div
          key={banner.id}
          onClick={() => handleBannerClick(banner)}
          className={`flex-shrink-0 w-64 md:w-72 ${banner.bg} rounded-2xl p-5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 animate-fade-in-up`}
          style={{ animationDelay: `${100 + i * 80}ms` }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${banner.accent}`}>
                Wadem
              </p>
              <p className="text-xl font-extrabold mt-1.5 text-white leading-tight">
                {banner.title}
              </p>
              <p className="text-sm text-white/70 mt-1">
                {banner.subtitle}
              </p>
            </div>
            <div className="flex-shrink-0 ml-3">{banner.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
