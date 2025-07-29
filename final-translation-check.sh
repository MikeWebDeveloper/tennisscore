#!/bin/bash

echo "=== FINAL COMPREHENSIVE TRANSLATION CHECK ==="
echo "Date: $(date)"
echo ""

OUTPUT="final-translation-report.txt"
> "$OUTPUT"

# Function to log to both console and file
log() {
    echo "$1" | tee -a "$OUTPUT"
}

log "OBJECTIVE: Ensure Czech (cs) is default and no hardcoded English strings exist"
log "==========================================================================="
log ""

# 1. Check default locale configuration
log "1. DEFAULT LOCALE CONFIGURATION CHECK"
log "-------------------------------------"
log "Checking for defaultLocale settings..."
log ""

log "In i18n/config.ts:"
grep -n "defaultLocale" src/i18n/config.ts 2>/dev/null | tee -a "$OUTPUT" || log "File not found"

log ""
log "In i18n/navigation.ts:"
grep -n "defaultLocale" src/i18n/navigation.ts 2>/dev/null | tee -a "$OUTPUT" || log "File not found"

log ""
log "In middleware.ts:"
grep -n "defaultLocale" src/middleware.ts 2>/dev/null | tee -a "$OUTPUT" || log "File not found"

log ""
log "In next.config.mjs:"
grep -n "defaultLocale" next.config.mjs 2>/dev/null | tee -a "$OUTPUT" || log "File not found"

# 2. Find hardcoded strings in components
log ""
log "2. HARDCODED ENGLISH STRINGS IN COMPONENTS"
log "-------------------------------------------"

# Common UI text patterns
UI_WORDS="Submit|Cancel|Save|Loading|Error|Success|Delete|Edit|Create|Update|Close|Open|Search|Filter|Back|Next|Previous|Yes|No|OK|Confirm|Add|Remove|Upload|Download|Export|Import|Settings|Profile|Dashboard|Statistics|Matches|Players"

log ""
log "Searching for common UI words not using translations..."
grep -rn "\b($UI_WORDS)\b" \
    --include="*.tsx" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    src/app src/components 2>/dev/null | \
    grep -v "useTranslations\|getTranslations\|t(\|className\|variant\|import\|export\|interface\|type\|const\|function" | \
    head -20 | tee -a "$OUTPUT"

# 3. Check for text between JSX tags
log ""
log "3. TEXT BETWEEN JSX TAGS (NOT IN TRANSLATION FUNCTIONS)"
log "-------------------------------------------------------"

grep -rn ">[[:space:]]*[A-Za-z][^<{]*<" \
    --include="*.tsx" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    src/app src/components 2>/dev/null | \
    grep -v "{t(\|className\|key\|id\|data-\|aria-" | \
    head -20 | tee -a "$OUTPUT"

# 4. Check form elements
log ""
log "4. FORM ELEMENTS WITH HARDCODED TEXT"
log "-------------------------------------"

log ""
log "Placeholders:"
grep -rn 'placeholder="[^{][^"]*[A-Za-z][^"]*"' \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    src/ 2>/dev/null | \
    head -10 | tee -a "$OUTPUT"

log ""
log "Titles:"
grep -rn 'title="[^{][^"]*[A-Za-z][^"]*"' \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    src/ 2>/dev/null | \
    grep -v "Tennis Score" | \
    head -10 | tee -a "$OUTPUT"

log ""
log "Aria labels:"
grep -rn 'aria-label="[^{][^"]*[A-Za-z][^"]*"' \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    src/ 2>/dev/null | \
    head -10 | tee -a "$OUTPUT"

# 5. Check specific high-risk areas
log ""
log "5. HIGH-RISK AREAS CHECK"
log "------------------------"

log ""
log "Dashboard page:"
find src -path "*dashboard*" -name "*.tsx" -exec grep -Hn ">[^<{]*[A-Za-z][^<{]*<" {} \; 2>/dev/null | \
    grep -v "{t(\|className" | head -5 | tee -a "$OUTPUT"

log ""
log "Statistics pages:"
find src -path "*statistics*" -name "*.tsx" -exec grep -Hn ">[^<{]*[A-Za-z][^<{]*<" {} \; 2>/dev/null | \
    grep -v "{t(\|className" | head -5 | tee -a "$OUTPUT"

log ""
log "Match pages:"
find src -path "*match*" -name "*.tsx" -exec grep -Hn ">[^<{]*[A-Za-z][^<{]*<" {} \; 2>/dev/null | \
    grep -v "{t(\|className" | head -5 | tee -a "$OUTPUT"

log ""
log "Player pages:"
find src -path "*player*" -name "*.tsx" -exec grep -Hn ">[^<{]*[A-Za-z][^<{]*<" {} \; 2>/dev/null | \
    grep -v "{t(\|className" | head -5 | tee -a "$OUTPUT"

# 6. Check for hardcoded 'en' references
log ""
log "6. HARDCODED 'EN' LOCALE REFERENCES"
log "------------------------------------"

grep -rn "['\"]en['\"]" \
    --include="*.tsx" \
    --include="*.ts" \
    --exclude-dir=node_modules \
    src/ 2>/dev/null | \
    grep -v "defaultLocale\|locales\|supportedLocales\|i18n" | \
    head -10 | tee -a "$OUTPUT"

# 7. Check Button and Link components
log ""
log "7. BUTTON AND LINK COMPONENTS"
log "------------------------------"

log ""
log "Buttons with hardcoded text:"
grep -rn "<Button[^>]*>[[:space:]]*[A-Za-z][^<{]*</Button>" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    src/ 2>/dev/null | \
    head -10 | tee -a "$OUTPUT"

log ""
log "Links with hardcoded text:"
grep -rn "<Link[^>]*>[[:space:]]*[A-Za-z][^<{]*</Link>" \
    --include="*.tsx" \
    --exclude-dir=node_modules \
    src/ 2>/dev/null | \
    head -10 | tee -a "$OUTPUT"

# 8. Check toast messages
log ""
log "8. TOAST/ALERT MESSAGES"
log "-----------------------"

grep -rn "toast\.\(error\|success\|info\|warning\)(['\"][^'\"]*[A-Za-z][^'\"]*['\"]" \
    --include="*.tsx" \
    --include="*.ts" \
    --exclude-dir=node_modules \
    src/ 2>/dev/null | \
    grep -v "t(" | \
    head -10 | tee -a "$OUTPUT"

# 9. Translation key completeness
log ""
log "9. TRANSLATION KEY COMPLETENESS"
log "-------------------------------"

log ""
log "Checking if all namespaces have Czech translations..."

for namespace in auth common dashboard match navigation player statistics; do
    en_file="src/i18n/locales/en/${namespace}.json"
    cs_file="src/i18n/locales/cs/${namespace}.json"
    
    if [ -f "$en_file" ] && [ -f "$cs_file" ]; then
        en_count=$(grep -c '":' "$en_file" 2>/dev/null || echo 0)
        cs_count=$(grep -c '":' "$cs_file" 2>/dev/null || echo 0)
        
        if [ "$en_count" -ne "$cs_count" ]; then
            log "⚠️  $namespace: EN has $en_count keys, CS has $cs_count keys"
        else
            log "✅ $namespace: Both have $en_count keys"
        fi
    else
        log "❌ $namespace: Missing translation file"
    fi
done

# 10. Summary and recommendations
log ""
log "============================================"
log "SUMMARY AND ACTION ITEMS"
log "============================================"
log ""
log "1. Verify defaultLocale is set to 'cs' in all configuration files"
log "2. Replace all hardcoded English strings with translation function calls"
log "3. Ensure all translation keys exist in Czech (cs) locale files"
log "4. Test the entire application in Czech to verify no English text appears"
log "5. Pay special attention to:"
log "   - Form placeholders and labels"
log "   - Button and link text"
log "   - Toast/alert messages"
log "   - Empty state messages"
log "   - Page titles and headers"
log ""
log "Report saved to: $OUTPUT"