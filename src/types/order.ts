import { MenuItem, CustomizationOption } from './restaurant';

export type OrderStatus =
  | 'New'
  | 'Accepted'
  | 'Preparing'
  | 'On The Way'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  id: string;
  timestamp: string;
  customerName: string;
  customerPhone: string;
  customerUid: string;
  deliveryAddress: string;
  latLng: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  total: number;
  promoCode: string | null;
  status: OrderStatus;
  paymentMethod: string;
  deliveryNotes: string;
  estimatedDelivery: string;
  actualDelivery?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  customizations: SelectedCustomization[];
  specialInstructions?: string;
  totalPrice: number;
}

export interface SelectedCustomization {
  customizationId: string;
  customizationName: string;
  selectedOptions: CustomizationOption[];
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  customizations: SelectedCustomization[];
  specialInstructions?: string;
  totalPrice: number;
}
