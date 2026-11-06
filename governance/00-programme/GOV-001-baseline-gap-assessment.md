# GOV-001 Baseline Gap Assessment

| Field | Value |
| --- | --- |
| Identifier | GOV-001 |
| Title | Baseline Gap Assessment |
| Owner | Founder, Product Owner and AIMS Implementation Lead |
| Version | 0.4 |
| Created | 2026-11-02 |
| Review date | On owner review; then at the end of Phase 1 |
| Status | Draft |
| ISO references | ISO/IEC 42001:2023 clauses 4 to 10; Annex A (control references to be confirmed against an authorised copy) |
| Related evidence | GOV-080, EV-001 to EV-010 |

## Basis and limits

Source reviewed: `main` at commit `de9a7ec` (20 June 2026), read on 2 November 2026. Method: reading code, configuration, Git history and the Firestore rules, and running the repository health check. No live system, production configuration, logs, Firebase console or Google account was inspected. Findings marked "unconfirmed" need that access.

The review was carried out by an AI assistant at the owner's request. It is not an independent assessment and has not yet been reviewed by the owner.

## Summary

GutCheck runs ten AI flows on Google Gemini (GOV-020). Several useful technical controls exist in the code: structured output schemas, low temperatures for food analysis, a second-pass verification step, logging of flagged results, data quality checks in the AI Coach, medical disclaimers, and owner-only Firestore rules with versioned consent for expert sharing.

There is no management system around these controls. There is no AI policy, risk assessment, impact assessment, change control for models or prompts, AI test set, incident procedure or supplier record.

Six technical problems need attention ahead of most documentation work, because they affect users now:

1. Server-side authorisation weaknesses (F-01).
2. Fabricated FODMAP values stored as if they were analysis results (F-02).
3. The verification step reports "verified" when it has not verified (F-03).
4. The mandatory health check fails on `main` and the build ignores type errors (F-06).
5. Model changes are not controlled and have caused at least three outages (F-04).
6. The privacy notice understates what the AI Coach sends to Google (F-08).

## Findings

**F-01 Server-side authorisation (security, privacy).** Server-side authorisation weaknesses were identified. Details, evidence and status are held privately in SEC-001 because this repository is public. Severity: high. Status: open.

**F-02 Fabricated FODMAP profiles.** When the AI returns no detailed FODMAP profile, the code generates numbers from a hash of the food name and stores them in `userFodmapProfile`. This happens in `src/actions/food-analysis.ts` (lines 184, 411), `src/contexts/ActionContext.tsx` (lines 792, 951, 1080, 1119, 1309, 1363), `src/app/favorites/page.tsx` and `src/components/food-logging/FoodItemCard.tsx`. When a user marks such an item as safe, the made-up profile is saved with the safe food and later sent to AI-03 and AI-05 as if it were real. Nothing marks these values as placeholders.

**F-03 Verification fails open.** In `src/ai/flows/verify-food-analysis.ts` the critic returns `verified: true` when the model call fails (line 183) or returns nothing (line 115). In `src/actions/food-analysis.ts` (lines 161, 391) a re-analysis after a failed check is stored as `verified: true` with the flag "Auto-corrected via Reflexion" without being checked again. Stored verification results therefore overstate assurance. The critic also uses the same model it is checking.

**F-04 Model and prompt change control.** `WORKFLOW.md` requires `gemini-2.0-flash`. The code uses `gemini-2.5-flash` since commit `20b1752` (10 June 2026); `WORKFLOW.md` was not updated. The model can also be changed by environment variable without a code change. The alias is not pinned to a model version. Prompts are inline and unversioned, and neither model nor prompt version is stored with results. Git history and release notes show model availability failures in December 2025, January 2026 and June 2026; none was recorded as an incident.

**F-05 No AI testing or evaluation.** The repository has no automated tests and no CI workflow. There is no reference set of foods with expected FODMAP ratings or nutrient ranges, so accuracy after a model or prompt change cannot be measured. Root scripts (`test-parser.js`, `verify-data.ts`, `debug_repro.ts`) are ad hoc.

**F-06 Release gate not working.** `WORKFLOW.md` requires `scripts/verify-health.sh` before any merge to `main` or `develop`. On 2 November 2026 it failed on `main` with 12 TypeScript errors in 6 files (EV-003). `next.config.ts` sets `ignoreBuildErrors` and `ignoreDuringBuilds`, so the build does not enforce the check. The health check's forbidden-model list still refers to 2.0-flash as the approved model.

**F-07 AI Coach safety.** The user's question is inserted unescaped into the prompt (`{{{userQuestion}}}`, line 214) alongside up to 90 days of health data, with no separation between instructions and user text. Safety relies on a prompt instruction ("NO MEDICAL ADVICE"), while the same prompt directs specific health advice, for example electrolyte supplementation for symptoms it labels "Keto Flu" and warnings about "metabolic slowdown and cortisol". No check is applied to the response before display. Raw error messages are shown to users. A disclaimer is shown under Coach responses (`CoachView.tsx` line 320).

**F-08 Privacy notice and consent.** The privacy notice says AI features send "meal descriptions, context" to Google and that consent is given "when you enable specific features (such as AI analysis)". The Coach sends food logs, symptom logs with severity, weight, goals and display name. No AI-specific consent step was found in the code. Symptom data is health data. Applicable law depends on where users are; this is unconfirmed. The notice also disclaims responsibility for Google's handling of data, which does not remove the operator's obligations as controller.

**F-09 Monitoring exists but is not reviewed.** Flagged results go to `admin_events` and `ai_telemetry_events`; timings go to `ai_performance_metrics`. There is no defined review, threshold or owner, and no record that these have been reviewed. User feedback is triaged by AI-07 but there is no complaint or incident procedure.

**F-10 Supplier oversight.** No record of the Gemini API terms in force, account tier, data retention or training use, regional processing, or a fallback if the model is withdrawn. The privacy notice links to Google's general terms.

**F-11 Deployment path confirmed.** Firebase console screenshots (6 November 2026): project `fodmapsafe`, App Hosting backend `studio` in `us-central1`, serving `mygutcheck.app`, connected to `Iced377/guthealth`, live branch `main`, automatic rollouts enabled with no path filters. The live rollout is `de9a7ec` (20 June 2026); 112 rollouts are recorded. Any merge to `main` therefore deploys to production at once. Combined with F-06, nothing currently stops a commit that fails the health check from reaching production. The iOS and Android apps load the same site. The GitHub default branch is `V1`, not `main`.

**F-12 Repository hygiene.** The public repository contains files unrelated to the product or left from debugging: `organize_pc.py`, `tunnel.log` (a tunnel URL), `test_write.txt`, `debug_git.sh`, `debug_repro.*`, `process_video_v4.js`, `ramadan-seed.csv`. No secrets were found by a pattern search of the current tree; Git history was not searched.

## Inconsistencies between documented policy and code

1. `WORKFLOW.md` model rule (`gemini-2.0-flash`) versus code (`gemini-2.5-flash`).
2. `WORKFLOW.md` says the health check must pass before merging; it fails on `main`.
3. `WORKFLOW.md` says model changes need separate localised testing; no test record exists for commit `20b1752`.
4. Privacy notice data description versus AI-06 inputs (F-08).
5. Privacy notice consent claim versus absence of an AI consent step (F-08).

## Status by AIMS area

Status uses: none, planned, documented, implemented, verified, effective. "Implemented" means present in code or practice; none is yet verified by test or review.

| Area | Current state | Status | Main gap |
| --- | --- | --- | --- |
| Context and interested parties (4.1, 4.2) | Not documented | none | Users, experts, Google, app stores, regulators not identified |
| AIMS scope (4.3) | Draft GOV-010 | documented (draft) | Owner approval |
| Leadership and accountability (5.1, 5.3) | One person performs all roles; not recorded | none | Roles and limits of single-person operation |
| AI policy (5.2, A.2) | None | none | Short policy needed |
| AI system inventory (A.4, A.6.2.7) | Draft GOV-020 | documented (draft) | Production config unconfirmed |
| Risk assessment and treatment (6.1.2, 6.1.3, 8.2, 8.3) | None | none | GutCheck-specific risks and SoA |
| Impact assessment (6.1.4, 8.4, A.5) | None | none | Effect on users of wrong FODMAP or Coach output |
| Objectives (6.2) | None | none | Measurable objectives |
| Data governance and privacy (A.7) | Firestore owner rules; expert consent with versioned text and audit events | implemented in part | F-01, F-02, F-08 |
| Lifecycle and change control (6.3, A.6) | `WORKFLOW.md` exists; not followed | documented, not operating | F-04, F-06 |
| External providers (A.10) | None | none | F-10 |
| Human oversight and user information (A.8, A.9) | Terms and Coach disclaimers; users can edit entries and mark safe or unsafe | implemented in part | Uncertainty not shown on food analysis; F-07 |
| Operational controls (8.1) | Output schemas, low temperature, critic, data quality flags | implemented in part | F-02, F-03, F-07 |
| Testing and evaluation (9.1, A.6.2.4) | None | none | F-05 |
| Incident management (A.8.4, 10.2) | Hallucination logging only | implemented in part | No procedure or record |
| Internal audit and management review (9.2, 9.3) | None | none | Proportionate process; independence limits |
| Corrective action and improvement (10.1, 10.2) | None | none | Register |
| Document control and evidence (7.5) | Git only | none | GOV README drafted; private store needed |

## Proposed first five priorities

1. **Close the authorisation gaps (F-01).** Tracked privately in SEC-001. Needs owner approval and a release.
2. **Stop storing fabricated or overstated results (F-02, F-03).** Store no profile, or an explicit "unavailable" state, when the AI returns none. Record re-analysed results as unverified unless re-checked. Make the critic fail closed in the stored record. Decide how to treat existing records.
3. **Restore the release gate (F-06).** Fix the 12 type errors, remove the build error suppression once clean, and run the health check in a GitHub Actions workflow on pull requests to `develop` and `main`.
4. **Control model and prompt changes (F-04, F-05).** Record model identifier and prompt version with each AI result; update `WORKFLOW.md`; build a small synthetic evaluation set for AI-01 to AI-03 and run it before any model or prompt change.
5. **Align disclosure and consent with actual AI data flows (F-08).** Update the privacy notice, decide whether an explicit AI consent step is needed for the Coach, and confirm the Gemini account terms (F-10). Applicable law needs the owner's input.

The AI Coach safety work (F-07) and the risk assessment follow in Phase 2. F-11 should be confirmed before any release from this work.

## Owner decisions

Recorded from the owner's instructions in the working session of 2 November 2026.

| ID | Decision | Status |
| --- | --- | --- |
| D-01 | Private records go in a private GitHub repository named `gutcheck-aims-private`. Public documents reference them by identifier only. | Decided. Repository not yet created. |
| D-02 | Work continues on `feature/iso42001-aims`. The old session branch is left as it is: no force push, no deletion. | Decided |
| D-03 | GOV-010 approved in principle. Formal status stays Pending owner review until production architecture, data flows and jurisdictions are confirmed. | Decided |
| D-04 | Authorisation fixes for F-01 may be investigated and prepared. No production deployment without owner approval of the changes and test results. | Decided |
| D-05 | Owner roles: Founder, Product Owner and AIMS Implementation Lead. PECB Lead Implementer status is not to be stated until awarded. | Decided |

## Revision history

| Version | Date | Change | By |
| --- | --- | --- | --- |
| 0.1 | 2026-11-02 | First draft from source review of `main` at `de9a7ec`. | Drafted by AI assistant (Claude Code). Not yet reviewed by the owner. |
| 0.2 | 2026-11-02 | F-01 detail moved to private SEC-001. F-11 updated with live site checks. Owner decisions D-01 to D-05 recorded. | Drafted by AI assistant (Claude Code). Decisions given by the owner; document not yet reviewed by the owner. |
| 0.3 | 2026-11-06 | F-11 updated: live backend and commit confirmed from the Firebase console. | Drafted by AI assistant (Claude Code). Not yet reviewed by the owner. |
| 0.4 | 2026-11-06 | F-11 confirmed: automatic rollouts from `main`. | Drafted by AI assistant (Claude Code). Not yet reviewed by the owner. |
