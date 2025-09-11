'use server';

import { suggestSolutions, type SuggestSolutionsInput, type SuggestSolutionsOutput } from '@/ai/flows/ai-suggested-solutions';

export async function getAiSuggestions(input: SuggestSolutionsInput): Promise<SuggestSolutionsOutput> {
  try {
    const result = await suggestSolutions(input);
    return result;
  } catch (error) {
    console.error('Error calling suggestSolutions flow:', error);
    throw new Error('Failed to get AI suggestions.');
  }
}
