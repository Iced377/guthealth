#!/bin/bash

echo "🛡️  Running Safety Health Check..."

# 1. Type Check
echo "👉 Checking Types..."
npm run typecheck
if [ $? -ne 0 ]; then
    echo "❌ TYPE CHECK FAILED. Do not push."
    exit 1
fi

# 2. Check for Forbidden Strings (Safety Net)
echo "👉 Scanning for Forbidden AI Models..."
if grep -r "gemini-1.5-pro" src/ai; then
    echo "❌ FOUND FORBIDDEN MODEL: gemini-1.5-pro. Revert to 2.0-flash immediately."
    exit 1
fi

if grep -r "gemini-1.5-flash-latest" src/ai; then
    echo "❌ FOUND FORBIDDEN MODEL: gemini-1.5-flash-latest (deprecated). Use stable versions."
    exit 1
fi

echo "✅ All Safety Checks Passed. Safe to Commit/Push."
exit 0
