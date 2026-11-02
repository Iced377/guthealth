# GOV-080 Evidence Register

| Field | Value |
| --- | --- |
| Identifier | GOV-080 |
| Title | Evidence Register |
| Owner | Founder, Product Owner and AIMS Implementation Lead |
| Version | 0.2 |
| Created | 2026-11-02 |
| Review date | Updated with each work session |
| Status | Draft |
| ISO references | ISO/IEC 42001:2023 clause 7.5 |
| Related evidence | Not applicable |

Each entry records what the evidence shows, where it is, and whether it is public. Private evidence is listed by identifier only.

| ID | Date | Description | Location | Supports | Public |
| --- | --- | --- | --- | --- | --- |
| EV-001 | 2026-06-20 | Production baseline: `main` at commit `de9a7ec98bf89b5ee4f28026218131d5e9dd0e6f` | Git | GOV-001, GOV-020 | Yes |
| EV-002 | 2026-11-02 | `WORKFLOW.md` as found on `main` | `WORKFLOW.md` at `de9a7ec` | GOV-001 F-04, F-06 | Yes |
| EV-003 | 2026-11-02 | Health check run on `main`: failed, 12 TypeScript errors. Run in cloud session, Node 22, after `npm ci --ignore-scripts`. | `governance/08-evidence-register/evidence/EV-003-health-check-main-de9a7ec-2026-11-02.txt` | GOV-001 F-06 | Yes |
| EV-004 | 2026-11-02 | Model configuration and history: `src/ai/genkit.ts`; commits `20b1752`, `ac936d2`, `f0722cf`, `d188e26` | Git | GOV-001 F-04, GOV-020 | Yes |
| EV-005 | 2026-11-02 | Fabricated FODMAP profile and fail-open verification code, with line references | `src/actions/food-analysis.ts`, `src/contexts/ActionContext.tsx`, `src/ai/flows/verify-food-analysis.ts` at `de9a7ec` | GOV-001 F-02, F-03 | Yes |
| EV-006 | 2026-11-02 | Privacy notice and terms as found | `src/app/privacy/page.tsx`, `src/app/terms/page.tsx` at `de9a7ec` | GOV-001 F-08 | Yes |
| EV-007 | 2026-11-02 | Repository visibility: GitHub API reports `"visibility": "public"` | GitHub API | governance/README.md | Yes |
| EV-008 | 2026-11-02 | Absence of tests and CI: no test files, no `.github` directory on `main` | Git at `de9a7ec` | GOV-001 F-05 | Yes |
| EV-009 | 2026-11-02 | Security finding details | SEC-001 (private) | GOV-001 F-01 | No |
| EV-010 | 2026-11-02 | GitHub issues list empty (no incident or defect tracking in GitHub) | GitHub | GOV-001 F-09 | Yes |
| EV-011 | 2026-11-02 | Live site check: `https://mygutcheck.app` served by Firebase App Hosting (`x-fah-adapter: nextjs-14.0.21`); bundled release notes report version 5.6.2. Read-only requests to public pages. | Private copy of headers and bundle extracts (PRIV-EV-011) | GOV-001 F-11 | Summary only |
| EV-012 | 2026-11-02 | Security investigation and fix test evidence | SEC-001 (private) | GOV-001 F-01 | No |

## Revision history

| Version | Date | Change | By |
| --- | --- | --- | --- |
| 0.1 | 2026-11-02 | Register created with baseline evidence. | Drafted by AI assistant (Claude Code). Not yet reviewed by the owner. |
| 0.2 | 2026-11-02 | Added EV-011 and EV-012. | Drafted by AI assistant (Claude Code). Not yet reviewed by the owner. |
