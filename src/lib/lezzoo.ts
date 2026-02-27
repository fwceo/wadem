import { Restaurant, RestaurantPromo, MenuCategory, MenuItem, Customization, CustomizationOption } from '@/types/restaurant';

const LEZZOO_BASE_URL = 'https://production.customerapi.lezzoodevs.com/app/v2.81';

const MERCHANT_LIST_PARAMS = {
  appVersion: '4.2',
  city: 'Erbil',
  hexagonId: '892c105806bffff',
  language: 'en',
  offset: '0',
  sort: 'closest',
  type: 'closest',
  filters: '',
  limit: '1000',
  branchIds: '',
  widget_id: '',
  target_id: '0',
};

// Lezzoo API raw merchant type
export interface LezzooMerchant {
  merchant_id: number;
  merchant_branch_group_id: number;
  merchant_name: string;
  merchant_distance: number;
  merchant_logo: string;
  merchant_image: string;
  merchant_rate: string;
  merchant_rated_orders: number;
  merchant_presentation: string;
  merchant_city: string;
  merchant_avg_prep_time: number;
  merchant_working_status: string;
  product_merchant_discount_value: number;
  product_merchant_discount_limit: number;
  has_item_level_discount: number;
  item_level_discount_value: number;
  merchant_vertical: string;
  delivery_price: number;
  merchant_hub_id: number;
  is_open: number;
  merchant_open_time: string;
  merchant_close_time: string;
  merchant_vip: number;
  merchant_is_free_delivery: number;
  merchant_range: number;
  merchant_type: string;
  merchant_eta: number;
  merchant_delivery_time: number;
  org_delivery_price: number;
  merchant_cycle_time: number;
  merchant_badges: {
    badge_title: string;
    badge_color: string;
    badge_text_color: string;
    badge_icon_url: string;
  }[];
  merchant_icon_badge_style: {
    badge_title: string;
    badge_color: string;
    badge_text_color: string;
    badge_icon_url: string;
  };
  configs: {
    show_distance: number;
    show_preparation_time: number;
    show_delivery_time: number;
    show_rating: number;
  };
}

export interface LezzooApiResponse {
  hasMoreData: boolean;
  data: LezzooMerchant[];
  nextOffset: number;
}

/**
 * Fetch merchants from the Lezzoo API
 */
export async function fetchLezzooMerchants(): Promise<LezzooMerchant[]> {
  const params = new URLSearchParams(MERCHANT_LIST_PARAMS);
  const url = `${LEZZOO_BASE_URL}/merchant-list/88?${params.toString()}`;

  const res = await fetch(url, {
    next: { revalidate: 300 }, // Cache for 5 minutes
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Lezzoo API error: ${res.status}`);
  }

  const json: LezzooApiResponse = await res.json();
  return json.data || [];
}

/**
 * Derive a cuisine tag from the merchant name and vertical
 */
function deriveCuisine(merchant: LezzooMerchant): string[] {
  const name = merchant.merchant_name.toLowerCase();
  const tags: string[] = [];

  // Vertical
  if (merchant.merchant_vertical === 'sweets') {
    tags.push('Sweets & Desserts');
  } else if (merchant.merchant_vertical === 'food') {
    tags.push('Restaurant');
  }

  // Name-based heuristics
  if (name.includes('pizza')) tags.push('Pizza');
  if (name.includes('burger') || name.includes('smash')) tags.push('Burgers');
  if (name.includes('sushi')) tags.push('Sushi');
  if (name.includes('shawarma')) tags.push('Shawarma');
  if (name.includes('kebab') || name.includes('kabab')) tags.push('Kebab');
  if (name.includes('falafel')) tags.push('Falafel');
  if (name.includes('chicken')) tags.push('Chicken');
  if (name.includes('coffee') || name.includes('cafe') || name.includes('café')) tags.push('Coffee & Cafe');
  if (name.includes('donut') || name.includes('doughnut')) tags.push('Donuts');
  if (name.includes('pasta')) tags.push('Pasta');
  if (name.includes('bakery') || name.includes('bread')) tags.push('Bakery');
  if (name.includes('grill') || name.includes('manqal')) tags.push('Grill');
  if (name.includes('fast food')) tags.push('Fast Food');
  if (name.includes('nuts') || name.includes('sweets')) tags.push('Sweets');
  if (name.includes('saj')) tags.push('Saj');
  if (name.includes('donar') || name.includes('doner')) tags.push('Doner');
  if (name.includes('tantuni')) tags.push('Turkish');

  // Fallback
  if (tags.length <= 1) {
    tags.push('Food');
  }

  return tags;
}

/**
 * Extract promos from badges
 */
function extractPromos(merchant: LezzooMerchant): RestaurantPromo[] {
  const promos: RestaurantPromo[] = [];

  if (merchant.product_merchant_discount_value > 0) {
    const limitText = merchant.product_merchant_discount_limit > 0
      ? ` up to ${merchant.product_merchant_discount_limit.toLocaleString()} IQD`
      : '';
    promos.push({
      code: `LEZZOO${merchant.product_merchant_discount_value}`,
      type: 'percentage',
      value: merchant.product_merchant_discount_value,
      minOrder: 0,
    });
  }

  if (merchant.merchant_is_free_delivery === 1) {
    promos.push({
      code: 'FREEDEL',
      type: 'free_delivery',
      value: 0,
      minOrder: 0,
    });
  }

  return promos;
}

/**
 * Convert a Lezzoo merchant to our Restaurant type
 */
export function adaptMerchant(merchant: LezzooMerchant): Restaurant {
  const slug = merchant.merchant_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Delivery fee: IQD price → convert to display (keep as IQD)
  const deliveryFee = merchant.merchant_is_free_delivery === 1
    ? 0
    : merchant.delivery_price;

  // Build operating hours (same time every day from the API)
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const hours: Record<string, { open: string; close: string }> = {};
  for (const day of days) {
    hours[day] = {
      open: merchant.merchant_open_time.slice(0, 5),
      close: merchant.merchant_close_time.slice(0, 5),
    };
  }

  return {
    id: String(merchant.merchant_id),
    lezzooId: merchant.merchant_id,
    name: merchant.merchant_name,
    slug,
    image: (merchant.merchant_image || '').trim() || '/placeholder-restaurant.svg',
    logo: (merchant.merchant_logo || '').trim() || '',
    cuisine: deriveCuisine(merchant),
    rating: parseFloat(merchant.merchant_rate) || 3.0,
    reviewCount: merchant.merchant_rated_orders,
    deliveryTime: {
      min: merchant.merchant_delivery_time,
      max: merchant.merchant_cycle_time,
    },
    deliveryFee,
    minimumOrder: 0,
    isOpen: merchant.is_open === 1,
    address: merchant.merchant_city,
    phone: '',
    hours,
    promos: extractPromos(merchant),
    categories: [], // Menu items come from a separate endpoint
    distance: merchant.merchant_distance,
    prepTime: merchant.merchant_avg_prep_time,
    vertical: merchant.merchant_vertical,
    badges: merchant.merchant_badges,
  };
}

/**
 * Fetch and adapt all merchants
 */
export async function fetchRestaurants(): Promise<Restaurant[]> {
  const merchants = await fetchLezzooMerchants();
  return merchants.map(adaptMerchant);
}

// ---------------------------------------------------------------------------
// All-Products (Menu) API
// ---------------------------------------------------------------------------

interface LezzooProduct {
  type: 'product' | 'menu';
  product_id: number | null;
  product_name: string | null;
  product_description: string;
  product_price: number | null;
  product_view_price: number | null;
  product_image_url: string | null;
  product_image_url_full: string | null;
  product_temp_out_of_stock: boolean;
  product_rate: number | null;
  product_stock: number | null;
  menu_name: string;
  menu_id: number;
  product_category_sort: number;
  product_sort: number;
  is_open: number;
  hasDiscount: boolean;
  discountPercentage: number;
  product_discount_price: number;
  options: LezzooOption[];
}

interface LezzooOption {
  option_id: number;
  title: string;
  option_name: string;
  required: boolean;
  type: string;
  min: number | null;
  max: number | null;
  content: LezzooOptionValue[];
}

interface LezzooOptionValue {
  option_value_id: number;
  option_value_name: string;
  price: number;
}

interface LezzooAllProductsResponse {
  products: LezzooProduct[];
  menus: { menu_id: number; menu_name: string; product_category_sort: number; menu_length: number }[];
}

const ALL_PRODUCTS_PARAMS = {
  appVersion: '4.2',
  language: 'en',
  branchId: '0',
  hasoffer: '0',
  hexagonId: '892c105806bffff',
};

function adaptOption(opt: LezzooOption): Customization {
  const isRadio = opt.max === 1 || opt.type === 'radio';
  return {
    id: String(opt.option_id),
    name: opt.title || opt.option_name || 'Option',
    required: opt.required ?? false,
    type: isRadio ? 'radio' : 'checkbox',
    options: (opt.content || []).map((v): CustomizationOption => ({
      id: String(v.option_value_id),
      name: v.option_value_name?.trim() || 'Option',
      price: v.price || 0,
    })),
  };
}

function adaptProduct(p: LezzooProduct): MenuItem {
  const price = p.product_view_price ?? p.product_price ?? 0;
  const discountPrice = p.hasDiscount && p.product_discount_price > 0
    ? p.product_discount_price
    : undefined;

  return {
    id: String(p.product_id),
    name: p.product_name || 'Unnamed Item',
    description: (p.product_description || '').trim(),
    price: discountPrice ?? price,
    image: (p.product_image_url || p.product_image_url_full || '').trim() || '',
    category: p.menu_name || '',
    isPopular: (p.product_rate ?? 0) >= 4.5,
    isAvailable: !p.product_temp_out_of_stock && p.is_open === 1,
    customizations: (p.options || []).map(adaptOption),
    tags: [],
    prepTime: 0,
  };
}

/**
 * Fetch the full menu (categories + items) for a merchant
 */
export async function fetchMerchantMenu(merchantId: string | number): Promise<MenuCategory[]> {
  const params = new URLSearchParams(ALL_PRODUCTS_PARAMS);
  const url = `${LEZZOO_BASE_URL}/merchants/${merchantId}/all-products?${params.toString()}`;

  const res = await fetch(url, {
    cache: 'no-store',
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    console.error(`Lezzoo menu API error: ${res.status} for merchant ${merchantId}`);
    return [];
  }

  const json: LezzooAllProductsResponse = await res.json();
  const products = json.products || [];
  const menus = json.menus || [];

  // Group products by menu_name, skipping menu-type headers
  const categoryMap = new Map<string, MenuItem[]>();
  const categorySorts = new Map<string, number>();

  const seenPerCategory = new Map<string, Set<number>>();

  // Seed category order from menus array
  for (const m of menus) {
    if (!categoryMap.has(m.menu_name)) {
      categoryMap.set(m.menu_name, []);
      categorySorts.set(m.menu_name, m.product_category_sort);
      seenPerCategory.set(m.menu_name, new Set());
    }
  }

  for (const p of products) {
    if (p.type === 'menu' || p.product_id == null) continue;
    const catName = p.menu_name || 'Other';
    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, []);
      categorySorts.set(catName, p.product_category_sort ?? 999);
      seenPerCategory.set(catName, new Set());
    }
    const seen = seenPerCategory.get(catName)!;
    if (seen.has(p.product_id)) continue;
    seen.add(p.product_id);
    categoryMap.get(catName)!.push(adaptProduct(p));
  }

  // Build categories sorted by product_category_sort
  const categories: MenuCategory[] = [];
  const sortedNames = [...categoryMap.keys()].sort(
    (a, b) => (categorySorts.get(a) ?? 999) - (categorySorts.get(b) ?? 999)
  );

  for (const name of sortedNames) {
    const items = categoryMap.get(name) || [];
    if (items.length === 0) continue;
    categories.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      items,
    });
  }

  return categories;
}
