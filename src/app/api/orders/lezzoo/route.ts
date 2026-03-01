import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUid } from '@/lib/auth-guard';
import { createLezzooOrder, mapToLezzooCart, isLezzooConfigured } from '@/lib/lezzoo-orders';

export async function POST(request: NextRequest) {
  try {
    const uid = await getAuthenticatedUid();
    if (!uid) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!isLezzooConfigured()) {
      return NextResponse.json({ error: 'Lezzoo integration not configured' }, { status: 503 });
    }

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      restaurantLezzooId,
      items,
      subtotal,
      total,
      discount,
      deliveryFee,
      wademOrderId,
    } = body;

    if (!restaurantLezzooId || !items?.length || !deliveryLat || !deliveryLng) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const cartData = mapToLezzooCart(
      items.map((item: { menuItemId: string; name: string; quantity: number; price: number; totalPrice: number }) => ({
        menuItemId: item.menuItemId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.totalPrice,
      })),
      restaurantLezzooId
    );

    const result = await createLezzooOrder({
      lezzoo_merchant_id: restaurantLezzooId,
      customer_phone: customerPhone || '',
      customer_city: 'Erbil',
      customer_address_title: deliveryAddress || 'Delivery Address',
      order_latitude: deliveryLat,
      order_longitude: deliveryLng,
      order_subtotal: subtotal,
      order_total: total,
      order_discount: discount || 0,
      order_delivery_price: deliveryFee || 0,
      cart_data: cartData,
      wadem_order_id: wademOrderId,
      customer_name: customerName || '',
    });

    if (result.status === 'success') {
      return NextResponse.json({
        success: true,
        lezzooOrderId: result.data?.orderId,
        lezzooStatus: result.data?.order_status,
      });
    }

    return NextResponse.json({ error: result.message }, { status: 500 });
  } catch {
    return NextResponse.json({ error: 'Failed to create Lezzoo order' }, { status: 500 });
  }
}
