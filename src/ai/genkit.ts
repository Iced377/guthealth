import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const rawModelId = process.env.GENKIT_GOOGLE_MODEL ?? 'gemini-1.5-flash-001';
const normalizedModelId = normalizeModelId(rawModelId);

export const DEFAULT_AI_MODEL = `googleai/${normalizedModelId}`;
const apiVersion = process.env.GENKIT_GOOGLE_API_VERSION ?? 'v1';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      apiVersion,
    }),
  ],
  model: DEFAULT_AI_MODEL,
});

function normalizeModelId(modelId: string): string {
  const trimmed = modelId.trim();
  const withoutProvider = trimmed.replace(/^googleai\//, '');
  if (withoutProvider.endsWith('-latest')) {
    return `${withoutProvider.slice(0, -'-latest'.length)}-001`;
  }
  return withoutProvider;
}
