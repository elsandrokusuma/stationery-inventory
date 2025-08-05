
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { PlusCircle, MoreHorizontal, Send, Calendar as CalendarIcon, X, FileDown } from "lucide-react";
import { preOrders as initialPreOrders, initialInventoryItems } from "@/lib/placeholder-data";
import type { PreOrder, InventoryItem } from "@/lib/types";
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


const APPROVAL_STORAGE_KEY = "stationery-inventory-pending-approvals";
const PREORDERS_STORAGE_KEY = "stationery-inventory-preorders";
const INVENTORY_STORAGE_KEY = "stationery-inventory-inventory";


export default function PreOrdersPage() {
  const [preOrders, setPreOrders] = React.useState<PreOrder[]>([]);
  const [inventoryItems, setInventoryItems] = React.useState<InventoryItem[]>([]);
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  const { toast } = useToast();
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<Date | undefined>(undefined);
  const router = useRouter();

  React.useEffect(() => {
    try {
      const storedPreOrders = localStorage.getItem(PREORDERS_STORAGE_KEY);
      if (storedPreOrders) {
        setPreOrders(JSON.parse(storedPreOrders));
      } else {
        localStorage.setItem(PREORDERS_STORAGE_KEY, JSON.stringify(initialPreOrders));
        setPreOrders(initialPreOrders);
      }
      
      const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (storedInventory) {
        setInventoryItems(JSON.parse(storedInventory));
      } else {
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(initialInventoryItems));
        setInventoryItems(initialInventoryItems);
      }
    } catch (error) {
      console.error("Failed to access localStorage", error);
      setPreOrders(initialPreOrders);
      setInventoryItems(initialInventoryItems);
    }
  }, []);

  const updatePreOrders = (updatedOrders: PreOrder[]) => {
    setPreOrders(updatedOrders);
    localStorage.setItem(PREORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
  }


  const handleCreatePreOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedItemId = formData.get("item") as string;
    const selectedItem = inventoryItems.find(i => i.id === selectedItemId);

    if (!selectedItem) return;

    const newPreOrder: PreOrder = {
      id: `po${Date.now()}`,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      unit: selectedItem.unit,
      quantity: Number(formData.get("quantity")),
      orderDate: new Date().toISOString(),
      expectedDate: new Date(formData.get("expectedDate") as string).toISOString(),
      status: "Pending",
    };
    updatePreOrders([newPreOrder, ...preOrders]);
    toast({
      title: "Pre-Order Created",
      description: `Pre-order for ${newPreOrder.quantity}x ${newPreOrder.itemName} has been created.`,
    });
    setCreateOpen(false);
  };

  const updateStatus = (id: string, status: PreOrder['status']) => {
    const updatedOrders = preOrders.map(order =>
      order.id === id ? { ...order, status } : order
    );
    updatePreOrders(updatedOrders);
    toast({
      title: 'Status Updated',
      description: `Order ${id} marked as ${status}.`
    });
  };

  const handleRequestApproval = () => {
    const itemsToApprove = preOrders.filter(order => selectedRows.includes(order.id) && order.status === 'Pending');
    if (itemsToApprove.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No items to send',
        description: 'Please select pending pre-orders to request approval.',
      });
      return;
    }

    try {
      const existingApprovals: PreOrder[] = JSON.parse(localStorage.getItem(APPROVAL_STORAGE_KEY) || '[]');
      // Filter out items that might already be in the approval queue
      const newItemsToApprove = itemsToApprove.filter(item => !existingApprovals.some(approval => approval.id === item.id));
      const newApprovals = [...existingApprovals, ...newItemsToApprove];
      localStorage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(newApprovals));
      
      const updatedOrders = preOrders.map(order =>
        itemsToApprove.some(item => item.id === order.id)
          ? { ...order, status: 'Awaiting Approval' }
          : order
      );
      updatePreOrders(updatedOrders);
      
      setSelectedRows([]);
      toast({
        title: 'Approval Requested',
        description: `${itemsToApprove.length} pre-order(s) have been sent for approval.`,
      });
      router.push('/approval');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to save approvals',
        description: 'Could not save approval requests to local storage.',
      });
    }
  };
  
  const handleExportPdf = () => {
    if (selectedRows.length === 0) {
      toast({
        variant: "destructive",
        title: "No items selected",
        description: "Please select one or more approved items to export.",
      });
      return;
    }
    const selectedApprovedRows = preOrders.filter(order => selectedRows.includes(order.id) && order.status === 'Approved');
     if (selectedApprovedRows.length === 0) {
      toast({
        variant: "destructive",
        title: "No approved items selected",
        description: "Only approved pre-orders can be exported to a delivery order.",
      });
      return;
    }
    
    const ids = selectedApprovedRows.map(o => o.id).join(',');
    router.push(`/surat-jalan?ids=${ids}`);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableRows = filteredPreOrders
        .filter(o => o.status === 'Pending' || o.status === 'Approved')
        .map(order => order.id);
      setSelectedRows(selectableRows);
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
    const dateMatch = !dateFilter || format(new Date(order.expectedDate), 'yyyy-MM-dd') === format(dateFilter, 'yyyy-MM-dd');
    return statusMatch && dateMatch;
  });
  
  const selectableRowCount = filteredPreOrders.filter(o => o.status === 'Pending' || o.status === 'Approved').length;
  const isAllSelected = selectedRows.length > 0 && selectableRowCount > 0 && selectedRows.length === selectableRowCount;
  const canRequestApproval = selectedRows.some(id => preOrders.find(o => o.id === id)?.status === 'Pending');
  const canExport = selectedRows.length > 0;

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
              <SelectItem value="Awaiting Approval">Awaiting Approval</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
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

          <Button onClick={handleRequestApproval} disabled={!canRequestApproval}>
            <Send className="mr-2 h-4 w-4" />
            Request Approval
          </Button>
           <Button onClick={handleExportPdf} disabled={!canExport}>
            <FileDown className="mr-2 h-4 w-4" />
            Export PDF
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
                    disabled={selectableRowCount === 0}
                  />
              </TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Unit</TableHead>
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
                      disabled={order.status !== 'Pending' && order.status !== 'Approved'}
                    />
                </TableCell>
                <TableCell className="font-medium">{order.itemName}</TableCell>
                <TableCell>{order.unit}</TableCell>
                <TableCell className="text-right">{order.quantity}</TableCell>
                <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(order.expectedDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={
                      order.status === 'Fulfilled' ? 'default' :
                      order.status === 'Approved' ? 'default' :
                      order.status === 'Pending' ? 'outline' :
                      order.status === 'Awaiting Approval' ? 'warning' :
                      order.status === 'Rejected' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost" disabled={order.status !== 'Approved'}>
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
