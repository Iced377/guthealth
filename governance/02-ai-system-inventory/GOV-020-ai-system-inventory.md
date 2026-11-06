# GOV-020 AI System Inventory

| Field | Value |
| --- | --- |
| Identifier | GOV-020 |
| Title | AI System Inventory |
| Owner | Founder, Product Owner and AIMS Implementation Lead |
| Version | 0.2 |
| Created | 2026-11-02 |
| Review date | On owner review, then on any model, prompt or flow change |
| Status | Draft |
| ISO references | ISO/IEC 42001:2023 clause 4.3; Annex A.4.2, A.6.2.7, A.7.2, A.10.3 (to be confirmed against an authorised copy) |
| Related evidence | EV-001 to EV-006 (GOV-080) |

## Basis

Prepared from source code on `main` at commit `de9a7ec` (20 June 2026). Nothing here was tested against the live service. Production configuration in Firebase App Hosting was not inspected; the model actually used in production is therefore unconfirmed.

## Platform

GutCheck is a Next.js 15 application (version 5.6.2 in `package.json`) packaged for iOS and Android with Capacitor. It uses Firebase Authentication, Firestore and Firebase App Hosting. All AI calls go through Google Genkit to the Google Gemini API.

## Model and provider

| Item | Value | Source |
| --- | --- | --- |
| Provider | Google, Gemini API (`generativelanguage.googleapis.com`, API version v1) | `src/ai/genkit.ts` |
| Default model | `gemini-2.5-flash` | `src/ai/genkit.ts` |
| Override | Environment variables `GENKIT_GOOGLE_MODEL`, `GOOGLE_GENAI_MODEL` or `GEMINI_MODEL` replace the default without a code change | `src/ai/genkit.ts` |
| API key | `GOOGLE_GENAI_API_KEY`, held in App Hosting (per `WORKFLOW.md`) | `src/ai/genkit.ts` |
| Model version pinning | None. `gemini-2.5-flash` is a provider alias. | `src/ai/genkit.ts` |
| Prompt storage | Inline in each flow file. No version identifier is stored with results. | `src/ai/flows/` |

All flows use the same model. The verification step ("critic") therefore checks the model with the same model.

## AI functions

| ID | Function | Flow file | Called from | Data sent to the provider | Output used for | Temp. |
| --- | --- | --- | --- | --- | --- | --- |
| AI-01 | Food identification from photo | `identify-food-from-image-flow.ts` | Photo logging (`ActionContext.tsx`, `IdentifyFoodByPhotoDialog.tsx`, `actions/food-analysis.ts`) | Meal photo, optional user text | Food name, ingredients, portion | 0.2 |
| AI-02 | Meal description parsing | `process-meal-description-flow.ts` | Text logging, favourites | Free text meal description | Meal name, ingredients, portion | 0 |
| AI-03 | FODMAP, nutrition and health tag analysis | `fodmap-detection.ts` | All food logging paths, favourites | Food name, ingredients, portion, user safe foods | FODMAP risk (Green, Yellow, Red), FODMAP profile, calories and macros, glycaemic index, fibre, gut bacteria impact, keto score | 0 |
| AI-04 | Analysis verification (critic) | `verify-food-analysis.ts` | After AI-03; admin debug dialog | Output of AI-03 | Verified flag and flags; triggers one re-analysis if not verified | 0.1 |
| AI-05 | Safe food similarity | `food-similarity.ts` | Food logging, favourites | Food item and user safe foods with FODMAP profiles | Similarity flag and reason | default |
| AI-06 | AI Coach ("personal dietitian") | `personalized-dietitian-flow.ts` | Insights, Coach (`CoachView.tsx`, `CoachComponents.tsx`) | User question; food log; symptom log with severity; profile (display name, weight, goal, activity, TDEE, macro targets, dietary preferences); fasting data; trend analysis | Free text guidance shown to the user | default |
| AI-07 | Feedback triage | `process-feedback-flow.ts` | `FeedbackWidget.tsx`, which is not used anywhere in the app (removed from navigation; the live feedback page has no AI) | Feedback text submitted by the user | Summary and category for the owner | default |
| AI-08 | Symptom correlation | `symptom-correlation-flow.ts` | No caller found on `main` (type import only) | Food log, symptom log including free text notes, safe foods | Trigger and safe food insights with confidence | default |
| AI-09 | Daily insights | `daily-insights.ts` | No caller found on `main` | Not reviewed | Not reviewed | default |
| AI-10 | User recommendations | `user-recommendations.ts` | No caller found on `main` (type import only) | Not reviewed | Not reviewed | default |

"default" means no temperature is set in the flow, so the provider default applies.

AI-07 to AI-10 appear inactive. They are still registered in `src/ai/dev.ts`. Whether they can be invoked in production needs confirmation (see GOV-001).

## Data categories processed by AI

Meal photos and descriptions; food logs; symptom logs, severity and notes (health information relating to digestive conditions such as IBS); body weight, activity and energy targets; dietary preferences that may reveal religion or health status (for example fasting, vegan); display name. Step and weight data from Apple Health and Fitbit feed the Coach through trend analysis.

The privacy notice (`src/app/privacy/page.tsx`) says AI features send "meal descriptions, context" to Google. AI-06 sends substantially more, including symptom history and weight. See GOV-001, finding F-08.

## Records created by AI

AI results are written to `users/{uid}/timelineEntries/{entryId}` with the Firebase Admin SDK. Verification failures are written to `admin_events` and `ai_telemetry_events`. Timing metrics go to `ai_performance_metrics`. The model identifier and prompt version are not recorded with any result.

## Open points

1. Confirm the model and environment variables set in App Hosting for production.
2. Confirm whether AI-07 to AI-10 can be invoked in production, and retire them if unused.
3. Confirm Gemini API terms applicable to the account (paid or free tier), as these determine whether Google may use submitted data.

## Revision history

| Version | Date | Change | By |
| --- | --- | --- | --- |
| 0.1 | 2026-11-02 | First draft from source review of `main` at `de9a7ec`. | Drafted by AI assistant (Claude Code). Not yet reviewed by the owner. |
| 0.2 | 2026-11-07 | AI-07 corrected: its only caller is unused; the live feedback page has no AI. | Drafted by AI assistant (Claude Code). Not yet reviewed by the owner. |
