# GOV-081 Records and Evidence Procedure

| Field | Value |
| --- | --- |
| Identifier | GOV-081 |
| Title | Records and Evidence Procedure |
| Owner | Founder, Product Owner and AIMS Implementation Lead |
| Version | 0.1 |
| Created | 2026-11-06 |
| Review date | On owner review; then annually |
| Status | Draft |
| ISO references | ISO/IEC 42001:2023 clause 7.5 (to confirm against an authorised copy) |
| Related evidence | GOV-080; private repository `gutcheck-aims-private` |

## Purpose

GutCheck must be able to show what the AIMS requires, what was decided, what was done and whether it worked. This procedure says what to keep, where, and how to keep it trustworthy. It also serves the owner's PECB application, which needs the same records.

## What must be kept

The standard requires documented information for the items below. Each needs a record, not only a policy.

| Requirement | Record | Status |
| --- | --- | --- |
| 4.3 Scope | GOV-010 | Draft |
| 5.2 AI policy | Not yet written | None |
| 6.1.2 Risk assessment process and results | Methodology and register | None |
| 6.1.3 Risk treatment process, results, Statement of Applicability | Treatment plan and SoA | None |
| 6.1.4 AI system impact assessment process and results | Impact assessment | None |
| 6.2 AI objectives | Objectives with measures | None |
| 7.2 Competence | Evidence of the owner's competence (training, certificates, experience) | None |
| 8.1 Operational control | Records showing processes ran as planned: releases, tests, model changes | Partial (Git) |
| 9.1 Monitoring results | Metrics and reviews | None |
| 9.2 Internal audit programme and results | Audit records | None |
| 9.3 Management review results | Review minutes | None |
| 10.2 Nonconformity and corrective action | Incident and corrective action records | INC-001, SEC-001, SEC-002 open |

Records the AIMS decides it needs in addition: owner decisions, change approvals, test results, supplier records (Google, Firebase, Apple), user complaints about AI output.

## Where records go

| Kind | Location |
| --- | --- |
| Policies, procedures, non-sensitive plans and registers | `governance/` in this public repository |
| Security details, incidents, personal data assessments, raw evidence, PECB records | `gutcheck-aims-private` |
| Large raw files (tool histories, Git bundles, video) | Offline copy on the owner's computer and one cloud drive. Only the file list and SHA-256 fingerprints go in the private repository. |

Never store user data, identifiable health records or secrets in either repository. Use counts, dates, synthetic examples or redacted extracts.

## How to capture evidence

1. Prefer records kept by an outside system: App Store Connect, Google Play Console, Firebase App Hosting rollouts, Google Cloud usage, GitHub pull requests. These cannot be edited later by the owner.
2. Export where possible (CSV, JSON, PDF). If only a screenshot is possible, include the page URL, account and the date and time on screen.
3. Name files `PRIV-EV-nnn-short-description.ext` and record the capture date and source in a `CAPTURE.txt` beside them.
4. Record a SHA-256 fingerprint for every file in a `SHA256SUMS` file in the same folder.
5. Never edit a captured file. Corrections and comments go in a separate note that names the file.
6. Treat AI-written summaries (for example the Antigravity extract) as indexes, not evidence. Each claim must point to a primary record.

## Approval and authorship

1. Status values: Draft, Pending owner review, Approved, Superseded.
2. The owner approves a record by a commit or pull request under the owner's GitHub account, or by a dated note in the record's revision history written by the owner.
3. The AI assistant may draft and collect. It records what it did in the revision history. It does not mark anything Approved.
4. Records of the owner's own actions and time are confirmed by the owner before they count.

## Retention

The standard does not set a period. Proposed: keep AIMS records for at least three years after they are superseded, and PECB evidence until the credential is awarded and for the life of the credential. Owner decision required.

## External documents

Keep a list of external documents the AIMS relies on, with version or date: ISO/IEC 42001:2023, Google Gemini API terms, Firebase terms, Apple App Store guidelines, PECB certification requirements. Record the date each was last checked.

## Revision history

| Version | Date | Change | By |
| --- | --- | --- | --- |
| 0.1 | 2026-11-06 | First draft at the owner's request. | Drafted by AI assistant (Claude Code). Not yet reviewed by the owner. |
