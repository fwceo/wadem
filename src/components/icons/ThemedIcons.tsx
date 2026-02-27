'use client';

interface IconProps {
  className?: string;
  size?: number;
}

// ─── Promo Banner Icons ───

export function SpeedIcon({ className = '', size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="22" fill="#FFC107" opacity="0.2" />
      <path d="M24 8C15.16 8 8 15.16 8 24s7.16 16 16 16 16-7.16 16-16S32.84 8 24 8zm0 28c-6.63 0-12-5.37-12-12S17.37 12 24 12s12 5.37 12 12-5.37 12-12 12z" fill="#FFC107" />
      <path d="M24 14v10l7 4" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 10l4-2m-4 32l4 2M18 10l-4-2m4 32l-4 2" stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

export function FreeDeliveryIcon({ className = '', size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="22" fill="#ffffff" opacity="0.15" />
      <rect x="6" y="18" width="22" height="14" rx="2" fill="#ffffff" opacity="0.9" />
      <path d="M28 20h6l6 6v6h-6" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="15" cy="34" r="3" fill="#22C55E" stroke="#ffffff" strokeWidth="1.5" />
      <circle cx="35" cy="34" r="3" fill="#22C55E" stroke="#ffffff" strokeWidth="1.5" />
      <path d="M12 22h10" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 26h6" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function AiPicksIcon({ className = '', size = 32 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="24" r="22" fill="#111111" opacity="0.15" />
      <rect x="14" y="12" width="20" height="24" rx="4" fill="#111111" opacity="0.8" />
      <circle cx="20" cy="22" r="2.5" fill="#FFC107" />
      <circle cx="28" cy="22" r="2.5" fill="#FFC107" />
      <path d="M19 30c0 0 2 3 5 3s5-3 5-3" stroke="#FFC107" strokeWidth="2" strokeLinecap="round" />
      <rect x="22" y="8" width="4" height="6" rx="2" fill="#111111" opacity="0.6" />
      <circle cx="10" cy="16" r="1.5" fill="#FFC107" opacity="0.5" />
      <circle cx="38" cy="16" r="1.5" fill="#FFC107" opacity="0.5" />
      <circle cx="12" cy="28" r="1" fill="#FFC107" opacity="0.3" />
      <circle cx="36" cy="28" r="1" fill="#FFC107" opacity="0.3" />
    </svg>
  );
}

// ─── Profile Page Icons ───

export function HomeIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V10.5z" fill="#FFC107" opacity="0.15" stroke="#FFC107" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 21V14h6v7" stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ApartmentIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" fill="#FFC107" opacity="0.15" stroke="#FFC107" strokeWidth="1.5" />
      <rect x="8" y="7" width="3" height="3" rx="0.5" fill="#FFC107" opacity="0.5" />
      <rect x="13" y="7" width="3" height="3" rx="0.5" fill="#FFC107" opacity="0.5" />
      <rect x="8" y="12" width="3" height="3" rx="0.5" fill="#FFC107" opacity="0.5" />
      <rect x="13" y="12" width="3" height="3" rx="0.5" fill="#FFC107" opacity="0.5" />
      <path d="M10 21v-3h4v3" stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OfficeIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="7" width="18" height="14" rx="2" fill="#FFC107" opacity="0.15" stroke="#FFC107" strokeWidth="1.5" />
      <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 13h18" stroke="#FFC107" strokeWidth="1.5" />
      <circle cx="12" cy="13" r="1.5" fill="#FFC107" />
    </svg>
  );
}

export function PinIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#FFC107" opacity="0.15" stroke="#FFC107" strokeWidth="1.5" />
      <circle cx="12" cy="9" r="2.5" fill="#FFC107" />
    </svg>
  );
}

export function FoodPrefsIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="13" r="8" fill="#FFC107" opacity="0.15" stroke="#FFC107" strokeWidth="1.5" />
      <path d="M8 13h8" stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M15 6l-1 5m-4-5l1 5m-3-5h6" stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NotificationIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9z" fill="#FFC107" opacity="0.15" stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.73 21a2 2 0 01-3.46 0" stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function GlobeIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" fill="#FFC107" opacity="0.15" stroke="#FFC107" strokeWidth="1.5" />
      <path d="M3 12h18M12 3c-2.5 3-3.5 6-3.5 9s1 6 3.5 9c2.5-3 3.5-6 3.5-9s-1-6-3.5-9z" stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TermsIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="5" y="2" width="14" height="20" rx="2" fill="#FFC107" opacity="0.15" stroke="#FFC107" strokeWidth="1.5" />
      <path d="M9 7h6m-6 4h6m-6 4h4" stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function SupportIcon({ className = '', size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 12c0 4.97-4.03 9-9 9a9.4 9.4 0 01-3.28-.59L4 22l1.59-4.72A8.96 8.96 0 013 12c0-4.97 4.03-9 9-9s9 4.03 9 9z" fill="#FFC107" opacity="0.15" stroke="#FFC107" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h.01M12 12h.01M15 12h.01" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
