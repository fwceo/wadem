// Lezzoo Order Integration API client
// Docs: WADEM_API_GUIDE.md

const HOOKS_HOST = process.env.WADEM_HOOKS_HOST || '';
const API_KEY = process.env.WADEM_API_KEY || '';

export interface LezzooCartItem {
  product_id: number;
  id: number;
  product_name: { en: string; kr: string; ar: string; bd: string };
  name: { en: string; kr: string; ar: string; bd: string };
  product_merchant: number;
  merchant: number;
  merchant_id: number;
  category_id: number;
  product_image: string;
  product_price: number;
  product_discount: number;
  single_product_price: number;
  single_product_subtotal: number;
  productTotalPrice: number;
  quantity: number;
  price: number;
  addons: unknown[];
  category_name: { en: string; ar: string; kr: string; bd: string };
}

export interface CreateLezzooOrderRequest {
  lezzoo_merchant_id: number;
  customer_phone: string;
  customer_city: string;
  customer_address_title: string;
  order_latitude: number;
  order_longitude: number;
  order_subtotal: number;
  order_total: number;
  order_discount?: number;
  order_delivery_price?: number;
  cart_data: LezzooCartItem[];
  wadem_order_id?: string;
  customer_name?: string;
  customer_last_name?: string;
  wadem_merchant_id?: number;
}

export interface CreateLezzooOrderResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    orderId: number;
    order_id: number;
    cart_id: number;
    order_status: string;
    merchant_id: number;
  };
}

export interface TrackOrderResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    order: {
      order_id: number;
      order_status: string;
      order_subtotal: number;
      order_delivery_price: number;
      order_discount: number;
      order_total: number;
      order_address: string;
      order_latitude: number;
      order_longitude: number;
      order_city: string;
      order_date_added: string;
      order_isready: number;
      order_driver_status: string | null;
      order_driver_name: string | null;
    };
    merchant: {
      merchant_id: number;
      merchant_name: string;
      merchant_logo: string;
      merchant_latitude: number;
      merchant_longitude: number;
      merchant_phone: string;
    };
    cart: {
      products: unknown[];
      productCount: number;
    };
    driver: {
      id: string;
      first_name: string;
      lat: number;
      lng: number;
      phone_no: string;
      photo: string;
      direction: number;
    } | null;
    eta: {
      start: string;
      end: string;
      prep: { estimatedPrepTime: number; percentage: number; now: number };
      delivery: { estimatedDeliveryTime: number; percentage: number; now: number };
    };
    statusText: string;
    wadem: {
      order_id: number;
      wadem_order_id: string;
      customer_name: string;
      customer_phone: string;
      wadem_order_status: string;
      wadem_merchant_id: number;
    };
  };
}

export function isLezzooConfigured(): boolean {
  return !!(HOOKS_HOST && API_KEY);
}

/**
 * Create an order on Lezzoo's logistics platform
 */
export async function createLezzooOrder(order: CreateLezzooOrderRequest): Promise<CreateLezzooOrderResponse> {
  if (!isLezzooConfigured()) {
    return { status: 'error', message: 'Lezzoo integration not configured' };
  }

  const res = await fetch(`${HOOKS_HOST}/api/orders/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify(order),
  });

  return res.json();
}

/**
 * Track an order on Lezzoo
 */
export async function trackLezzooOrder(orderId: number, language: string = 'en'): Promise<TrackOrderResponse> {
  if (!isLezzooConfigured()) {
    return { status: 'error', message: 'Lezzoo integration not configured' };
  }

  const res = await fetch(`${HOOKS_HOST}/api/track/${orderId}?language=${language}`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
    },
  });

  return res.json();
}

/**
 * Convert Wadem cart items to Lezzoo cart_data format
 */
export function mapToLezzooCart(
  items: { menuItemId: string; name: string; quantity: number; price: number; totalPrice: number; image?: string }[],
  merchantId: number
): LezzooCartItem[] {
  return items.map((item) => {
    const productId = parseInt(item.menuItemId) || Math.floor(Math.random() * 999999);
    const nameObj = { en: item.name, kr: item.name, ar: item.name, bd: item.name };
    return {
      product_id: productId,
      id: productId,
      product_name: nameObj,
      name: nameObj,
      product_merchant: merchantId,
      merchant: merchantId,
      merchant_id: merchantId,
      category_id: 0,
      product_image: item.image || '',
      product_price: item.price,
      product_discount: 0,
      single_product_price: item.price,
      single_product_subtotal: item.price,
      productTotalPrice: item.totalPrice,
      quantity: item.quantity,
      price: item.totalPrice,
      addons: [],
      category_name: { en: '', ar: '', kr: '', bd: '' },
    };
  });
}
