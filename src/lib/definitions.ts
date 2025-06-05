
export type UserRole = 'admin' | 'cashier';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  // password field should not be here in a real app, this is for mock
  password?: string;
}

export interface MenuItem {
  id: string; // Remains unique ID for the menu item itself
  code: string;
  name: string;
  price: number; // in PKR, this is the standard price
  category?: string;
}

// Represents an item as part of a deal definition
export interface DealItem {
  menuItemId: string; // ID of the MenuItem
  name: string; // Name of the MenuItem (for convenience during deal creation/display)
  quantity: number; // How many of this item are in the deal
  dealPricePerItem: number; // Special price for this item within this deal
  originalPricePerItem: number; // Original price of the item for reference
}

// Represents a Deal definition
export interface Deal {
  id: string; // Unique ID for the deal
  dealNumber: string; // User-defined deal number/code (should be unique)
  name: string;
  description?: string;
  items: DealItem[];
  calculatedTotalDealPrice: number; // Sum of (dealItem.quantity * dealItem.dealPricePerItem)
  isActive: boolean; // So admins can enable/disable deals
}

// Represents an item in a customer's bill
export interface BillItem {
  billItemId: string; // Unique ID for this specific line item in this bill
  menuItemId: string; // ID of the original MenuItem
  code: string; // From MenuItem
  name: string; // From MenuItem
  price: number; // The actual price charged per unit for this bill item (could be deal price or regular price)
  quantity: number;
  totalPrice: number; // price * quantity for this line item
  category?: string; // From MenuItem
  dealContext?: {
    dealId: string;
    dealName: string;
    originalPricePerItem?: number; // Original price of the item, if this was part of a deal
  };
}

export interface Bill {
  id: string;
  tableNumber?: string;
  customerName?: string;
  waiterName?: string;
  items: BillItem[];
  subtotal: number;
  tax?: number; // Optional tax
  discount?: number; // Optional discount
  totalAmount: number;
  createdAt: string; // ISO date string
  cashierId: string;
}

export interface SaleEntry extends Bill {}

export interface DeletedItemLogEntry {
  id: string;
  menuItemId: string; // Refers to the original MenuItem's ID
  itemName: string;
  itemCode: string;
  quantityRemoved: number;
  pricePerItem: number; // Price at which it was on the bill before removal
  removedByCashierId: string;
  billId?: string; // Optional: if removed from an in-progress bill
  timestamp: string; // ISO date string
  reason?: string; // Optional: reason for removal
  isDealItem?: boolean; // Flag if the removed item was part of a deal
  dealName?: string; // If it was part of a deal
}
