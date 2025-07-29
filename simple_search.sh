#!/bin/bash

echo "=== Searching for potential untranslated strings ==="
echo ""

# Search for translation keys displayed as text
echo "1. Translation keys displayed as text (pattern: word.word):"
find src/app src/components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l ">[a-zA-Z]\+\.[a-zA-Z]" {} \; 2>/dev/null | head -20

echo ""
echo "2. Common hardcoded text patterns:"
find src/app src/components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l ">Save<\|>Submit<\|>Cancel<\|>Delete<\|>Edit<\|>Add<\|>Remove<\|>Update<\|>Create<\|>Back<\|>Next<\|>Previous<\|>Close<\|>Open<\|>Search<\|>Filter<\|>Reset<\|>Clear<\|>Confirm<" {} \; 2>/dev/null | head -20

echo ""
echo "3. Placeholder attributes:"
find src/app src/components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l 'placeholder="[^{]' {} \; 2>/dev/null | head -20

echo ""
echo "4. Title attributes:"
find src/app src/components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l 'title="[^{]' {} \; 2>/dev/null | head -20

echo ""
echo "5. Aria-label attributes:"
find src/app src/components -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l 'aria-label="[^{]' {} \; 2>/dev/null | head -20