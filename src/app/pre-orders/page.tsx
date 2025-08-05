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
import { PlusCircle, MoreHorizontal, FileDown, Calendar as CalendarIcon, X } from "lucide-react";
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
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

export default function PreOrdersPage() {
  const [preOrders, setPreOrders] = React.useState<PreOrder[]>(initialPreOrders);
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  const { toast } = useToast();
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<Date | undefined>(undefined);

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
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredPreOrders.map(order => order.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const filteredPreOrders = preOrders.filter(order => {
    const statusMatch = statusFilter === 'all' || order.status === statusFilter;
    const dateMatch = !dateFilter || order.expectedDate === format(dateFilter, 'yyyy-MM-dd');
    return statusMatch && dateMatch;
  });
  
  const isAllSelected = selectedRows.length > 0 && selectedRows.length === filteredPreOrders.length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pre-Orders</h1>
          <p className="text-muted-foreground">
            Track and manage your upcoming stock deliveries.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
           <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Fulfilled">Fulfilled</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

           <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-[240px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "PPP") : <span>Filter by date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {dateFilter && (
            <Button variant="ghost" size="icon" onClick={() => setDateFilter(undefined)}>
              <X className="h-4 w-4" />
            </Button>
          )}

          <Button disabled={selectedRows.length === 0}>
            <FileDown className="mr-2 h-4 w-4" />
            Export Selected
          </Button>
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
        </div>
      </header>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead padding="checkbox">
                 <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    aria-label="Select all"
                  />
              </TableHead>
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
            {filteredPreOrders.map((order) => (
              <TableRow key={order.id} data-state={selectedRows.includes(order.id) && "selected"}>
                <TableCell padding="checkbox">
                  <Checkbox
                      checked={selectedRows.includes(order.id)}
                      onCheckedChange={() => handleSelectRow(order.id)}
                      aria-label="Select row"
                    />
                </TableCell>
                <TableCell className="font-medium">{order.itemName}</TableCell>
                <TableCell className="text-right">{order.quantity}</TableCell>
                <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(order.expectedDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={order.status === 'Fulfilled' ? 'default' : order.status === 'Pending' ? 'outline' : 'secondary'}
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
