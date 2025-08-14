
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  writeBatch,
  query,
  orderBy,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, MoreHorizontal, Send, Calendar as CalendarIcon, X, FileDown, Trash2 } from "lucide-react";
import type { PreOrder, InventoryItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

function PreOrdersContent() {
  const [preOrders, setPreOrders] = React.useState<PreOrder[]>([]);
  const [inventoryItems, setInventoryItems] = React.useState<InventoryItem[]>([]);
  const [isCreateOpen, setCreateOpen] = React.useState(false);
  const [isDeleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedOrder, setSelectedOrder] = React.useState<PreOrder | null>(null);
  const { toast } = useToast();
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [dateFilter, setDateFilter] = React.useState<Date | undefined>(undefined);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedUnit, setSelectedUnit] = React.useState<string | undefined>();
  const [defaultItemId, setDefaultItemId] = React.useState<string | undefined>();
  

  React.useEffect(() => {
    const qPreOrders = query(collection(db, "pre-orders"), orderBy("orderDate", "desc"));
    const unsubscribePreOrders = onSnapshot(qPreOrders, (querySnapshot) => {
      const orders: PreOrder[] = [];
      querySnapshot.forEach((doc) => {
        orders.push({ id: doc.id, ...doc.data() } as PreOrder);
      });
      setPreOrders(orders);
    });

    const qInventory = query(collection(db, "inventory"), orderBy("name"));
    const unsubscribeInventory = onSnapshot(qInventory, (querySnapshot) => {
      const items: InventoryItem[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setInventoryItems(items);
    });

    return () => {
      unsubscribePreOrders();
      unsubscribeInventory();
    };
  }, []);
  
  React.useEffect(() => {
    const create = searchParams.get('create');
    const itemId = searchParams.get('itemId');

    if (create === 'true' && itemId) {
        setDefaultItemId(itemId);
        setCreateOpen(true);
        // Clean up URL params
        router.replace('/pre-orders', { scroll: false });
    }
  }, [searchParams, router]);


  const handleCreatePreOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedItemId = formData.get("item") as string;
    const selectedItem = inventoryItems.find(i => i.id === selectedItemId);

    if (!selectedItem) return;

    const newPreOrderData: Omit<PreOrder, 'id'> = {
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      unit: selectedUnit || "Pcs",
      quantity: Number(formData.get("quantity")),
      orderDate: new Date().toISOString(),
      expectedDate: new Date(formData.get("expectedDate") as string).toISOString(),
      status: "Pending",
    };
    
    await addDoc(collection(db, "pre-orders"), newPreOrderData);
    
    toast({
      title: "Pre-Order Created",
      description: `Pre-order for ${newPreOrderData.quantity}x ${newPreOrderData.itemName} has been created.`,
    });
    setCreateOpen(false);
    setSelectedUnit(undefined);
    setDefaultItemId(undefined);
    (e.target as HTMLFormElement).reset();
  };
  
  const handleDeletePreOrder = async () => {
    if (!selectedOrder) return;

    await deleteDoc(doc(db, "pre-orders", selectedOrder.id));

    toast({
        title: "Pre-Order Deleted",
        description: `The pre-order for ${selectedOrder.itemName} has been removed.`
    });
    setDeleteOpen(false);
    setSelectedOrder(null);
  }

  const updateStatus = async (id: string, status: PreOrder['status']) => {
    const orderRef = doc(db, "pre-orders", id);
    await updateDoc(orderRef, { status });
    toast({
      title: 'Status Updated',
      description: `Order ${id} marked as ${status}.`
    });
  };

  const handleRequestApproval = async () => {
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
      const batch = writeBatch(db);
      itemsToApprove.forEach(order => {
        const orderRef = doc(db, 'pre-orders', order.id);
        batch.update(orderRef, { status: 'Awaiting Approval' });
      });

      await batch.commit();

      setSelectedRows([]);
      toast({
        title: 'Approval Requested',
        description: `${itemsToApprove.length} pre-order(s) have been sent for approval.`,
      });
      router.push('/approval');
    } catch (error) {
       console.error("Error requesting approval: ", error);
      toast({
        variant: 'destructive',
        title: 'Failed to request approvals',
        description: 'Could not update pre-order statuses in the database.',
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
  const canExport = selectedRows.some(id => preOrders.find(o => o.id === id)?.status === 'Approved');

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pre-Orders</h1>
          <p className="text-muted-foreground">
            Track and manage your upcoming stock deliveries.
          </p>
        </div>
        <div className="flex flex-col md:flex-row w-full md:w-auto items-center gap-2">
           <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
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

           <div className="flex w-full md:w-auto items-center gap-2">
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full md:w-auto justify-start text-left font-normal"
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
           </div>

          <div className="flex w-full md:w-auto items-center gap-2">
            <Button onClick={handleRequestApproval} disabled={!canRequestApproval} className="w-full md:w-auto">
              <Send className="mr-2 h-4 w-4" />
              Request Approval
            </Button>
            <Button onClick={handleExportPdf} disabled={!canExport} className="w-full md:w-auto">
              <FileDown className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={(isOpen) => { setCreateOpen(isOpen); if(!isOpen) setDefaultItemId(undefined); }}>
              <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
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
                    <Select name="item" required defaultValue={defaultItemId}>
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
                    <Label htmlFor="unit" className="text-right">Unit</Label>
                    <Select name="unit" required onValueChange={setSelectedUnit}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pcs">Pcs</SelectItem>
                        <SelectItem value="Pack">Pack</SelectItem>
                        <SelectItem value="Box">Box</SelectItem>
                        <SelectItem value="Roll">Roll</SelectItem>
                        <SelectItem value="Rim">Rim</SelectItem>
                        <SelectItem value="Tube">Tube</SelectItem>
                        <SelectItem value="Bottle">Bottle</Bottle>
                        <SelectItem value="Can">Can</SelectItem>
                        <SelectItem value="Sheet">Sheet</SelectItem>
                        <SelectItem value="Cartridge">Cartridge</SelectItem>
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

        </div>
      </header>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead padding="checkbox" className="hidden sm:table-cell">
                 <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    aria-label="Select all"
                    disabled={selectableRowCount === 0}
                  />
              </TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead className="hidden md:table-cell">Unit</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="hidden lg:table-cell">Order Date</TableHead>
              <TableHead className="hidden sm:table-cell">Expected Date</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPreOrders.map((order) => (
              <TableRow key={order.id} data-state={selectedRows.includes(order.id) && "selected"}>
                <TableCell padding="checkbox" className="hidden sm:table-cell">
                  <Checkbox
                      checked={selectedRows.includes(order.id)}
                      onCheckedChange={() => handleSelectRow(order.id)}
                      aria-label="Select row"
                      disabled={order.status !== 'Pending' && order.status !== 'Approved'}
                    />
                </TableCell>
                <TableCell className="font-medium">{order.itemName}</TableCell>
                <TableCell className="hidden md:table-cell">{order.unit}</TableCell>
                <TableCell className="text-right">{order.quantity}</TableCell>
                <TableCell className="hidden lg:table-cell">{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                <TableCell className="hidden sm:table-cell">{new Date(order.expectedDate).toLocaleDateString()}</TableCell>
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
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      {order.status === 'Approved' && (
                        <>
                          <DropdownMenuItem onSelect={() => updateStatus(order.id, 'Fulfilled')}>Mark as Fulfilled</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => updateStatus(order.id, 'Cancelled')}>Mark as Cancelled</DropdownMenuItem>
                          <DropdownMenuSeparator />
                        </>
                      )}
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-700"
                        onSelect={() => {
                          setSelectedOrder(order);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
       {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the pre-order for
              <span className="font-semibold"> {selectedOrder?.itemName}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedOrder(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePreOrder}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function PreOrdersPage() {
    return (
        <React.Suspense fallback={<div>Loading...</div>}>
            <PreOrdersContent />
        </React.Suspense>
    )
}

