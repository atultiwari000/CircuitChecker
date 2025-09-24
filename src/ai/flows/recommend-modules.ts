'use server';

/**
 * @fileOverview An AI agent that recommends alternative modules based on compatibility issues.
 *
 * - recommendAlternativeModules - A function that handles the module recommendation process.
 * - RecommendAlternativeModulesInput - The input type for the recommendAlternativeModules function.
 * - RecommendAlternativeModulesOutput - The return type for the recommendAlternativeModules function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendAlternativeModulesInputSchema = z.object({
  currentComponent: z.object({
    name: z.string().describe('The name of the current hardware module.'),
    operatingVoltageRange: z
      .string()
      .describe('The operating voltage range of the module (e.g., 3.3V-5V).'),
    currentRequirements: z
      .string()
      .describe('The current requirements of the module (e.g., 100mA).'),
    powerRequirements: z
      .string()
      .describe('The power requirements of the module (e.g., 0.5W).'),
    communicationProtocol: z
      .string()
      .describe('The communication protocol used by the module (e.g., I2C, SPI).'),
  }).describe('The specifications of the current hardware module.'),
  incompatibleReason: z.string().describe('The reason why the current module is incompatible.'),
  availableModules: z.array(z.object({
    name: z.string().describe('The name of the available hardware module.'),
    operatingVoltageRange: z
      .string()
      .describe('The operating voltage range of the module (e.g., 3.3V-5V).'),
    currentRequirements: z
      .string()
      .describe('The current requirements of the module (e.g., 100mA).'),
    powerRequirements: z
      .string()
      .describe('The power requirements of the module (e.g., 0.5W).'),
    communicationProtocol: z
      .string()
      .describe('The communication protocol used by the module (e.g., I2C, SPI).'),
  })).describe('The list of available hardware modules.'),
});

export type RecommendAlternativeModulesInput = z.infer<typeof RecommendAlternativeModulesInputSchema>;

const RecommendAlternativeModulesOutputSchema = z.object({
  recommendedModules: z.array(z.object({
    name: z.string().describe('The name of the recommended alternative module.'),
    reason: z.string().describe('The reason why this module is recommended.'),
  })).describe('The list of recommended alternative modules.'),
});

export type RecommendAlternativeModulesOutput = z.infer<typeof RecommendAlternativeModulesOutputSchema>;

export async function recommendAlternativeModules(
  input: RecommendAlternativeModulesInput
): Promise<RecommendAlternativeModulesOutput> {
  return recommendAlternativeModulesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendAlternativeModulesPrompt',
  input: {schema: RecommendAlternativeModulesInputSchema},
  output: {schema: RecommendAlternativeModulesOutputSchema},
  prompt: `You are an expert hardware engineer specializing in recommending alternative hardware modules based on compatibility issues.

You will be provided with the specifications of the current hardware module, the reason why it is incompatible with the current design, and a list of available hardware modules.

Based on this information, you will recommend alternative modules that are compatible with the current design.

Current Module Specifications:
Name: {{{currentComponent.name}}}
Operating Voltage Range: {{{currentComponent.operatingVoltageRange}}}
Current Requirements: {{{currentComponent.currentRequirements}}}
Power Requirements: {{{currentComponent.powerRequirements}}}
Communication Protocol: {{{currentComponent.communicationProtocol}}}

Incompatible Reason: {{{incompatibleReason}}}

Available Modules:
{{#each availableModules}}
Name: {{{name}}}
Operating Voltage Range: {{{operatingVoltageRange}}}
Current Requirements: {{{currentRequirements}}}
Power Requirements: {{{powerRequirements}}}
Communication Protocol: {{{communicationProtocol}}}
{{/each}}

Recommend alternative modules that address the incompatibility issue and provide a reason for each recommendation.
Ensure that the operating voltage, current, and power requirements for the alternative modules satisfies the design. Consider any communication protocols for the alternative modules.

Format your response as a JSON array of recommended modules with their respective reasons.
`, 
});

const recommendAlternativeModulesFlow = ai.defineFlow(
  {
    name: 'recommendAlternativeModulesFlow',
    inputSchema: RecommendAlternativeModulesInputSchema,
    outputSchema: RecommendAlternativeModulesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

