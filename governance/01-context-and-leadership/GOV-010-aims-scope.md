# GOV-010 AIMS Scope

| Field | Value |
| --- | --- |
| Identifier | GOV-010 |
| Title | AIMS Scope |
| Owner | Product owner |
| Version | 0.1 |
| Created | 2026-11-02 |
| Review date | On owner review; then annually or when AI functions change |
| Status | Draft |
| ISO references | ISO/IEC 42001:2023 clause 4.3 (with 4.1 and 4.2) |
| Related evidence | GOV-001, GOV-020 |

## Organisation

GutCheck is a health and nutrition application for web, iOS and Android. It helps users log meals, assess foods for FODMAP content, track symptoms, and receive AI-generated guidance. It is operated by one person, the product owner, who builds, releases and supports it. Experts can be linked to users through the Expert Hub with the user's consent.

## Role in relation to AI

GutCheck is an AI provider to its users: it offers AI-based features in its own product. It is also a customer of an AI provider: it uses Google's Gemini models through the Gemini API. GutCheck does not train or fine-tune models.

## In scope

1. The AI functions listed in GOV-020 (AI-01 to AI-10), including prompts, model configuration and the code that prepares inputs and stores or displays outputs.
2. User data processed by those functions: meal photos and descriptions, food and symptom logs, profile and goal data, and activity and weight data used by the AI Coach.
3. The processes that support them: development and release, model and prompt change, testing, monitoring, user feedback and incident handling, and management of Google as AI supplier.
4. The production environment on Firebase (App Hosting, Authentication, Firestore) as far as it affects the AI functions.

## Out of scope

1. Features with no AI component, such as advertising, subscriptions, Ramadan cards and push notifications. They remain subject to normal product and privacy controls.
2. Development of the Gemini models themselves. Google is managed as a supplier.
3. Advice given by human experts through the Expert Hub. Expert access to AI outputs is in scope.

## Internal and external issues affecting scope

1. Users may act on AI output about foods and symptoms related to digestive conditions. Wrong output may cause discomfort or poor dietary decisions.
2. The product depends on a single AI supplier and model. Model withdrawals have caused outages.
3. One person carries all roles. There is no internal separation of duties or independent review.
4. The source repository is public.
5. Applicable data protection and health product law depends on user locations and app store regions. Not yet confirmed.

## Interested parties (initial)

Users; users' linked experts; Google (AI and cloud supplier); Apple and Google app stores; data protection authorities in user jurisdictions; the owner. Their requirements will be recorded in a separate context document.

## Limitations

The AIMS is sized for a single-operator product. Committees, departments and separate approval roles do not exist and are not assumed. Where a control would normally rely on separation of duties, the limitation will be recorded and, where valuable, external review recommended.

## Approval

Not approved. Owner decisions required: D-03 in GOV-001, confirmation of the organisation description, and the jurisdictions to list.

## Revision history

| Version | Date | Change | By |
| --- | --- | --- | --- |
| 0.1 | 2026-11-02 | First draft. | Drafted by AI assistant (Claude Code). Not yet reviewed by the owner. |
