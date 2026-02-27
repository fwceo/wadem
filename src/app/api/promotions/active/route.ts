import { NextResponse } from 'next/server';
import { sheetsService } from '@/lib/sheets';

export async function GET() {
  // Try Google Sheets first, fall back to hardcoded promos
  const sheetPromos = await sheetsService.getActivePromos();

  if (sheetPromos.length > 0) {
    return NextResponse.json({ promotions: sheetPromos });
  }

  // Fallback hardcoded promos
  const activePromos = [
    {
      code: 'FIRST50',
      type: 'percentage',
      value: 50,
      description: '50% off your first order (max 10,000 IQD)',
      minOrder: 10000,
      targetAudience: 'new',
    },
    {
      code: 'FREEDEL',
      type: 'free_delivery',
      value: 0,
      description: 'Free delivery on any order',
      minOrder: 0,
      targetAudience: 'all',
    },
    {
      code: 'LUNCH15',
      type: 'percentage',
      value: 15,
      description: '15% off orders placed 11am-1pm',
      minOrder: 12000,
      targetAudience: 'all',
    },
    {
      code: 'WADEM20',
      type: 'percentage',
      value: 20,
      description: '20% off orders over 50,000 IQD',
      minOrder: 50000,
      targetAudience: 'all',
    },
  ];

  return NextResponse.json({ promotions: activePromos });
}
