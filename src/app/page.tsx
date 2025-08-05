"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import type { InventoryItem, Transaction, PreOrder } from "@/lib/types"
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Package, ShoppingCart } from "lucide-react"
import { useState, useEffect } from "react"

const INVENTORY_STORAGE_KEY = "stationery-inventory-inventory";
const TRANSACTIONS_STORAGE_KEY = "stationery-inventory-transactions";
const PREORDERS_STORAGE_KEY = "stationery-inventory-preorders";

const chartConfig = {
  quantity: {
    label: "Quantity",
    color: "hsl(var(--primary))",
  },
}

export default function DashboardPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [preOrders, setPreOrders] = useState<PreOrder[]>([]);

  useEffect(() => {
    const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
    const storedTransactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    const storedPreOrders = localStorage.getItem(PREORDERS_STORAGE_KEY);

    if (storedInventory) setInventoryItems(JSON.parse(storedInventory));
    if (storedTransactions) setTransactions(JSON.parse(storedTransactions));
    if (storedPreOrders) setPreOrders(JSON.parse(storedPreOrders));
  }, []);

  const totalItems = inventoryItems.reduce((acc, item) => acc + item.quantity, 0);
  const lowStockItems = inventoryItems.filter(item => item.quantity <= 5 && item.quantity > 0).length;
  const pendingPreOrders = preOrders.filter(order => order.status === "Pending").length;

  const topItemsData = [...inventoryItems]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Stationery Inventory, your inventory command center.</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Items
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total number of all items in stock
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Items with quantity 5 or less
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Pre-Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{pendingPreOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting fulfillment
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Top 5 Items by Stock Level</CardTitle>
            <CardDescription>A snapshot of your most abundant items.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart
                accessibilityLayer
                data={topItemsData}
                layout="vertical"
                margin={{ left: 10, right: 10 }}
              >
                <CartesianGrid horizontal={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 15) + (value.length > 15 ? '...' : '')}
                  className="text-xs"
                />
                <XAxis dataKey="quantity" type="number" hide />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar dataKey="quantity" fill="var(--color-quantity)" radius={5} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>The latest stock movements in your inventory.</CardDescription>
          </CardHeader>
          <CardContent>
             {transactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 5).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="font-medium">{transaction.itemName}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{transaction.quantity}</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            transaction.type === 'in' || transaction.type === 'add' ? 'default' :
                            transaction.type === 'edit' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {transaction.type === 'in' || transaction.type === 'add' ? <ArrowDownLeft className="mr-1 h-3 w-3" /> : <ArrowUpRight className="mr-1 h-3 w-3" />}
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
             ) : (
                <div className="text-center text-sm text-muted-foreground py-8">
                    No transactions recorded yet.
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
