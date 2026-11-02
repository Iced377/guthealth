# GutCheck AI Management System (AIMS)

This directory holds the controlled documents for the GutCheck AIMS, aligned with ISO/IEC 42001:2023.

GutCheck is not ISO/IEC 42001 certified. These documents record an implementation in progress.

## Public repository restriction

This repository is public (confirmed 2 November 2026). Do not commit the following here:

1. Details of unresolved security weaknesses.
2. Personal professional records, including the PECB implementation log and experience chronology.
3. User data, identifiable health records, logs containing user identifiers, or secrets.
4. Supplier contracts or other confidential operating evidence.

These belong in a private location. Until the owner chooses one, they are held outside the repository and referenced here by identifier only. See GOV-001, decision D-01.

## Structure

| Folder | Content |
| --- | --- |
| 00-programme | Gap assessment, implementation plan, programme decisions |
| 01-context-and-leadership | Context, interested parties, scope, policy, roles |
| 02-ai-system-inventory | AI functions, models, providers, data flows |
| 03-risk-and-impact | Risk assessment, treatment plan, impact assessments, Statement of Applicability |
| 04-operational-controls | Procedures for change, testing, incidents, suppliers, data |
| 05-monitoring-and-evaluation | Metrics, evaluation records |
| 06-audits-and-reviews | Internal audit and management review records |
| 07-corrective-actions | Nonconformity and corrective action register |
| 08-evidence-register | Index of evidence for each requirement |
| 09-implementation-log | Pointer only. The personal log is private. |
| 10-pecb-application | Pointer only. Application records are private. |

Folders are created when they have content.

## Document control

Each formal document starts with a header that records: identifier, title, owner, version, created date, review date, status, ISO references, related evidence, and revision history.

Status values:

1. Draft. Prepared, not yet reviewed by the owner.
2. Pending owner review. Submitted to the owner.
3. Approved. The owner has approved it. The approval is recorded in the revision history with the date.
4. Superseded. Replaced by a newer version or document.

Documents drafted with AI assistance stay at Draft until the owner reviews them. AI assistance is recorded in the revision history.

Control status is recorded separately from document status, using: planned, documented, implemented, verified, effective. A written policy does not make a control implemented.

Git history is the change record. Approvals should be made in a commit or pull request by the owner, so the approval is attributable.

## Writing check

Run `governance/tools/check-writing.sh` before submitting a document for review. It flags prohibited characters and phrases. It does not judge content.
