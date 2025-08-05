'use server';

/**
 * @fileOverview This file defines a Genkit flow for predicting future stock needs.
 *
 * - predictStockNeeds - A function that predicts future stock needs based on historical data and pre-orders.
 * - PredictStockNeedsInput - The input type for the predictStockNeeds function.
 * - PredictStockNeedsOutput - The output type for the predictStockNeeds function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictStockNeedsInputSchema = z.object({
  historicalData: z
    .string()
    .describe(
      'Historical stock data, including dates, quantities in/out, and any relevant details.'
    ),
  preOrders: z
    .string()
    .describe('Data on existing pre-orders, including item, quantity, and due date.'),
});
export type PredictStockNeedsInput = z.infer<typeof PredictStockNeedsInputSchema>;

const PredictStockNeedsOutputSchema = z.object({
  predictedNeeds: z
    .string()
    .describe('AI-driven predictions of future stock needs, with quantities and rationale.'),
  confidenceLevel: z
    .string()
    .describe('A qualitative assessment of the prediction confidence (e.g., High, Medium, Low).'),
  suggestedActions: z
    .string()
    .describe(
      'Suggested actions based on the predictions, such as reordering or running promotions.'
    ),
});
export type PredictStockNeedsOutput = z.infer<typeof PredictStockNeedsOutputSchema>;

export async function predictStockNeeds(input: PredictStockNeedsInput): Promise<PredictStockNeedsOutput> {
  return predictStockNeedsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictStockNeedsPrompt',
  input: {schema: PredictStockNeedsInputSchema},
  output: {schema: PredictStockNeedsOutputSchema},
  prompt: `You are an AI assistant that helps warehouse managers predict future stock needs.

  Analyze the historical stock data and pre-order information provided to predict future stock requirements.
  Provide a confidence level for the prediction and suggest actions to optimize inventory.

  Historical Data: {{{historicalData}}}
  Pre-Orders: {{{preOrders}}}

  Based on this information, predict the future stock needs, provide a confidence level, and suggest actions.
  Be as detailed as possible in your reasoning.
`,
});

const predictStockNeedsFlow = ai.defineFlow(
  {
    name: 'predictStockNeedsFlow',
    inputSchema: PredictStockNeedsInputSchema,
    outputSchema: PredictStockNeedsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
