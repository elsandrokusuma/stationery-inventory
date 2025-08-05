export type InventoryItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
};

export type Transaction = {
  id: string;
  itemId: string;
  itemName:string;
  type: 'in' | 'out' | 'edit' | 'add' | 'delete';
  quantity: number;
  date: string;
  person?: string; // Supplier for 'in', Recipient for 'out'
};


export type PreOrder = {
  id: string;
  itemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  orderDate: string;
  expectedDate: string;
  status: 'Pending' | 'Awaiting Approval' | 'Approved' | 'Rejected' | 'Fulfilled' | 'Cancelled';
};
