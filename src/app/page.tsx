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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Line, LineChart } from "recharts"
import { inventoryItems, transactions, preOrders } from "@/lib/placeholder-data"
import { AlertCircle, ArrowDownLeft, ArrowUpRight, DollarSign, Package, ShoppingCart } from "lucide-react"
import { useState, useEffect } from "react"

const chartConfig = {
  quantity: {
    label: "Quantity",
    color: "hsl(var(--primary))",
  },
}

const lineChartConfig = {
  in: {
    label: "Stock In",
    color: "hsl(var(--chart-2))",
  },
  out: {
    label: "Stock Out",
    color: "hsl(var(--destructive))",
  },
}

export default function DashboardPage() {
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    // Generate random prices on the client to avoid hydration mismatch
    const calculatedValue = inventoryItems.reduce((acc, item) => acc + item.quantity * Math.random() * 100, 0);
    setTotalValue(calculatedValue);
  }, []);

  const lowStockItems = inventoryItems.filter(item => item.quantity < 50).length;
  const pendingPreOrders = preOrders.filter(order => order.status === "Pending").length;

  const topItemsData = [...inventoryItems]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const stockMovements = transactions.reduce((acc, t) => {
    const date = new Date(t.date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { date, in: 0, out: 0 };
    }
    if (t.type === 'in') {
      acc[date].in += t.quantity;
    } else {
      acc[date].out += t.quantity;
    }
    return acc;
  }, {} as Record<string, {date: string; in: number; out: number}>)

  const stockMovementsData = Object.values(stockMovements).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to StockPilot, your inventory command center.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Inventory Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue > 0 ? totalValue.toLocaleString('en-US', {maximumFractionDigits: 2}) : '...'}</div>
            <p className="text-xs text-muted-foreground">
              Estimated value of all items in stock
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
              Items with quantity less than 50 units
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
                      {transaction.type === 'in' ? (
                        <Badge variant="default">
                          <ArrowDownLeft className="mr-1 h-3 w-3" />
                          In
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <ArrowUpRight className="mr-1 h-3 w-3" />
                          Out
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
