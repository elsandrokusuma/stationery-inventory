
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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts"
import type { InventoryItem, Transaction, PreOrder } from "@/lib/types"
import { AlertCircle, ArrowDownLeft, ArrowUpRight, Package, ClipboardCheck, PackageX } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"


const chartConfig = {
  quantity: {
    label: "Quantity",
    color: "hsl(var(--primary))",
  },
  stockIn: {
    label: "Stock In",
    color: "hsl(var(--chart-1))",
  },
  stockOut: {
    label: "Stock Out",
    color: "hsl(var(--chart-2))",
  },
}

export default function DashboardPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
  const [selectedChartItem, setSelectedChartItem] = useState<string>("all");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const qInventory = query(collection(db, "inventory"), orderBy("name"));
    const unsubscribeInventory = onSnapshot(qInventory, (querySnapshot) => {
      const items: InventoryItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setInventoryItems(items);
    });

    const qTransactions = query(collection(db, "transactions"), orderBy("date", "desc"));
    const unsubscribeTransactions = onSnapshot(qTransactions, (querySnapshot) => {
      const trans: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        trans.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(trans);
    });
    
    const qRecentTransactions = query(collection(db, "transactions"), orderBy("date", "desc"), limit(5));
    const unsubscribeRecentTransactions = onSnapshot(qRecentTransactions, (querySnapshot) => {
        const trans: Transaction[] = [];
        querySnapshot.forEach((doc) => {
            trans.push({ id: doc.id, ...doc.data() } as Transaction);
        });
        setRecentTransactions(trans);
    });
    
    const qPreOrders = query(collection(db, "pre-orders"), orderBy("orderDate", "desc"));
    const unsubscribePreOrders = onSnapshot(qPreOrders, (querySnapshot) => {
      const orders: PreOrder[] = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as PreOrder);
      });
      setPreOrders(orders);
    });

    return () => {
        unsubscribeInventory();
        unsubscribeTransactions();
        unsubscribeRecentTransactions();
        unsubscribePreOrders();
    }
  }, []);
  
  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setDetailsOpen(true);
  };

  const totalItems = inventoryItems.reduce((acc, item) => acc + item.quantity, 0);
  const lowStockItems = inventoryItems.filter(item => item.quantity <= 5 && item.quantity > 0).length;
  const outOfStockItems = inventoryItems.filter(item => item.quantity === 0).length;
  const awaitingApprovalCount = preOrders.filter(order => order.status === "Awaiting Approval").length;

  const topItemsData = [...inventoryItems]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const monthlyStockData = useMemo(() => {
    const data: { [key: string]: { month: string; stockIn: number; stockOut: number } } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const filteredTransactions = selectedChartItem === 'all'
      ? transactions
      : transactions.filter(t => t.itemId === selectedChartItem);

    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthLabel = `${monthNames[date.getMonth()]} '${String(date.getFullYear()).slice(2)}`;

      if (!data[monthKey]) {
        data[monthKey] = { month: monthLabel, stockIn: 0, stockOut: 0 };
      }

      if (t.type === 'in' || t.type === 'add') {
        data[monthKey].stockIn += t.quantity;
      } else if (t.type === 'out') {
        data[monthKey].stockOut += t.quantity;
      }
    });

    return Object.values(data).sort((a, b) => {
        const aDate = new Date(a.month.split(" '")[0] + " 1, 20" + a.month.split(" '")[1]);
        const bDate = new Date(b.month.split(" '")[0] + " 1, 20" + b.month.split(" '")[1]);
        return aDate.getTime() - bDate.getTime();
    }).slice(-6); // Get last 6 months
  }, [transactions, selectedChartItem]);
  
  const selectedItemName = selectedChartItem === 'all' 
    ? 'All Items' 
    : inventoryItems.find(item => item.id === selectedChartItem)?.name;


  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Stationery Inventory, your inventory command center.</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card onClick={() => router.push('/inventory')} className="cursor-pointer hover:bg-card/90 transition-colors">
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
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <PackageX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Items with zero quantity
            </p>
          </CardContent>
        </Card>
        <Card onClick={() => router.push('/approval')} className="cursor-pointer hover:bg-card/90 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Approval</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{awaitingApprovalCount}</div>
            <p className="text-xs text-muted-foreground">
              Pre-orders to be reviewed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <CardTitle>Monthly Stock Movement: {selectedItemName}</CardTitle>
                      <CardDescription>A summary of stock in and stock out over the last 6 months.</CardDescription>
                    </div>
                    <Select value={selectedChartItem} onValueChange={setSelectedChartItem}>
                        <SelectTrigger className="w-full md:w-[250px]">
                            <SelectValue placeholder="Select an item to view" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Items</SelectItem>
                            {inventoryItems.map(item => (
                                <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={monthlyStockData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value}
                  />
                   <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="stockIn" fill="var(--color-stockIn)" radius={[4, 4, 0, 0]} name="Stock In" />
                  <Bar dataKey="stockOut" fill="var(--color-stockOut)" radius={[4, 4, 0, 0]} name="Stock Out" />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
           <Card>
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
      </div>


      <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>The latest stock movements in your inventory.</CardDescription>
          </CardHeader>
          <CardContent>
             {recentTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id} onClick={() => handleTransactionClick(transaction)} className="cursor-pointer">
                      <TableCell>
                        <div className="font-medium">{transaction.itemName}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{transaction.quantity}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
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
    

       <Dialog open={isDetailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Detailed information about the stock movement.
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-muted-foreground">Date</span>
                <span className="col-span-2">{new Date(selectedTransaction.date).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-muted-foreground">Item Name</span>
                <span className="col-span-2">{selectedTransaction.itemName}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-muted-foreground">Quantity</span>
                <span className="col-span-2">{selectedTransaction.quantity}</span>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="font-semibold text-muted-foreground">Type</span>
                 <span className="col-span-2">
                  <Badge
                    variant={
                      selectedTransaction.type === 'in' || selectedTransaction.type === 'add' ? 'default' :
                      selectedTransaction.type === 'edit' ? 'secondary' :
                      'destructive'
                    }
                  >
                    {selectedTransaction.type.charAt(0).toUpperCase() + selectedTransaction.type.slice(1)}
                  </Badge>
                </span>
              </div>
              {selectedTransaction.person && (
                 <div className="grid grid-cols-3 items-center gap-4">
                  <span className="font-semibold text-muted-foreground">
                    {selectedTransaction.type === 'in' || selectedTransaction.type === 'add' ? 'From' : 'To'}
                  </span>
                  <span className="col-span-2">{selectedTransaction.person}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
    

