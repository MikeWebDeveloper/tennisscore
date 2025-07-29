#!/bin/bash

echo "=== Searching for Specific Translation Issues ==="
echo ""

# Check for translation keys displayed as text
echo "1. Checking for translation keys shown as text (pattern: namespace.key):"
grep -n ">[a-zA-Z]\+\.[a-zA-Z]\+<" src/app/\(app\)/statistics/_components/*.tsx 2>/dev/null || echo "None found in statistics components"
grep -n ">[a-zA-Z]\+\.[a-zA-Z]\+<" src/app/\(app\)/matches/*.tsx 2>/dev/null || echo "None found in matches components"
echo ""

# Check for common UI text
echo "2. Checking for hardcoded UI text:"
grep -nE ">(Loading|Save|Cancel|Delete|Edit|Submit|Search|Filter|Back|Next|Close)" src/app/\(app\)/statistics/_components/*.tsx 2>/dev/null || echo "None found"
echo ""

# Check for placeholders
echo "3. Checking for hardcoded placeholders:"
grep -n 'placeholder="[^{]' src/app/\(app\)/statistics/_components/*.tsx src/app/\(app\)/matches/*.tsx 2>/dev/null || echo "None found"
echo ""

# Check for aria-labels
echo "4. Checking for hardcoded aria-labels:"
grep -n 'aria-label="[^{]' src/app/\(app\)/statistics/_components/*.tsx src/app/\(app\)/matches/*.tsx 2>/dev/null || echo "None found"
echo ""

# Check for specific patterns in modified files
echo "5. Checking statistics-filters.tsx for untranslated strings:"
grep -n -E ">statistics\.|>player\.|>match\.|>common\." src/app/\(app\)/statistics/_components/statistics-filters.tsx 2>/dev/null || echo "No translation keys displayed as text"
echo ""

echo "6. Checking performance-trends.tsx for untranslated strings:"
grep -n -E ">statistics\.|>player\.|>match\.|>common\." src/app/\(app\)/statistics/_components/performance-trends.tsx 2>/dev/null || echo "No translation keys displayed as text"
echo ""

echo "7. Checking match-patterns.tsx for untranslated strings:"
grep -n -E ">statistics\.|>player\.|>match\.|>common\." src/app/\(app\)/statistics/_components/match-patterns.tsx 2>/dev/null || echo "No translation keys displayed as text"