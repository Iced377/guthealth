#!/bin/bash
# Flags prohibited characters and phrases in governance documents.
# Usage: governance/tools/check-writing.sh [files...]
# Default: all Markdown files under governance/.
# Code spans and fenced blocks are not excluded; review hits by hand before changing
# technical identifiers, file paths or quotations.

set -u
export LC_ALL=C.UTF-8
cd "$(dirname "$0")/../.." || exit 2

if [ "$#" -gt 0 ]; then
  files=("$@")
else
  mapfile -t files < <(find governance -name '*.md' -type f | sort)
fi

status=0

# Em dash, en dash, tilde, arrows, check marks, crosses, emoji ranges, decorative symbols.
char_pattern='[—–~←→↑↓↔⇒⇐✓✔✗✘✅❌⚠★☆•►▶◆■□●]|[\x{1F300}-\x{1FAFF}]|[\x{2600}-\x{27BF}]'

grep -nP "$char_pattern" "${files[@]}"
rc=$?
if [ "$rc" -eq 0 ]; then
  echo "FAIL: prohibited characters found (see lines above)."
  status=1
elif [ "$rc" -gt 1 ]; then
  echo "ERROR: character check could not run."
  exit 2
fi

phrases=(
  "leverag" "harness the power" "cutting-edge" "cutting edge" "robust framework"
  "seamless" "holistic" "comprehensive ecosystem" "transformative" "unlock"
  "empower" "foster a culture" "navigate the complexities" "rapidly evolving"
  "forefront of innovation" "best-in-class" "game-changing" "revolutionary"
  "it is worth noting" "it is important to highlight" "underscores the importance"
  "testament to" "in conclusion" "best practice" "operational excellence"
)

for p in "${phrases[@]}"; do
  if grep -niF "$p" "${files[@]}"; then
    echo "FAIL: prohibited phrase \"$p\""
    status=1
  fi
done

if [ "$status" -eq 0 ]; then
  echo "PASS: no prohibited characters or phrases in ${#files[@]} file(s)."
fi
exit "$status"
