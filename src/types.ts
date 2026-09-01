export type Language = 'en' | 'ku' | 'ar';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'cashier' | 'waiter';
  permissions?: string[];
}

export interface Variant {
  nameEn: string;
  nameKu: string;
  nameAr: string;
  price: number;
}

export interface Addon {
  id: string;
  nameEn: string;
  nameKu: string;
  nameAr: string;
  price: number;
}

export interface MenuItem {
  id: string;
  nameEn: string;
  nameKu: string;
  nameAr: string;
  categoryId: string;
  price: number;
  variants?: Variant[];
  addons?: Addon[];
  image?: string;
  isAvailable: boolean;
}

export interface Category {
  id: string;
  nameEn: string;
  nameKu: string;
  nameAr: string;
  sortOrder?: number;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  floor: string;
  mergedWithId?: string;
  occupiedAt?: string;
  positionX?: number;
  positionY?: number;
  shape?: 'round' | 'square' | 'rectangle';
}

export interface SelectedAddon {
  id: string;
  nameEn: string;
  nameKu: string;
  nameAr: string;
  price: number;
}

export interface OrderItem {
  menuItemId: string;
  variantName?: string;
  selectedAddons?: SelectedAddon[];
  quantity: number;
  price: number; // Price at the time of order
  notes?: string;
}

export interface Order {
  id: string;
  tableId?: string;
  type: 'dine_in' | 'takeaway';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  serviceCharge?: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  paymentMethod?: 'cash' | 'card' | 'fastpay' | 'fib' | 'zaincash';
  invoiceCode: string;
  userId?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  category: string;
  receiptImage?: string;
}

export interface ExpenseCategory {
  id: string;
  nameEn: string;
  nameKu: string;
  nameAr: string;
}

export interface InventoryItem {
  id: string;
  category?: string;
  nameEn: string;
  nameKu: string;
  nameAr: string;
  quantity: number;
  unit: string;
  minimumStock: number;
  cost: number;
}

export interface InventoryLog {
  id: string;
  itemId: string;
  itemName: string;
  userId: string;
  userName: string;
  previousQuantity: number;
  newQuantity: number;
  reason: 'restock' | 'wastage' | 'correction' | 'sale' | 'other';
  timestamp: string;
  notes?: string;
}

export interface Shift {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  clockInTime: string;
  clockOutTime?: string;
  totalHours?: number;
  startingCash?: number;
  declaredCash?: number;
  expectedCash?: number;
  totalSales?: number;
  totalOrders?: number;
  discrepancy?: number;
}
