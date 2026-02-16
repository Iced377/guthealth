// src/ai/flows/ramadan-content-flow.ts
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// --- SCHEMAS ---

export const RamadanContextSchema = z.object({
    userProfile: z.object({
        name: z.string().optional(),
        dietaryRestrictions: z.array(z.string()).optional(),
        healthGoals: z.array(z.string()).optional(),
        fastingPreference: z.boolean().optional(), // Did they opt-in to fasting advice?
        tdee: z.number().optional(), // Only use if present
    }).optional(),

    timeContext: z.object({
        localTime: z.string(), // e.g., "18:45"
        phase: z.enum(['PRE_SUHOOR', 'SUHOOR', 'FASTING_MORNING', 'FASTING_AFTERNOON', 'PRE_IFTAR', 'IFTAR', 'POST_IFTAR', 'NIGHT']),
        hoursFasted: z.number().optional(),
    }),

    history: z.object({
        lastCategory: z.string().optional(),
        recentlySeenTopics: z.array(z.string()), // topicIds to avoid
    })
});

export const RamadanTipSchema = z.object({
    topicId: z.string().describe("Unique Kebab-case ID for this specific advice topic, e.g., 'hydration-electrolytes-iftar'"),
    title: z.string().describe("Catchy, short title (max 5 words)"),
    content: z.string().describe("Scientific, empathetic, and actionable advice (max 2 sentences)"),
    category: z.enum(['Well-being', 'Mental Resilience', 'Community', 'Nutrition', 'Hydration']),
    actionItem: z.string().describe("A specific, tiny habit the user can do TONIGHT or TOMORROW."),
    source: z.enum(['ai', 'seed']).optional(),
});

// --- PROMPT DEFINITION ---

const SYSTEM_PROMPT_TEXT = `
You are a wise, scientifically-grounded Ramadan Wellness Guide.
Your goal is to provide a single, high-impact, bite-sized tip to help the user optimize their Ramadan experience.

**TONE:** Warm, Empathetic, Scientific, concise. "Award-winning UX" quality copy.

**INFUSE NOVELTY:**
1. Check \`recentlySeenTopics\`.
2. Do **NOT** generate advice that overlaps with those topics.
3. If the user has recently seen "hydration", switch to "sleep" or "mindset".
4. If \`lastCategory\` is provided, choose a **different category** for variety.

**CRITICAL GUARDRAILS:**
1. **NO MEDICAL ADVICE:** Do not prescribe dosages or treatments. If unsure, suggest consulting a doctor.
2. **NO RELIGIOUS RULINGS (FATWAS):** Focus purely on wellness, mindset, and community. Do not declare things Halal/Haram.
3. **NO CALORIE TARGETS:** Unless \`userProfile.tdee\` is explicitly provided, DO NOT mention specific calorie numbers.
4. **NO FASTING DIRECTIVES:** Do not tell the user to fast unless \`fastingPreference\` is true. Assume they are navigating the month generally.

**CONTEXTUAL LOGIC:**
- **SUHOOR:** Focus on slow-release energy (GI), hydration, and intention setting.
- **FASTING:** Focus on patience, mental resilience, and productivity.
- **IFTAR:** Focus on gentle breaking of fast, preventing sugar crashes, and gratitude.
- **NIGHT:** Focus on sleep quality, hydration, and digestion.

**INPUT DATA:**
{{userProfile}}
{{timeContext}}
{{history}}
`;

const ramadanTipPrompt = ai.definePrompt({
    name: 'ramadanTipPrompt',
    input: { schema: RamadanContextSchema },
    output: { schema: RamadanTipSchema },
    config: {
        temperature: 0.7,
    },
    prompt: SYSTEM_PROMPT_TEXT,
});

const violatesSafety = (tip: z.infer<typeof RamadanTipSchema>, context: z.infer<typeof RamadanContextSchema>): boolean => {
    const content = `${tip.title} ${tip.content} ${tip.actionItem || ''}`.toLowerCase();

    // Block explicit medical prescriptions or dosages
    const medicalKeywords = ['mg', 'dosage', 'prescribe', 'prescription', 'treatment'];
    if (medicalKeywords.some((keyword) => content.includes(keyword))) {
        return true;
    }

    // Block religious rulings language
    const rulingKeywords = ['fatwa', 'haram', 'halal'];
    if (rulingKeywords.some((keyword) => content.includes(keyword))) {
        return true;
    }

    // Block calorie numbers when tdee is not provided
    if (!context.userProfile?.tdee && /\b\d+\s*(kcal|calories)\b/i.test(content)) {
        return true;
    }

    // Block fasting directives if user opted out explicitly
    if (context.userProfile?.fastingPreference === false && /\bfast\b|\bfasting\b/i.test(content)) {
        return true;
    }

    return false;
};

// --- FLOW DEFINITION ---

export const ramadanContentFlow = ai.defineFlow(
    {
        name: 'ramadanContentFlow',
        inputSchema: RamadanContextSchema,
        outputSchema: RamadanTipSchema,
    },
    async (input) => {
        const { output } = await ramadanTipPrompt(input);

        if (!output) {
            throw new Error("Failed to generate Ramadan tip");
        }

        if (violatesSafety(output, input)) {
            throw new Error("Generated Ramadan tip failed safety validation");
        }

        return output;
    }
);
