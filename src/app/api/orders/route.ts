import { NextRequest, NextResponse } from 'next/server';
import { generateOrderId } from '@/lib/utils';
import { sheetsService } from '@/lib/sheets';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerUid,
      deliveryAddress,
      restaurantId,
      restaurantName,
      items,
      subtotal,
      deliveryFee,
      serviceFee,
      discount,
      total,
      promoCode,
      deliveryNotes,
    } = body;

    if (!customerUid || !restaurantId || !items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields', code: 400 },
        { status: 400 }
      );
    }

    const orderId = generateOrderId();
    const order = {
      id: orderId,
      timestamp: new Date().toISOString(),
      customerName,
      customerPhone,
      customerUid,
      deliveryAddress,
      restaurantId,
      restaurantName,
      items: JSON.stringify(items),
      subtotal,
      deliveryFee,
      serviceFee,
      discount: discount || 0,
      total,
      promoCode: promoCode || '',
      status: 'New',
      paymentMethod: 'Cash on Delivery',
      deliveryNotes: deliveryNotes || '',
      estimatedDelivery: '25-35 min',
    };

    await sheetsService.createOrder(order);

    return NextResponse.json({ success: true, orderId, order });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create order', code: 500 },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId parameter required', code: 400 },
      { status: 400 }
    );
  }

  const orders = await sheetsService.getOrdersByUser(userId);

  return NextResponse.json({ orders });
}
