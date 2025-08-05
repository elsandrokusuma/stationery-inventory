"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, MoreHorizontal } from "lucide-react";
import { preOrders as initialPreOrders, inventoryItems } from "@/lib/placeholder-data";
import type { PreOrder } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PreOrdersPage() {
  const [preOrders, setPreOrders] = React.useState<PreOrder[]>(initialPreOrders);
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  const { toast } = useToast();

  const handleCreatePreOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedItemId = formData.get("item") as string;
    const selectedItem = inventoryItems.find(i => i.id === selectedItemId);

    if (!selectedItem) return;

    const newPreOrder: PreOrder = {
      id: `po${preOrders.length + 1}`,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantity: Number(formData.get("quantity")),
      orderDate: new Date().toISOString().split("T")[0],
      expectedDate: formData.get("expectedDate") as string,
      status: "Pending",
    };
    setPreOrders([newPreOrder, ...preOrders]);
    toast({
      title: "Pre-Order Created",
      description: `Pre-order for ${newPreOrder.quantity}x ${newPreOrder.itemName} has been created.`,
    });
    setCreateOpen(false);
  };

  const updateStatus = (id: string, status: PreOrder['status']) => {
    setPreOrders(preOrders.map(order => 
      order.id === id ? { ...order, status } : order
    ));
    toast({
      title: 'Status Updated',
      description: `Order ${id} marked as ${status}.`
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pre-Orders</h1>
          <p className="text-muted-foreground">
            Track and manage your upcoming stock deliveries.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Pre-Order
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Pre-Order</DialogTitle>
              <DialogDescription>
                Fill in the details for the new pre-order.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePreOrder} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item" className="text-right">Item</Label>
                <Select name="item" required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" min="1" className="col-span-3" required />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="expectedDate" className="text-right">Expected Date</Label>
                <Input id="expectedDate" name="expectedDate" type="date" className="col-span-3" required />
              </div>
              <DialogFooter>
                <Button type="submit">Create Pre-Order</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item Name</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Expected Date</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.itemName}</TableCell>
                <TableCell className="text-right">{order.quantity}</TableCell>
                <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(order.expectedDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={order.status === 'Fulfilled' ? 'default' : order.status === 'Pending' ? 'outline' : 'destructive'}
                    className={
                        order.status === 'Fulfilled' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                      : order.status === 'Pending' ? 'border-blue-400 text-blue-500' 
                      : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost" disabled={order.status !== 'Pending'}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => updateStatus(order.id, 'Fulfilled')}>Mark as Fulfilled</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => updateStatus(order.id, 'Cancelled')}>Mark as Cancelled</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
