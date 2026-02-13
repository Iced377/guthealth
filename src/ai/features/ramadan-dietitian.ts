import { z } from 'genkit';

export const RamadanInjectionContextSchema = z.object({
  mode: z.enum(['fasting', 'witnessing']),
  suhoorTime: z.string(),
  iftarTime: z.string(),
  nextEvent: z.string(),
  countdown: z.string(),
  theme: z.enum(['daylight', 'midnight', 'standard']),
});

export type RamadanInjectionContext = z.infer<typeof RamadanInjectionContextSchema>;

export const buildRamadanContext = (input: RamadanInjectionContext | null | undefined) => {
  if (!input) return undefined;
  return input;
};
