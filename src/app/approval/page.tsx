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
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { PreOrder } from "@/lib/types";
import { Check, X } from "lucide-react";

const APPROVAL_STORAGE_KEY = "stationery-inventory-pending-approvals";

export default function ApprovalPage() {
  const [approvalItems, setApprovalItems] = React.useState<PreOrder[]>([]);
  const { toast } = useToast();

  React.useEffect(() => {
    try {
      const storedItems = localStorage.getItem(APPROVAL_STORAGE_KEY);
      if (storedItems) {
        setApprovalItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Failed to parse approval items from localStorage", error);
    }
  }, []);

  const updateLocalStorage = (updatedItems: PreOrder[]) => {
    localStorage.setItem(APPROVAL_STORAGE_KEY, JSON.stringify(updatedItems));
  };

  const handleDecision = (orderId: string, decision: "approved" | "rejected") => {
    const updatedItems = approvalItems.filter((item) => item.id !== orderId);
    setApprovalItems(updatedItems);
    updateLocalStorage(updatedItems);

    // In a real app, you would also update the status on the main pre-orders page,
    // possibly via a shared state or by refetching data.
    // For this prototype, we just show a toast message.
    
    const originalOrder = approvalItems.find(item => item.id === orderId);
    toast({
      title: `Pre-Order ${decision}`,
      description: `The pre-order for ${originalOrder?.itemName} has been ${decision}.`,
    });
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
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
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
