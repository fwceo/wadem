import { NextRequest, NextResponse } from 'next/server';
import { sheetsService } from '@/lib/sheets';

interface ValidateRequest {
  code: string;
  userId: string;
  orderTotal: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateRequest = await request.json();
    const { code, userId, orderTotal } = body;

    if (!code) {
      return NextResponse.json(
        { valid: false, discount: 0, message: 'Please enter a promo code' },
        { status: 400 }
      );
    }

    const result = await sheetsService.validatePromo(code, userId || '', orderTotal);

    if (result.valid) {
      await sheetsService.incrementPromoUsage(code);
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { valid: false, discount: 0, message: 'Failed to validate promo' },
      { status: 500 }
    );
  }
}
