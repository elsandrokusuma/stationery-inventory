export type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  category: string;
  supplier: string;
  lastUpdated: string;
};

export type Transaction = {
  id: string;
  itemId: string;
  itemName: string;
  type: 'in' | 'out';
  quantity: number;
  date: string;
  person: string; // Supplier for 'in', Recipient for 'out'
};

export type PreOrder = {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  orderDate: string;
  expectedDate: string;
  status: 'Pending' | 'Fulfilled' | 'Cancelled';
};
