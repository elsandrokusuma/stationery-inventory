
"use client";

import * as React from "react";
import Image from "next/image";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
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
import {
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  MoreHorizontal,
  Search,
  Trash2,
  Pencil,
  Camera,
} from "lucide-react";
import type { InventoryItem, Transaction } from "@/lib/types";
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
import { getGoogleDriveImageSrc } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function InventoryPage() {
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isAddOpen, setAddOpen] = React.useState(false);
  const [isStockInOpen, setStockInOpen] = React.useState(false);
  const [isStockOutOpen, setStockOutOpen] = React.useState(false);
  const [isEditItemOpen, setEditItemOpen] = React.useState(false);
  const [isDeleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<InventoryItem | null>(null);
  const { toast } = useToast();
  const [selectedUnit, setSelectedUnit] = React.useState<string | undefined>();
  const [isPhotoOpen, setPhotoOpen] = React.useState(false);
  const [photoToShow, setPhotoToShow] = React.useState<string | null>(null);

  // States for camera functionality
  const [isCameraOpen, setCameraOpen] = React.useState(false);
  const [hasCameraPermission, setHasCameraPermission] = React.useState(true);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = React.useState("");
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);


  React.useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const inventoryItems: InventoryItem[] = [];
      querySnapshot.forEach((doc) => {
        inventoryItems.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setItems(inventoryItems);
    });

    return () => unsubscribe();
  }, []);
  
  React.useEffect(() => {
    if(isEditItemOpen && selectedItem) {
      setPhotoUrl(selectedItem.photoUrl || "");
    } else {
      setPhotoUrl("");
    }
  }, [isEditItemOpen, selectedItem]);
  

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'date'>) => {
    await addDoc(collection(db, "transactions"), {
      ...transaction,
      date: new Date().toISOString(),
    });
  };


  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItemData = {
      name: formData.get("name") as string,
      unit: selectedUnit || (formData.get("unit") as string),
      quantity: Number(formData.get("quantity")),
      photoUrl: photoUrl || undefined,
    };

    const docRef = await addDoc(collection(db, "inventory"), newItemData);
    
    addTransaction({
        itemId: docRef.id,
        itemName: newItemData.name,
        type: 'add',
        quantity: newItemData.quantity,
    });

    toast({
      title: "Success",
      description: `${newItemData.name} has been added to inventory.`,
    });

    setAddOpen(false);
    setSelectedUnit(undefined);
    setPhotoUrl("");
    (e.target as HTMLFormElement).reset();
  };
  
   const handleEditItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;

    const formData = new FormData(e.currentTarget);
    const updatedQuantity = Number(formData.get("quantity"));
    const originalQuantity = selectedItem.quantity;
    
    const updatedItemData = {
      name: formData.get("name") as string,
      unit: selectedUnit || selectedItem.unit,
      photoUrl: photoUrl || selectedItem.photoUrl,
      quantity: updatedQuantity,
    };

    if (updatedQuantity < 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Quantity cannot be negative.",
      });
      return;
    }

    const itemRef = doc(db, "inventory", selectedItem.id);
    await updateDoc(itemRef, updatedItemData);

    if (originalQuantity !== updatedQuantity) {
        addTransaction({
          itemId: selectedItem.id,
          itemName: updatedItemData.name,
          type: 'edit',
          quantity: updatedQuantity,
        });
    }

    toast({
      title: "Item Updated",
      description: `${updatedItemData.name} has been updated.`,
    });
    setEditItemOpen(false);
    setSelectedItem(null);
    setSelectedUnit(undefined);
    setPhotoUrl("");
  };

  const handleStockUpdate = (type: "in" | "out") => async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!selectedItem) return;

      const formData = new FormData(e.currentTarget);
      const quantity = Number(formData.get("quantity"));
      const person = formData.get("person") as string | undefined;

      const itemRef = doc(db, "inventory", selectedItem.id);
      const newQuantity = type === "in" ? selectedItem.quantity + quantity : selectedItem.quantity - quantity;

      if (newQuantity < 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Stock cannot be negative.",
        });
        return;
      }
      
      await updateDoc(itemRef, { quantity: newQuantity });
      addTransaction({ itemId: selectedItem.id, itemName: selectedItem.name, type, quantity, person });
      
      toast({
        title: "Stock Updated",
        description: `Quantity for ${selectedItem.name} updated.`,
      });
      
      if (type === 'in') setStockInOpen(false);
      else setStockOutOpen(false);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    await deleteDoc(doc(db, "inventory", selectedItem.id));
    
    addTransaction({
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        type: 'delete',
        quantity: selectedItem.quantity,
    });

    toast({
        title: "Item Deleted",
        description: `${selectedItem.name} has been removed from inventory.`
    });
    setDeleteOpen(false);
    setSelectedItem(null);
  }

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const getDisplayImage = (url: string | undefined | null) => {
    if (!url) return "https://placehold.co/64x64.png";
    if (url.startsWith("data:image")) return url;
    return getGoogleDriveImageSrc(url) || "https://placehold.co/64x64.png";
  };


  const handlePhotoClick = (photoUrl: string | undefined | null) => {
    const imageUrl = getDisplayImage(photoUrl);
    if (imageUrl) {
        setPhotoToShow(imageUrl);
        setPhotoOpen(true);
    }
  };
  
  React.useEffect(() => {
    const getCameraPermission = async () => {
      if (!isCameraOpen) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video: true});
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
    
    // Cleanup function to stop video stream
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen, toast]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUri);
      }
    }
  };
  
  const handleSavePhoto = () => {
    if (capturedImage) {
      setPhotoUrl(capturedImage);
      setCameraOpen(false);
      setCapturedImage(null);
    }
  };


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
          <Dialog open={isAddOpen} onOpenChange={(isOpen) => { setAddOpen(isOpen); if (!isOpen) setPhotoUrl(""); }}>
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
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="photoUrl" className="text-right">Photo</Label>
                   <div className="col-span-3 flex items-center gap-2">
                      <Input 
                        id="photoUrl" 
                        name="photoUrl" 
                        type="text" 
                        placeholder="Or paste https://drive.google.com/..." 
                        className="flex-grow"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                      />
                      <Button type="button" size="icon" variant="outline" onClick={() => setCameraOpen(true)}>
                        <Camera className="h-4 w-4" />
                        <span className="sr-only">Take Photo</span>
                      </Button>
                   </div>
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
              <TableHead className="w-[80px]">Photo</TableHead>
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
                <TableCell>
                  <div className="cursor-pointer" onClick={() => handlePhotoClick(item.photoUrl)}>
                     <Image
                        alt={item.name}
                        className="aspect-square rounded-md object-cover"
                        height="64"
                        src={getDisplayImage(item.photoUrl)}
                        width="64"
                        data-ai-hint="product image"
                      />
                  </div>
                </TableCell>
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
                          setEditItemOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
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
                        className="text-red-600 focus:text-red-700"
                        onSelect={() => {
                          setSelectedItem(item);
                          setDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Item
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      {/* Photo Viewer Dialog */}
      <Dialog open={isPhotoOpen} onOpenChange={setPhotoOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Item Photo</DialogTitle>
            <DialogDescription>
              A larger view of the inventory item's photo.
            </DialogDescription>
          </DialogHeader>
          {photoToShow && (
            <Image
              src={photoToShow}
              alt="Enlarged inventory item"
              width={600}
              height={400}
              className="rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Item Dialog */}
      <Dialog open={isEditItemOpen} onOpenChange={setEditItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item: {selectedItem?.name}</DialogTitle>
            <DialogDescription>
             Update the details for this item. Changes to quantity will be logged as a transaction.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditItem} className="grid gap-4 py-4">
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" name="name" className="col-span-3" defaultValue={selectedItem?.name} required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-right">Unit</Label>
              <Select name="unit" defaultValue={selectedItem?.unit} onValueChange={setSelectedUnit}>
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
              <Label htmlFor="photoUrl" className="text-right">Photo</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input 
                  id="photoUrl" 
                  name="photoUrl" 
                  type="text" 
                  placeholder="Or paste https://drive.google.com/..." 
                  className="flex-grow" 
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                />
                 <Button type="button" size="icon" variant="outline" onClick={() => setCameraOpen(true)}>
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">Take Photo</span>
                  </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
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
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


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
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="person" className="text-right">From</Label>
              <Input id="person" name="person" placeholder="e.g., Supplier Name" className="col-span-3" />
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
              <Label htmlFor="person" className="text-right">To</Label>
              <Input id="person" name="person" placeholder="e.g., Customer, Department" className="col-span-3" />
            </div>
            <DialogFooter>
              <Button type="submit">Remove Stock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
       <AlertDialog open={isDeleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the item
              <span className="font-semibold"> {selectedItem?.name} </span>
              from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedItem(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Camera Capture Dialog */}
      <Dialog open={isCameraOpen} onOpenChange={(isOpen) => { setCameraOpen(isOpen); setCapturedImage(null); }}>
          <DialogContent className="max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Take a Photo</DialogTitle>
                  <DialogDescription>
                      Point your camera at the item and click "Capture".
                  </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4">
                  { !hasCameraPermission && (
                      <Alert variant="destructive">
                          <AlertTitle>Camera Access Required</AlertTitle>
                          <AlertDescription>
                              Please allow camera access in your browser to use this feature.
                          </AlertDescription>
                      </Alert>
                  )}
                  <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
                      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                      <canvas ref={canvasRef} className="hidden" />
                      {capturedImage && <Image src={capturedImage} alt="Captured image" layout="fill" className="object-cover" />}
                  </div>
              </div>
              <DialogFooter>
                  {capturedImage ? (
                      <>
                          <Button variant="outline" onClick={() => setCapturedImage(null)}>Retake</Button>
                          <Button onClick={handleSavePhoto}>Save Photo</Button>
                      </>
                  ) : (
                      <Button onClick={handleCapture} disabled={!hasCameraPermission}>Capture</Button>
                  )}
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
    </div>
  );
}

