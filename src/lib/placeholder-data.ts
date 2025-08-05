import type { InventoryItem, Transaction, PreOrder } from './types';

export const inventoryItems: InventoryItem[] = [
  { id: '1', name: 'Premium Coffee Beans', sku: 'CFB-001', quantity: 150, category: 'Groceries', supplier: 'BeanMasters Inc.', lastUpdated: '2024-05-20' },
  { id: '2', name: 'Organic Green Tea', sku: 'TEA-002', quantity: 80, category: 'Beverages', supplier: 'GreenLeaf Teas', lastUpdated: '2024-05-18' },
  { id: '3', name: 'Artisanal Bread', sku: 'BRD-003', quantity: 45, category: 'Bakery', supplier: 'The Dough Co.', lastUpdated: '2024-05-21' },
  { id: '4', name: 'Laptop Pro 15"', sku: 'ELC-004', quantity: 25, category: 'Electronics', supplier: 'TechForward', lastUpdated: '2024-05-15' },
  { id: '5', name: 'Wireless Mouse', sku: 'ELC-005', quantity: 200, category: 'Electronics', supplier: 'ClickRight', lastUpdated: '2024-05-19' },
  { id: '6', name: 'Office Chair', sku: 'FNT-006', quantity: 30, category: 'Furniture', supplier: 'ComfySit', lastUpdated: '2024-05-10' },
];

export const transactions: Transaction[] = [
  { id: 't1', itemId: '1', itemName: 'Premium Coffee Beans', type: 'in', quantity: 50, date: '2024-05-20', person: 'BeanMasters Inc.' },
  { id: 't2', itemId: '3', itemName: 'Artisanal Bread', type: 'out', quantity: 10, date: '2024-05-21', person: 'Local Cafe' },
  { id: 't3', itemId: '4', itemName: 'Laptop Pro 15"', type: 'out', quantity: 5, date: '2024-05-19', person: 'Internal Use' },
  { id: 't4', itemId: '5', itemName: 'Wireless Mouse', type: 'in', quantity: 100, date: '2024-05-19', person: 'ClickRight' },
  { id: 't5', itemId: '2', itemName: 'Organic Green Tea', type: 'in', quantity: 30, date: '2024-05-18', person: 'GreenLeaf Teas' },
  { id: 't6', itemId: '3', itemName: 'Artisanal Bread', type: 'in', quantity: 50, date: '2024-05-18', person: 'The Dough Co.' },
  { id: 't7', itemId: '1', itemName: 'Premium Coffee Beans', type: 'out', quantity: 20, date: '2024-05-22', person: 'Sales Dept' },
];

export const preOrders: PreOrder[] = [
  { id: 'po1', itemId: '4', itemName: 'Laptop Pro 15"', quantity: 10, orderDate: '2024-05-15', expectedDate: '2024-06-01', status: 'Pending' },
  { id: 'po2', itemId: '6', itemName: 'Office Chair', quantity: 20, orderDate: '2024-05-10', expectedDate: '2024-05-25', status: 'Pending' },
  { id: 'po3', itemId: '1', itemName: 'Premium Coffee Beans', quantity: 100, orderDate: '2024-04-20', expectedDate: '2024-05-10', status: 'Fulfilled' },
  { id: 'po4', itemId: '2', itemName: 'Organic Green Tea', quantity: 50, orderDate: '2024-05-18', expectedDate: '2024-06-05', status: 'Pending' },
];
