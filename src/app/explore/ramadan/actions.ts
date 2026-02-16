// src/app/explore/ramadan/actions.ts
'use server';

import { ramadanContentFlow, RamadanContextSchema } from '@/ai/flows/ramadan-content-flow';
import { z } from 'genkit';

// We infer the input type from the flow's schema to ensure type safety
type RamadanContext = z.infer<typeof RamadanContextSchema>;

export async function generateRamadanTipAction(context: RamadanContext) {
    try {
        // In Genkit 0.9+, defined flows are directly callable
        const tip = await ramadanContentFlow(context);
        return { success: true, tip };
    } catch (error) {
        console.error("Failed to generate Ramadan tip:", error);
        return { success: false, error: 'Failed to generate tip' };
    }
}
