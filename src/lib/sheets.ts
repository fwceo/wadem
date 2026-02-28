// Google Sheets API wrapper for MVP backend
// Setup: Enable Google Sheets API, create a Service Account,
// share the sheet with the service account email,
// and set GOOGLE_SHEETS_CREDENTIALS and GOOGLE_SHEET_ID env vars.

import { google, sheets_v4 } from 'googleapis';
import { Order, OrderStatus } from '@/types/order';
import { Promotion, PromoResult, PromoType, TargetAudience } from '@/types/promotion';

const TABS = {
  ORDERS: 'Orders',
  CUSTOMERS: 'Customers',
  PROMOTIONS: 'Promotions',
} as const;

class SheetsService {
  private sheetId: string;
  private sheetsClient: sheets_v4.Sheets | null = null;

  constructor() {
    this.sheetId = process.env.GOOGLE_SHEET_ID || '';
  }

  private async getClient(): Promise<sheets_v4.Sheets> {
    if (this.sheetsClient) return this.sheetsClient;

    const credsBase64 = process.env.GOOGLE_SHEETS_CREDENTIALS;
    if (!credsBase64 || !this.sheetId) {
      throw new Error('Google Sheets not configured. Set GOOGLE_SHEETS_CREDENTIALS and GOOGLE_SHEET_ID.');
    }

    const creds = JSON.parse(Buffer.from(credsBase64, 'base64').toString('utf-8'));
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheetsClient = google.sheets({ version: 'v4', auth });
    return this.sheetsClient;
  }

  get isConfigured(): boolean {
    return !!(process.env.GOOGLE_SHEETS_CREDENTIALS && this.sheetId);
  }

  private async appendRow(tab: string, values: (string | number)[]): Promise<void> {
    const sheets = await this.getClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: this.sheetId,
      range: `${tab}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
  }

  private async getRows(tab: string): Promise<string[][]> {
    const sheets = await this.getClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range: `${tab}!A:Z`,
    });
    return (res.data.values || []) as string[][];
  }

  private async updateCell(tab: string, rowIndex: number, col: string, value: string): Promise<void> {
    const sheets = await this.getClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: this.sheetId,
      range: `${tab}!${col}${rowIndex + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [[value]] },
    });
  }

  // ── Orders ──────────────────────────────────────────
  // Columns: OrderID | CustomerUID | CustomerName | RestaurantID | RestaurantName | Items | Subtotal | DeliveryFee | Discount | Total | Status | PromoCode | CreatedAt | DeliveryAddress

  async createOrder(order: Record<string, unknown>): Promise<string> {
    if (!this.isConfigured) {
      console.log('[SheetsService] Not configured, skipping createOrder');
      return order.id as string;
    }
    await this.appendRow(TABS.ORDERS, [
      order.id as string,
      order.customerUid as string || '',
      order.customerName as string || '',
      order.restaurantId as string || '',
      order.restaurantName as string || '',
      JSON.stringify(order.items || []),
      order.subtotal as number || 0,
      order.deliveryFee as number || 0,
      order.discount as number || 0,
      order.total as number || 0,
      order.status as string || 'pending',
      order.promoCode as string || '',
      new Date().toISOString(),
      order.deliveryAddress as string || '',
    ]);
    return order.id as string;
  }

  async getOrdersByUser(userId: string): Promise<Order[]> {
    if (!this.isConfigured) return [];
    const rows = await this.getRows(TABS.ORDERS);
    if (rows.length < 2) return [];
    return rows.slice(1)
      .filter((row) => row[1] === userId)
      .map((row) => this.rowToOrder(row))
      .reverse();
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    if (!this.isConfigured) return null;
    const rows = await this.getRows(TABS.ORDERS);
    const row = rows.find((r) => r[0] === orderId);
    return row ? this.rowToOrder(row) : null;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    if (!this.isConfigured) return;
    const rows = await this.getRows(TABS.ORDERS);
    const idx = rows.findIndex((r) => r[0] === orderId);
    if (idx >= 0) {
      await this.updateCell(TABS.ORDERS, idx, 'K', status);
    }
  }

  private rowToOrder(row: string[]): Order {
    let items = [];
    try { items = JSON.parse(row[5] || '[]'); } catch { items = []; }
    return {
      id: row[0],
      customerUid: row[1],
      customerName: row[2],
      customerPhone: '',
      restaurantId: row[3],
      restaurantName: row[4],
      items,
      subtotal: Number(row[6]) || 0,
      deliveryFee: Number(row[7]) || 0,
      serviceFee: 0,
      discount: Number(row[8]) || 0,
      total: Number(row[9]) || 0,
      status: (row[10] as OrderStatus) || 'New',
      promoCode: row[11] || null,
      timestamp: row[12] || new Date().toISOString(),
      deliveryAddress: row[13] || '',
      latLng: '',
      paymentMethod: 'cash',
      deliveryNotes: '',
      estimatedDelivery: '',
    };
  }

  // ── Customers ───────────────────────────────────────
  // Columns: UID | Name | Phone | Email | Address(JSON) | SignupDate | TotalOrders | TotalSpent | ReferralCode | Preferences(JSON) | SavedAddresses(JSON) | FreeDeliveries | DietaryRestrictions(JSON)

  async upsertCustomer(customer: Record<string, unknown>): Promise<void> {
    if (!this.isConfigured) return;
    const rows = await this.getRows(TABS.CUSTOMERS);
    const uid = customer.uid as string;
    const idx = rows.findIndex((r) => r[0] === uid);
    const values = [
      uid,
      customer.name as string || '',
      customer.phone as string || '',
      customer.email as string || '',
      JSON.stringify(customer.address || {}),
      customer.signupDate as string || new Date().toISOString(),
      String(customer.totalOrders || 0),
      String(customer.totalSpent || 0),
      customer.referralCode as string || '',
      JSON.stringify(customer.preferences || []),
      JSON.stringify(customer.savedAddresses || []),
      String(customer.freeDeliveries ?? 4),
      JSON.stringify(customer.dietaryRestrictions || []),
    ];

    if (idx >= 0) {
      const sheets = await this.getClient();
      await sheets.spreadsheets.values.update({
        spreadsheetId: this.sheetId,
        range: `${TABS.CUSTOMERS}!A${idx + 1}:M${idx + 1}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [values] },
      });
    } else {
      await this.appendRow(TABS.CUSTOMERS, values);
    }
  }

  async getCustomer(userId: string): Promise<Record<string, unknown> | null> {
    if (!this.isConfigured) return null;
    const rows = await this.getRows(TABS.CUSTOMERS);
    const row = rows.find((r) => r[0] === userId);
    if (!row) return null;
    let address = {};
    try { address = JSON.parse(row[4] || '{}'); } catch { address = { formatted: row[4] || '' }; }
    let savedAddresses = [];
    try { savedAddresses = JSON.parse(row[10] || '[]'); } catch { savedAddresses = []; }
    let preferences = [];
    try { preferences = JSON.parse(row[9] || '[]'); } catch { preferences = []; }
    let dietaryRestrictions = [];
    try { dietaryRestrictions = JSON.parse(row[12] || '[]'); } catch { dietaryRestrictions = []; }
    return {
      uid: row[0], name: row[1], phone: row[2], email: row[3],
      address, signupDate: row[5],
      totalOrders: Number(row[6]) || 0, totalSpent: Number(row[7]) || 0,
      referralCode: row[8], preferences, savedAddresses,
      freeDeliveries: Number(row[11]) ?? 4, dietaryRestrictions,
    };
  }

  async incrementOrderCount(userId: string, amount: number): Promise<void> {
    if (!this.isConfigured) return;
    const rows = await this.getRows(TABS.CUSTOMERS);
    const idx = rows.findIndex((r) => r[0] === userId);
    if (idx >= 0) {
      const current = Number(rows[idx][6]) || 0;
      const currentSpent = Number(rows[idx][7]) || 0;
      await this.updateCell(TABS.CUSTOMERS, idx, 'G', String(current + 1));
      await this.updateCell(TABS.CUSTOMERS, idx, 'H', String(currentSpent + amount));
    }
  }

  // ── Promotions ──────────────────────────────────────
  // Columns: Code | Type | Value | MinOrder | MaxUses | CurrentUses | StartDate | EndDate | Audience | Active

  async validatePromo(code: string, userId: string, orderTotal: number): Promise<PromoResult> {
    if (!this.isConfigured) {
      return { valid: false, discount: 0, message: 'Promotions not configured' };
    }
    const rows = await this.getRows(TABS.PROMOTIONS);
    if (rows.length < 2) return { valid: false, discount: 0, message: 'No promotions available' };

    const promo = rows.slice(1).find((r) => r[0]?.toUpperCase() === code.toUpperCase());
    if (!promo) return { valid: false, discount: 0, message: 'Invalid promo code' };

    const [, type, value, minOrder, maxUses, currentUses, startDate, endDate, , active] = promo;

    if (active !== 'TRUE' && active !== '1') {
      return { valid: false, discount: 0, message: 'This promo is no longer active' };
    }

    const now = new Date();
    if (startDate && new Date(startDate) > now) return { valid: false, discount: 0, message: 'Promo not yet active' };
    if (endDate && new Date(endDate) < now) return { valid: false, discount: 0, message: 'Promo has expired' };

    if (Number(minOrder) > 0 && orderTotal < Number(minOrder)) {
      return { valid: false, discount: 0, message: `Minimum order of ${Number(minOrder).toLocaleString()} IQD required` };
    }

    if (Number(maxUses) > 0 && Number(currentUses) >= Number(maxUses)) {
      return { valid: false, discount: 0, message: 'Promo usage limit reached' };
    }

    let discount = 0;
    if (type === 'percentage') {
      discount = Math.round(orderTotal * (Number(value) / 100));
    } else if (type === 'fixed') {
      discount = Number(value);
    } else if (type === 'free_delivery') {
      discount = 0;
    }

    void userId;
    return { valid: true, discount, message: `Promo applied! You save ${discount.toLocaleString()} IQD` };
  }

  async incrementPromoUsage(code: string): Promise<void> {
    if (!this.isConfigured) return;
    const rows = await this.getRows(TABS.PROMOTIONS);
    const idx = rows.findIndex((r) => r[0]?.toUpperCase() === code.toUpperCase());
    if (idx >= 0) {
      const current = Number(rows[idx][5]) || 0;
      await this.updateCell(TABS.PROMOTIONS, idx, 'F', String(current + 1));
    }
  }

  async getActivePromos(audience?: string): Promise<Promotion[]> {
    if (!this.isConfigured) return [];
    const rows = await this.getRows(TABS.PROMOTIONS);
    if (rows.length < 2) return [];
    const now = new Date();

    return rows.slice(1)
      .filter((r) => {
        if (r[9] !== 'TRUE' && r[9] !== '1') return false;
        if (r[6] && new Date(r[6]) > now) return false;
        if (r[7] && new Date(r[7]) < now) return false;
        if (audience && r[8] && r[8] !== 'all' && r[8] !== audience) return false;
        return true;
      })
      .map((r): Promotion => ({
        code: r[0],
        type: r[1] as PromoType,
        value: Number(r[2]) || 0,
        minOrder: Number(r[3]) || 0,
        maxDiscount: 0,
        usageLimit: Number(r[4]) || 0,
        usedCount: Number(r[5]) || 0,
        startDate: r[6] || '',
        endDate: r[7] || '',
        targetAudience: (r[8] as TargetAudience) || 'all',
        active: true,
      }));
  }
}

export const sheetsService = new SheetsService();
