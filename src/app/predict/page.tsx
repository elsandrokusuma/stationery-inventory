
"use client";

import React, { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { getStockPrediction } from "./actions";
import type { PredictStockNeedsOutput } from "@/ai/flows/predict-stock-needs";
import { Loader2, Sparkles, BarChart, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { InventoryItem, PreOrder } from "@/lib/types";

const formSchema = z.object({
  historicalData: z.string().min(10, "Please provide more historical data."),
  preOrders: z.string().min(10, "Please provide more pre-order data."),
});

const INVENTORY_STORAGE_KEY = "stockpilot-inventory";
const PREORDERS_STORAGE_KEY = "stockpilot-preorders";

export default function PredictPage() {
  const [prediction, setPrediction] = useState<PredictStockNeedsOutput | null>(null);
  const [isPending, startTransition] = useTransition();
  const [historicalData, setHistoricalData] = useState("[]");
  const [preOrderData, setPreOrderData] = useState("[]");

  useEffect(() => {
    try {
      const storedInventory = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (storedInventory) {
        const items: InventoryItem[] = JSON.parse(storedInventory);
        const historical = items.map(({ name, quantity }) => ({ name, quantity }));
        setHistoricalData(JSON.stringify(historical, null, 2));
      }

      const storedPreOrders = localStorage.getItem(PREORDERS_STORAGE_KEY);
      if (storedPreOrders) {
        const orders: PreOrder[] = JSON.parse(storedPreOrders);
        const preOrders = orders.map(({ itemName, quantity, expectedDate, status }) => ({
          itemName,
          quantity,
          expectedDate,
          status,
        }));
        setPreOrderData(JSON.stringify(preOrders, null, 2));
      }
    } catch (error) {
        console.error("Failed to load data from localStorage", error);
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      historicalData: historicalData,
      preOrders: preOrderData,
    },
    // The form is re-initialized when the `values` prop changes.
    // This is necessary because `historicalData` and `preOrderData` are loaded asynchronously.
    resetOptions: {
      keepDirtyValues: true,
    },
  });

   useEffect(() => {
    form.reset({
      historicalData: historicalData,
      preOrders: preOrderData,
    });
  }, [historicalData, preOrderData, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const result = await getStockPrediction(values);
      setPrediction(result);
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Predictive Stock Tool</h1>
        <p className="text-muted-foreground">
          Use AI to forecast future inventory needs based on historical data.
        </p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Input Data</CardTitle>
            <CardDescription>Provide historical and pre-order data in JSON format.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="historicalData"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Historical Stock Data</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={10} placeholder="Paste historical data here..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="preOrders"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Pre-Orders</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={6} placeholder="Paste pre-order data here..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Predict Needs
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <div className="md:col-span-1 flex flex-col gap-8">
          {isPending && (
             <Card className="flex-grow flex flex-col items-center justify-center bg-muted/50">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="mt-4 text-muted-foreground">AI is analyzing your data...</p>
             </Card>
          )}

          {!isPending && !prediction && (
            <Card className="flex-grow flex flex-col items-center justify-center text-center bg-muted/50 p-8">
                <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                <h2 className="mt-4 text-lg font-semibold text-muted-foreground">AI Prediction Results</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Your generated stock predictions will appear here once you submit your data.
                </p>
             </Card>
          )}

          {prediction && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BarChart className="text-primary" /> Predicted Needs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{prediction.predictedNeeds}</p>
                   <Alert className="mt-4">
                      <AlertTitle>Confidence: {prediction.confidenceLevel}</AlertTitle>
                      <AlertDescription>
                        This prediction is based on the data provided. More data improves accuracy.
                      </AlertDescription>
                    </Alert>
                    <Alert className="mt-4">
                      <AlertTitle className="flex items-center gap-2"><CheckCircle className="text-primary" /> Suggested Actions</AlertTitle>
                      <AlertDescription>
                         <p className="whitespace-pre-wrap">{prediction.suggestedActions}</p>
                      </AlertDescription>
                    </Alert>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
