
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
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
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { PreOrder } from "@/lib/types";
import { Check, X } from "lucide-react";


export default function ApprovalPage() {
  const [approvalItems, setApprovalItems] = React.useState<PreOrder[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  React.useEffect(() => {
    const q = query(collection(db, "pre-orders"), where("status", "==", "Awaiting Approval"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: PreOrder[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as PreOrder);
      });
      setApprovalItems(items);
    });

    return () => unsubscribe();
  }, []);

  const handleDecision = async (orderId: string, decision: "approved" | "rejected") => {
    const originalOrder = approvalItems.find((item) => item.id === orderId);
    if (!originalOrder) return;

    const newStatus = decision === "approved" ? "Approved" : "Rejected";
    const orderRef = doc(db, "pre-orders", orderId);
    
    try {
        await updateDoc(orderRef, { status: newStatus });
        toast({
          title: `Pre-Order ${decision}`,
          description: `The pre-order for ${originalOrder.itemName} has been ${decision}.`,
        });
        router.push('/pre-orders');
    } catch(error) {
        console.error("Failed to update pre-order status", error);
        toast({
            variant: "destructive",
            title: "Error updating pre-order status",
        });
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Approval Queue</h1>
        <p className="text-muted-foreground">
          Review and approve or reject pending pre-orders.
        </p>
      </header>
      
      {approvalItems.length > 0 ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Date</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvalItems.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.itemName}</TableCell>
                  <TableCell className="text-right">{order.quantity}</TableCell>
                  <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(order.expectedDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="warning">{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-green-600 hover:text-green-700"
                      onClick={() => handleDecision(order.id, "approved")}
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Approve</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDecision(order.id, "rejected")}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Reject</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm py-24">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              No pending approvals
            </h3>
            <p className="text-sm text-muted-foreground">
              There are currently no items that require your approval.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
