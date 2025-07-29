#!/bin/bash

# Script to check for hardcoded strings and translation issues in the Tennis Score app

echo "=== Checking for hardcoded strings and translation issues ==="
echo ""

# Create a temporary file to store results
RESULTS_FILE="hardcoded-strings-report.txt"
> "$RESULTS_FILE"

echo "1. Checking for potential hardcoded strings in JSX..." | tee -a "$RESULTS_FILE"
echo "=================================================" | tee -a "$RESULTS_FILE"

# Find strings between JSX tags (potential hardcoded text)
echo "### Text between JSX tags:" | tee -a "$RESULTS_FILE"
grep -r ">[[:space:]]*[A-Za-z][^<]*<" \
  --include="*.tsx" \
  --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  src/app src/components 2>/dev/null | \
  grep -v "className\|key\|id\|data-\|aria-\|href\|src\|alt=\"\"\|{t(" | \
  head -20 | tee -a "$RESULTS_FILE"

echo "" | tee -a "$RESULTS_FILE"
echo "### String literals in props (excluding common React props):" | tee -a "$RESULTS_FILE"
grep -r '="[^"]*[A-Za-z][^"]*"' \
  --include="*.tsx" \
  --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  src/app src/components 2>/dev/null | \
  grep -v "className\|key\|id\|data-\|aria-\|href\|src\|type\|name\|value\|variant\|size\|asChild" | \
  grep -v "t(\|getTranslations\|useTranslations" | \
  head -20 | tee -a "$RESULTS_FILE"

echo "" | tee -a "$RESULTS_FILE"
echo "2. Checking for translation keys showing as text..." | tee -a "$RESULTS_FILE"
echo "=================================================" | tee -a "$RESULTS_FILE"

# Look for patterns like "namespace.key" that might be showing as text
grep -r '[">][a-zA-Z]+\.[a-zA-Z]+[<"]' \
  --include="*.tsx" \
  --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  src/app src/components 2>/dev/null | \
  grep -v "Math\.\|Array\.\|Object\.\|console\.\|window\.\|document\." | \
  head -10 | tee -a "$RESULTS_FILE"

echo "" | tee -a "$RESULTS_FILE"
echo "3. Checking for hardcoded 'en' locale references..." | tee -a "$RESULTS_FILE"
echo "=================================================" | tee -a "$RESULTS_FILE"

grep -r "'en'\|\"en\"" \
  --include="*.tsx" \
  --include="*.jsx" \
  --include="*.ts" \
  --include="*.js" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  src/ 2>/dev/null | \
  grep -v "defaultLocale\|locales\|i18n\|config" | \
  head -10 | tee -a "$RESULTS_FILE"

echo "" | tee -a "$RESULTS_FILE"
echo "4. Checking for common UI text patterns..." | tee -a "$RESULTS_FILE"
echo "=================================================" | tee -a "$RESULTS_FILE"

# Common patterns like Submit, Cancel, Save, Loading, Error, etc.
grep -r -E "(Submit|Cancel|Save|Loading|Error|Success|Delete|Edit|Create|Update|Close|Open|Select|Choose|Upload|Download|Search|Filter|Sort|Reset)" \
  --include="*.tsx" \
  --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  src/app src/components 2>/dev/null | \
  grep -v "t(\|getTranslations\|useTranslations\|className\|variant\|data-\|console" | \
  head -20 | tee -a "$RESULTS_FILE"

echo "" | tee -a "$RESULTS_FILE"
echo "5. Checking for placeholder and title attributes..." | tee -a "$RESULTS_FILE"
echo "=================================================" | tee -a "$RESULTS_FILE"

grep -r -E "(placeholder|title|alt|aria-label)=\"[^\"]*[A-Za-z][^\"]*\"" \
  --include="*.tsx" \
  --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  src/app src/components 2>/dev/null | \
  grep -v "t(\|{t(" | \
  head -15 | tee -a "$RESULTS_FILE"

echo "" | tee -a "$RESULTS_FILE"
echo "6. Checking for button and link text..." | tee -a "$RESULTS_FILE"
echo "=================================================" | tee -a "$RESULTS_FILE"

grep -r -E "<(Button|Link|a)[^>]*>[^<]*[A-Za-z][^<]*</(Button|Link|a)>" \
  --include="*.tsx" \
  --include="*.jsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  src/app src/components 2>/dev/null | \
  grep -v "{t(" | \
  head -10 | tee -a "$RESULTS_FILE"

echo "" | tee -a "$RESULTS_FILE"
echo "=== Summary saved to: $RESULTS_FILE ===" | tee -a "$RESULTS_FILE"
echo ""
echo "Key areas to check manually:"
echo "1. Dashboard page components"
echo "2. Statistics page and sub-components"
echo "3. Admin page"
echo "4. Match and Player pages"
echo "5. Auth pages (login/signup)"
echo "6. Error messages and toasts"