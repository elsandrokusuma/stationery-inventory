
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { PreOrder } from "@/lib/types";
import { Printer } from "lucide-react";

const PREORDERS_STORAGE_KEY = "stationery-inventory-preorders";

export default function SuratJalanPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = React.useState<PreOrder[]>([]);

  React.useEffect(() => {
    const ids = searchParams.get("ids")?.split(",");
    if (!ids) return;

    try {
      const allPreOrders: PreOrder[] = JSON.parse(
        localStorage.getItem(PREORDERS_STORAGE_KEY) || "[]"
      );
      const selectedOrders = allPreOrders.filter((order) =>
        ids.includes(order.id)
      );
      setOrders(selectedOrders);
    } catch (error) {
      console.error("Failed to parse pre-orders from localStorage", error);
    }
  }, [searchParams]);

  const handlePrint = () => {
    window.print();
  };

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h1 className="text-2xl font-bold mb-2">No Orders Found</h1>
        <p className="text-muted-foreground">
          The requested delivery orders could not be found or no orders were selected.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
       <style>
        {`
          @media print {
            body {
              background-color: #fff;
            }
            .no-print {
              display: none;
            }
            .printable-area {
              border: none;
              box-shadow: none;
              margin: 0;
              padding: 0;
            }
          }
        `}
      </style>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-8 no-print">
            <h1 className="text-3xl font-bold tracking-tight">Surat Jalan</h1>
            <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
            </Button>
        </div>

        <Card className="printable-area p-8">
          <CardContent>
            <header className="mb-12">
              <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-primary">SURAT JALAN</h2>
                    <p className="text-muted-foreground">Delivery Order</p>
                  </div>
                  <div className="text-right">
                    <h3 className="font-bold text-lg">Stationery Inventory</h3>
                    <p className="text-sm text-muted-foreground">Jakarta, {today}</p>
                  </div>
              </div>
            </header>

            <main className="mb-12">
               <div className="mb-6">
                <p className="mb-1 text-muted-foreground">Kepada Yth,</p>
                <div className="w-1/2 h-20 border-b-2 border-dashed">
                  {/* Recipient area */}
                </div>
              </div>
              <p className="mb-4 text-muted-foreground">Dengan hormat,</p>
              <p className="mb-4">
                Bersama ini kami kirimkan barang-barang sebagai berikut:
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">Nama Barang</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Satuan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.itemName}
                      </TableCell>
                      <TableCell className="text-right">
                        {order.quantity}
                      </TableCell>
                       <TableCell>
                        Pcs
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </main>

            <footer className="pt-12">
              <p className="mb-12">
                Harap diterima dengan baik. Atas perhatiannya, kami ucapkan terima kasih.
              </p>
              <div className="flex justify-between text-center">
                <div>
                  <p className="mb-16">Penerima,</p>
                  <p>(.........................)</p>
                </div>
                <div>
                  <p className="mb-16">Hormat Kami,</p>
                  <p>(.........................)</p>
                </div>
              </div>
            </footer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
