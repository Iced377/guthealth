
# 🛡️ Safe Development Workflow

To ensure the stability of the Production environment (`main`), all developers must adhere to the following workflow.

## 1. Branch Strategy

*   **`main`**: The **STABLE**, PRODUCTION-READ code.
    *   ❌ **NEVER** push directly to `main`.
    *   ❌ **NEVER** commit "quick fixes" or tests to `main`.
*   **`develop`**: The integration branch for new features and non-hotfix work.
    *   ✅ All feature branches merge here first.
*   **`feature/*`**: Individual feature branches (e.g., `feature/ai-upgrade`, `feature/new-ui`).

## 2. Release Safety Protocol

Before ANY code merges to `main` or `develop`, you MUST run the Health Check:

```bash
./scripts/verify-health.sh
```

This script will checks type safety (`tsc`), formatting, and critical configuration.

## 3. Deployment Rules

1.  **AI Models**:
    *   Strictly use **`gemini-2.0-flash`** (v1 API) for Production.
    *   Do NOT change the model in `src/ai/genkit.ts` without explicit localized testing (using a separate test script, NOT by editing the source).

2.  **API Keys**:
    *   Keys are managed in **Firebase App Hosting**.
    *   Do not hardcode keys in `.env` or source code.

3.  **Hotfixes**:
    *   If production breaks, branch from `main` to `hotfix/vX.X.X`.
    *   Fix, Verify, merge to `main` AND `develop`.

---
*Created by Antigravity Safety Protocol*
