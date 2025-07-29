#!/bin/bash

echo "=== Comprehensive Hardcoded String Detection ==="
echo "Checking all TSX/JSX files in src/"
echo ""

# Output file
OUTPUT="hardcoded-strings-report.txt"
> "$OUTPUT"

# Function to write to both console and file
log() {
    echo "$1" | tee -a "$OUTPUT"
}

# Function to check patterns
check_pattern() {
    local pattern="$1"
    local description="$2"
    local path="$3"
    local exclude_grep="$4"
    
    log ""
    log "### $description"
    log "===================="
    
    if [ -n "$exclude_grep" ]; then
        results=$(grep -rn "$pattern" \
            --include="*.tsx" \
            --include="*.jsx" \
            --exclude-dir=node_modules \
            --exclude-dir=.next \
            --exclude-dir=dist \
            "$path" 2>/dev/null | \
            grep -v "$exclude_grep")
    else
        results=$(grep -rn "$pattern" \
            --include="*.tsx" \
            --include="*.jsx" \
            --exclude-dir=node_modules \
            --exclude-dir=.next \
            --exclude-dir=dist \
            "$path" 2>/dev/null)
    fi
    
    if [ -n "$results" ]; then
        log "Found issues:"
        echo "$results" | head -30 | tee -a "$OUTPUT"
    else
        log "✓ No issues found"
    fi
}

# 1. Text between JSX tags
log "1. CHECKING TEXT BETWEEN JSX TAGS"
check_pattern ">[[:space:]]*[A-Za-z][^<{]*<" \
    "Text content between tags (not in {t(...)})" \
    "src" \
    "{t(\|className\|key\|id\|data-\|aria-\|href\|src="

# 2. Common UI words
log ""
log "2. CHECKING COMMON UI WORDS"
WORDS="Submit|Cancel|Save|Loading|Error|Success|Delete|Edit|Create|Update|Close|Open|Search|Filter|Back|Next|Previous|Yes|No|OK|Confirm"
check_pattern "\b($WORDS)\b" \
    "Common English UI words" \
    "src" \
    "t(\|useTranslations\|getTranslations\|className\|variant\|type=\|name=\|console\|import\|export\|interface\|const\|function\|return\|test("

# 3. Button text
log ""
log "3. CHECKING BUTTON COMPONENTS"
check_pattern "<Button[^>]*>[[:space:]]*[A-Za-z][^<{]*</Button>" \
    "Button components with hardcoded text" \
    "src" \
    "{t("

# 4. Form attributes
log ""
log "4. CHECKING FORM ATTRIBUTES"
check_pattern 'placeholder="[^{][^"]*[A-Za-z][^"]*"' \
    "Placeholder attributes" \
    "src" \
    ""

check_pattern 'title="[^{][^"]*[A-Za-z][^"]*"' \
    "Title attributes" \
    "src" \
    ""

check_pattern 'aria-label="[^{][^"]*[A-Za-z][^"]*"' \
    "Aria-label attributes" \
    "src" \
    ""

# 5. Alert/Toast messages
log ""
log "5. CHECKING ALERT/TOAST MESSAGES"
check_pattern "toast\.(error|success|info|warning)\(['\"][^'\"]+['\"]" \
    "Toast messages" \
    "src" \
    "t(\|{\`"

# 6. Validation messages
log ""
log "6. CHECKING FORM VALIDATION MESSAGES"
check_pattern "message:[[:space:]]*['\"][^'\"]*[A-Za-z][^'\"]*['\"]" \
    "Validation messages in schemas" \
    "src" \
    "t(\|{\`"

# 7. Hardcoded 'en' locale
log ""
log "7. CHECKING HARDCODED 'EN' LOCALE"
check_pattern "['\"]en['\"]" \
    "Hardcoded 'en' locale references" \
    "src" \
    "defaultLocale\|locales\|supportedLocales\|i18n\|config"

# 8. Empty state messages
log ""
log "8. CHECKING EMPTY STATE MESSAGES"
check_pattern "No .* found\|No .* available\|Empty\|Nothing to show" \
    "Empty state messages" \
    "src" \
    "t("

# 9. Headers and labels
log ""
log "9. CHECKING HEADERS AND LABELS"
check_pattern "<h[1-6][^>]*>[[:space:]]*[A-Za-z][^<{]*</h[1-6]>" \
    "Header tags with hardcoded text" \
    "src" \
    "{t("

check_pattern "<label[^>]*>[[:space:]]*[A-Za-z][^<{]*</label>" \
    "Label tags with hardcoded text" \
    "src" \
    "{t("

# 10. Specific component checks
log ""
log "10. CHECKING SPECIFIC COMPONENTS"

log ""
log "Dashboard components:"
find src -path "*dashboard*" -name "*.tsx" -exec grep -Hn ">[^<{]*[A-Za-z][^<{]*<" {} \; 2>/dev/null | \
    grep -v "{t(\|className\|key\|id" | head -10 | tee -a "$OUTPUT"

log ""
log "Statistics components:"
find src -path "*statistics*" -name "*.tsx" -exec grep -Hn ">[^<{]*[A-Za-z][^<{]*<" {} \; 2>/dev/null | \
    grep -v "{t(\|className\|key\|id" | head -10 | tee -a "$OUTPUT"

log ""
log "Match components:"
find src -path "*match*" -name "*.tsx" -exec grep -Hn ">[^<{]*[A-Za-z][^<{]*<" {} \; 2>/dev/null | \
    grep -v "{t(\|className\|key\|id" | head -10 | tee -a "$OUTPUT"

# Summary
log ""
log "=== SUMMARY ==="
log "Report saved to: $OUTPUT"
log ""
log "Key areas to review:"
log "1. Form placeholders and validation messages"
log "2. Button and link text"
log "3. Headers and page titles"
log "4. Empty state messages"
log "5. Toast/alert messages"
log "6. Table headers and labels"
log ""
log "Remember: All user-facing text must use the translation system!"
log "Czech (cs) is the default locale - test all changes in Czech!"