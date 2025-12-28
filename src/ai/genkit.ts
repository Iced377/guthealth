import { genkit } from 'genkit';
import { googleAI, gemini15Flash, gemini15Pro } from '@genkit-ai/googleai';

const rawModelId =
  process.env.GENKIT_GOOGLE_MODEL ||
  process.env.GOOGLE_GENAI_MODEL ||
  process.env.GEMINI_MODEL ||
  'gemini-2.5-flash';

const normalizedModelId = normalizeModelId(rawModelId);

// Force all known env overrides to point at the normalized, stable model ID so
// downstream libraries never try to call the deprecated "-latest" alias.
process.env.GENKIT_GOOGLE_MODEL = normalizedModelId;
process.env.GOOGLE_GENAI_MODEL = normalizedModelId;
process.env.GEMINI_MODEL = normalizedModelId;
process.env.GENKIT_DEFAULT_MODEL = `googleai/${normalizedModelId}`;

export const DEFAULT_AI_MODEL = `googleai/${normalizedModelId}`;

// Default to the stable v1 API; some client libraries still fall back to v1beta
// when no version is supplied, which triggers 404s for "-latest" models.
const apiVersion: 'v1' | 'v1beta' = 'v1';
const baseUrl = 'https://generativelanguage.googleapis.com';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      apiVersion,
      baseUrl,
    }),
  ],
  model: DEFAULT_AI_MODEL,
});

// Normalize legacy model identifiers (e.g., with provider prefixes or "-latest"
// suffixes) to the stable, GA model names.
function normalizeModelId(modelId: string): string {
  const trimmed = modelId.trim();
  const withoutProvider = trimmed.replace(/^googleai\//, '').replace(/^models\//, '');
  const withoutLatest = withoutProvider.endsWith('-latest')
    ? `${withoutProvider.slice(0, -'-latest'.length)}-001`
    : withoutProvider;
  return withoutLatest;
}
