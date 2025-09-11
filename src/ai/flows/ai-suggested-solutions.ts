// This is a server-side file.
'use server';

/**
 * @fileOverview This file defines the Genkit flow for suggesting solutions to circuit validation failures using AI reasoning.
 *
 * - `suggestSolutions`: A function that takes circuit validation failure descriptions as input and returns AI-suggested solutions.
 * - `SuggestSolutionsInput`: The input type for the `suggestSolutions` function.
 * - `SuggestSolutionsOutput`: The output type for the `suggestSolutions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the input schema for the suggestSolutions function.
const SuggestSolutionsInputSchema = z.object({
  circuitDescription: z.string().describe('A detailed description of the circuit design, including components and connections.'),
  validationFailures: z.array(z.string()).describe('An array of descriptions of the circuit validation failures.'),
});
export type SuggestSolutionsInput = z.infer<typeof SuggestSolutionsInputSchema>;

// Define the output schema for the suggestSolutions function.
const SuggestSolutionsOutputSchema = z.object({
  suggestedSolutions: z.array(z.string()).describe('An array of AI-suggested solutions to the circuit validation failures.'),
});
export type SuggestSolutionsOutput = z.infer<typeof SuggestSolutionsOutputSchema>;

// Define the main suggestSolutions function.
export async function suggestSolutions(input: SuggestSolutionsInput): Promise<SuggestSolutionsOutput> {
  return suggestSolutionsFlow(input);
}

// Define the prompt for the AI model.
const prompt = ai.definePrompt({
  name: 'suggestSolutionsPrompt',
  input: {schema: SuggestSolutionsInputSchema},
  output: {schema: SuggestSolutionsOutputSchema},
  prompt: `You are an expert electrical engineer specializing in circuit design and validation.

  Based on the following circuit description and validation failures, suggest potential solutions to fix the issues.

  Circuit Description: {{{circuitDescription}}}

  Validation Failures:
  {{#each validationFailures}}
  - {{{this}}}
  {{/each}}

  Suggest specific and actionable solutions for each validation failure. Be as detailed as possible.
  Format your output as a numbered list of solutions.
  `,
});

// Define the Genkit flow for suggesting solutions.
const suggestSolutionsFlow = ai.defineFlow(
  {
    name: 'suggestSolutionsFlow',
    inputSchema: SuggestSolutionsInputSchema,
    outputSchema: SuggestSolutionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
