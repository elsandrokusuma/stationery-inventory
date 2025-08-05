'use server';

import { predictStockNeeds, type PredictStockNeedsInput, type PredictStockNeedsOutput } from '@/ai/flows/predict-stock-needs';

export async function getStockPrediction(input: PredictStockNeedsInput): Promise<PredictStockNeedsOutput> {
  const result = await predictStockNeeds(input);
  return result;
}
