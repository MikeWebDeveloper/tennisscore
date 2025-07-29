#!/bin/bash

echo "=== TRANSLATION FIXES NEEDED ==="
echo ""

# Create a fixes file
FIXES="translation-fixes.md"
> "$FIXES"

echo "# Translation Fixes Required" >> "$FIXES"
echo "" >> "$FIXES"
echo "Generated: $(date)" >> "$FIXES"
echo "" >> "$FIXES"

# Function to add fix to report
add_fix() {
    local file="$1"
    local line="$2"
    local issue="$3"
    local fix="$4"
    
    echo "## File: $file (Line: $line)" >> "$FIXES"
    echo "**Issue:** $issue" >> "$FIXES"
    echo "**Fix:** $fix" >> "$FIXES"
    echo "" >> "$FIXES"
}

echo "## Priority 1: Hardcoded English Text in JSX" >> "$FIXES"
echo "" >> "$FIXES"

# Find common patterns and suggest fixes
echo "Searching for hardcoded text patterns..."

# Pattern 1: Text between tags
grep -rn ">[[:space:]]*[A-Za-z][^<{]*<" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    src/app src/components 2>/dev/null | \
    grep -v "{t(\|className\|key\|id" | \
    while IFS=: read -r file line content; do
        if [[ -n "$file" ]]; then
            text=$(echo "$content" | sed 's/.*>\([^<]*\)<.*/\1/' | xargs)
            echo "Found: $file:$line - Text: '$text'"
            
            # Determine namespace based on path
            namespace="common"
            [[ "$file" == *"match"* ]] && namespace="match"
            [[ "$file" == *"statistics"* ]] && namespace="statistics"
            [[ "$file" == *"dashboard"* ]] && namespace="dashboard"
            [[ "$file" == *"player"* ]] && namespace="player"
            [[ "$file" == *"auth"* ]] && namespace="auth"
            
            # Suggest translation key
            key=$(echo "$text" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | tr -d '.,!?')
            
            add_fix "$file" "$line" "Hardcoded text: '$text'" \
                "1. Add to translations: \"$key\": \"$text\" (EN) and Czech equivalent (CS)
2. Replace with: {t('$key')}"
        fi
    done | head -10

echo "" >> "$FIXES"
echo "## Priority 2: Form Attributes" >> "$FIXES"
echo "" >> "$FIXES"

# Pattern 2: Placeholders
grep -rn 'placeholder="[^{][^"]*[A-Za-z][^"]*"' \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    src/ 2>/dev/null | \
    while IFS=: read -r file line content; do
        if [[ -n "$file" ]]; then
            placeholder=$(echo "$content" | grep -o 'placeholder="[^"]*"' | sed 's/placeholder="\([^"]*\)"/\1/')
            echo "Found placeholder: $file:$line - '$placeholder'"
            
            # Suggest fix
            key=$(echo "$placeholder" | tr '[:upper:]' '[:lower:]' | tr ' ' '_' | tr -d '.,!?')
            add_fix "$file" "$line" "Hardcoded placeholder: '$placeholder'" \
                "Replace with: placeholder={t('$key')}"
        fi
    done | head -5

echo "" >> "$FIXES"
echo "## Priority 3: Common UI Words" >> "$FIXES"
echo "" >> "$FIXES"

# Pattern 3: Common UI words
UI_WORDS="Submit|Cancel|Save|Loading|Error|Success|Delete|Edit|Create|Update"
grep -rn "\b($UI_WORDS)\b" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    src/app src/components 2>/dev/null | \
    grep -v "useTranslations\|getTranslations\|t(\|className\|variant\|import\|export" | \
    while IFS=: read -r file line content; do
        if [[ -n "$file" ]]; then
            # Extract the matched word
            word=$(echo "$content" | grep -oE "\b($UI_WORDS)\b" | head -1)
            if [[ -n "$word" ]]; then
                echo "Found UI word: $file:$line - '$word'"
                key=$(echo "$word" | tr '[:upper:]' '[:lower:]')
                add_fix "$file" "$line" "Hardcoded UI word: '$word'" \
                    "Replace with: {t('common.$key')}"
            fi
        fi
    done | head -10

echo "" >> "$FIXES"
echo "## Configuration Changes Required" >> "$FIXES"
echo "" >> "$FIXES"

# Check current defaultLocale settings
echo "### Current defaultLocale Settings:" >> "$FIXES"
echo "" >> "$FIXES"

echo "1. **i18n/config.ts:**" >> "$FIXES"
grep "defaultLocale" src/i18n/config.ts 2>/dev/null >> "$FIXES" || echo "   File not found" >> "$FIXES"
echo "" >> "$FIXES"

echo "2. **i18n/navigation.ts:**" >> "$FIXES"
grep "defaultLocale" src/i18n/navigation.ts 2>/dev/null >> "$FIXES" || echo "   File not found" >> "$FIXES"
echo "" >> "$FIXES"

echo "3. **middleware.ts:**" >> "$FIXES"
grep "defaultLocale" src/middleware.ts 2>/dev/null >> "$FIXES" || echo "   File not found" >> "$FIXES"
echo "" >> "$FIXES"

echo "**Required Change:** Set all defaultLocale values to 'cs'" >> "$FIXES"
echo "" >> "$FIXES"

# Summary
echo "" >> "$FIXES"
echo "## Summary of Required Actions" >> "$FIXES"
echo "" >> "$FIXES"
echo "1. **Update Configuration:** Change defaultLocale from 'en' to 'cs' in all config files" >> "$FIXES"
echo "2. **Fix Hardcoded Strings:** Replace all hardcoded English text with translation calls" >> "$FIXES"
echo "3. **Add Missing Translations:** Ensure all new keys are added to both EN and CS locale files" >> "$FIXES"
echo "4. **Test in Czech:** Verify the entire app works correctly with Czech as default" >> "$FIXES"
echo "" >> "$FIXES"
echo "### Translation Function Usage:" >> "$FIXES"
echo '```tsx' >> "$FIXES"
echo '// For client components:' >> "$FIXES"
echo "import { useTranslations } from '@/i18n'" >> "$FIXES"
echo "const t = useTranslations('namespace')" >> "$FIXES"
echo "" >> "$FIXES"
echo '// For server components:' >> "$FIXES"
echo "import { getTranslations } from '@/i18n'" >> "$FIXES"
echo "const t = await getTranslations('namespace')" >> "$FIXES"
echo '```' >> "$FIXES"

echo ""
echo "Translation fixes report saved to: $FIXES"
echo ""
echo "Next steps:"
echo "1. Review the $FIXES file for all required changes"
echo "2. Update defaultLocale to 'cs' in configuration files"
echo "3. Fix all hardcoded strings identified in the report"
echo "4. Run the check scripts again to verify all issues are resolved"