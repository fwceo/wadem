export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  image: string;
  logo: string;
  cuisine: string[];
  rating: number;
  reviewCount: number;
  deliveryTime: { min: number; max: number };
  deliveryFee: number;
  minimumOrder: number;
  isOpen: boolean;
  address: string;
  phone: string;
  hours: OperatingHours;
  promos: RestaurantPromo[];
  categories: MenuCategory[];
  // Lezzoo-specific fields (optional)
  distance?: number;
  prepTime?: number;
  vertical?: string;
  badges?: RestaurantBadge[];
  lezzooId?: number;
}

export interface RestaurantBadge {
  badge_title: string;
  badge_color: string;
  badge_text_color: string;
  badge_icon_url: string;
}

export interface OperatingHours {
  [day: string]: { open: string; close: string };
}

export interface RestaurantPromo {
  code: string;
  type: 'percentage' | 'fixed' | 'free_delivery';
  value: number;
  minOrder: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isPopular: boolean;
  isAvailable: boolean;
  customizations: Customization[];
  tags: string[];
  prepTime: number;
  calories?: number;
}

export interface Customization {
  id: string;
  name: string;
  required: boolean;
  type: 'radio' | 'checkbox';
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  price: number;
}
