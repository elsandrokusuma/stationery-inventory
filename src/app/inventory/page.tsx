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
import {
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  MoreHorizontal,
  Search,
  Edit,
} from "lucide-react";
import { inventoryItems as initialItems } from "@/lib/placeholder-data";
import type { InventoryItem } from "@/lib/types";
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

export default function InventoryPage() {
  const [items, setItems] = React.useState<InventoryItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isAddOpen, setAddOpen] = React.useState(false);
  const [isStockInOpen, setStockInOpen] = React.useState(false);
  const [isStockOutOpen, setStockOutOpen] = React.useState(false);
  const [isEditOpen, setEditOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(
    null
  );
  const { toast } = useToast();
  const [selectedUnit, setSelectedUnit] = React.useState<string | undefined>();


  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItem: InventoryItem = {
      id: (items.length + 1).toString(),
      name: formData.get("name") as string,
      unit: selectedUnit || (formData.get("unit") as string),
      quantity: Number(formData.get("quantity")),
      lastUpdated: new Date().toISOString().split("T")[0],
    };
    setItems([...items, newItem]);
    toast({
      title: "Success",
      description: `${newItem.name} has been added to inventory.`,
    });
    setAddOpen(false);
    setSelectedUnit(undefined);
  };

  const handleStockUpdate = (type: "in" | "out") => (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!selectedItem) return;

      const formData = new FormData(e.currentTarget);
      const quantity = Number(formData.get("quantity"));

      setItems(
        items.map((item) => {
          if (item.id === selectedItem.id) {
            const newQuantity =
              type === "in" ? item.quantity + quantity : item.quantity - quantity;
            if (newQuantity < 0) {
              toast({
                variant: "destructive",
                title: "Error",
                description: "Stock cannot be negative.",
              });
              return item;
            }
            return { ...item, quantity: newQuantity, lastUpdated: new Date().toISOString().split("T")[0] };
          }
          return item;
        })
      );

      toast({
        title: "Stock Updated",
        description: `Quantity for ${selectedItem.name} updated.`,
      });
      
      if (type === 'in') setStockInOpen(false);
      else setStockOutOpen(false);
  };

  const handleEditQuantity = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;

    const formData = new FormData(e.currentTarget);
    const quantity = Number(formData.get("quantity"));

    if (quantity < 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Quantity cannot be negative.",
      });
      return;
    }

    setItems(
      items.map((item) =>
        item.id === selectedItem.id
          ? { ...item, quantity, lastUpdated: new Date().toISOString().split("T")[0] }
          : item
      )
    );

    toast({
      title: "Quantity Updated",
      description: `Quantity for ${selectedItem.name} has been set to ${quantity}.`,
    });
    setEditOpen(false);
  };


  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your products and their stock levels.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by item name..."
              className="pl-8 sm:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Inventory Item</DialogTitle>
                <DialogDescription>
                  Fill in the details below to add a new product.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddItem} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" name="name" className="col-span-3" required />
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
                      <SelectItem value="Bottle">Bottle</SelectItem>
                      <SelectItem value="Can">Can</SelectItem>
                      <SelectItem value="Sheet">Sheet</SelectItem>
                      <SelectItem value="Cartridge">Cartridge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="text-right">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" className="col-span-3" required />
                </div>
                <DialogFooter>
                  <Button type="submit">Save Item</Button>
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
              <TableHead>Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={item.quantity > 5 ? "default" : item.quantity > 0 ? "warning" : "destructive"}
                  >
                    {item.quantity > 5 ? "In Stock" : item.quantity > 0 ? "Low Stock" : "Out of Stock"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{item.quantity}</TableCell>
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
                      <DropdownMenuItem
                        onSelect={() => {
                          setSelectedItem(item);
                          setStockInOpen(true);
                        }}
                      >
                        <ArrowDownCircle className="mr-2 h-4 w-4" /> Stock In
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setSelectedItem(item);
                          setStockOutOpen(true);
                        }}
                      >
                        <ArrowUpCircle className="mr-2 h-4 w-4" /> Stock Out
                      </DropdownMenuItem>
                       <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => {
                          setSelectedItem(item);
                          setEditOpen(true);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" /> Edit Quantity
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Stock In Dialog */}
      <Dialog open={isStockInOpen} onOpenChange={setStockInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Stock In: {selectedItem?.name}</DialogTitle>
            <DialogDescription>
              Add new stock received for this item.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStockUpdate("in")} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" className="col-span-3" required min="1" />
            </div>
            <DialogFooter>
              <Button type="submit">Add Stock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stock Out Dialog */}
      <Dialog open={isStockOutOpen} onOpenChange={setStockOutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Stock Out: {selectedItem?.name}</DialogTitle>
            <DialogDescription>
              Record stock that has been sold or used.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStockUpdate("out")} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" className="col-span-3" required min="1" max={selectedItem?.quantity} />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="recipient" className="text-right">Recipient</Label>
              <Input id="recipient" name="recipient" placeholder="e.g., Customer, Department" className="col-span-3" required />
            </div>
            <DialogFooter>
              <Button type="submit">Remove Stock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Quantity Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Quantity: {selectedItem?.name}</DialogTitle>
            <DialogDescription>
              Set the new total quantity for this item.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditQuantity} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                New Quantity
              </Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                className="col-span-3"
                defaultValue={selectedItem?.quantity}
                required
                min="0"
              />
            </div>
            <DialogFooter>
              <Button type="submit">Save Quantity</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
