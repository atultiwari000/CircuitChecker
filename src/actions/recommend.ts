"use server";

import { recommendAlternativeModules } from "@/ai/flows/recommend-modules";
import type { RecommendAlternativeModulesInput } from "@/ai/flows/recommend-modules";
import { MODULES } from "@/lib/data";
import type { Module as LocalModule } from "@/lib/types";

function formatModuleForAI(module: LocalModule) {
    return {
        name: module.name,
        operatingVoltageRange: `${module.operatingVoltage[0]}V-${module.operatingVoltage[1]}V`,
        currentRequirements: 'N/A', // Not in our current data model
        powerRequirements: 'N/A', // Not in our current data model
        communicationProtocol: 'N/A', // Not in our current data model
    };
}


export async function recommendAlternativeModulesAction(incompatibleModule: LocalModule, reason: string) {
    try {
        const availableModules = MODULES.filter(m => m.id !== incompatibleModule.id).map(formatModuleForAI);

        const input: RecommendAlternativeModulesInput = {
            currentComponent: formatModuleForAI(incompatibleModule),
            incompatibleReason: reason,
            availableModules: availableModules,
        };

        const recommendations = await recommendAlternativeModules(input);
        return recommendations;

    } catch (error) {
        console.error("Error getting recommendations:", error);
        return { recommendedModules: [] };
    }
}
