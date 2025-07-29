#!/bin/bash

echo "=== Comprehensive Check for Hardcoded Strings and Translation Issues ==="
echo ""

# Function to check files for patterns
check_pattern() {
    local pattern="$1"
    local description="$2"
    local exclude_pattern="$3"
    
    echo "### $description"
    echo "===================="
    
    if [ -n "$exclude_pattern" ]; then
        grep -rn "$pattern" \
            --include="*.tsx" \
            --include="*.jsx" \
            --exclude-dir=node_modules \
            --exclude-dir=.next \
            --exclude-dir=dist \
            src/ 2>/dev/null | \
            grep -v "$exclude_pattern" | \
            head -15
    else
        grep -rn "$pattern" \
            --include="*.tsx" \
            --include="*.jsx" \
            --exclude-dir=node_modules \
            --exclude-dir=.next \
            --exclude-dir=dist \
            src/ 2>/dev/null | \
            head -15
    fi
    echo ""
}

# 1. Check for text between JSX tags (excluding translation function calls)
echo "1. CHECKING FOR HARDCODED TEXT BETWEEN JSX TAGS"
check_pattern ">[[:space:]]*[A-Za-z][^<{]*<" \
    "Text between JSX tags (potential hardcoded strings)" \
    "{t(\|className\|key\|id\|data-\|aria-\|href"

# 2. Check for hardcoded strings in common UI attributes
echo "2. CHECKING FOR HARDCODED STRINGS IN ATTRIBUTES"
check_pattern 'placeholder="[^"]*[A-Za-z][^"]*"' \
    "Placeholder attributes with hardcoded text" \
    "{t(\|{\`"

check_pattern 'title="[^"]*[A-Za-z][^"]*"' \
    "Title attributes with hardcoded text" \
    "{t(\|{\`"

check_pattern 'aria-label="[^"]*[A-Za-z][^"]*"' \
    "Aria-label attributes with hardcoded text" \
    "{t(\|{\`"

# 3. Check for common English UI text patterns
echo "3. CHECKING FOR COMMON ENGLISH UI TEXT"
check_pattern '\b(Submit|Cancel|Save|Loading|Error|Success|Delete|Edit|Create|Update|Close|Open|Select|Choose|Upload|Download|Search|Filter|Sort|Reset|Back|Next|Previous|Confirm|Yes|No|OK)\b' \
    "Common English UI words (should use translations)" \
    "t(\|useTranslations\|getTranslations\|className\|variant\|console\|export\|import\|const\|function\|return"

# 4. Check for hardcoded 'en' locale
echo "4. CHECKING FOR HARDCODED 'en' LOCALE"
check_pattern "['\"]\s*en\s*['\"]" \
    "Hardcoded 'en' locale (should use defaultLocale)" \
    "defaultLocale\|locales\|i18n\|config\|supportedLocales"

# 5. Check for translation key patterns showing as text
echo "5. CHECKING FOR TRANSLATION KEYS SHOWING AS TEXT"
check_pattern '[">][a-zA-Z]+\.[a-zA-Z]+[<"]' \
    "Translation key patterns (namespace.key) showing as text" \
    "Math\.\|Array\.\|Object\.\|console\.\|window\.\|document\.\|React\."

# 6. Check specific components for hardcoded strings
echo "6. CHECKING SPECIFIC COMPONENTS"
echo "===================="

echo "Dashboard components:"
find src/app -name "*dashboard*" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec grep -Hn ">[^<{]*[A-Za-z][^<{]*<" {} \; 2>/dev/null | \
    grep -v "{t(\|className" | head -10

echo ""
echo "Statistics components:"
find src/app -path "*statistics*" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec grep -Hn ">[^<{]*[A-Za-z][^<{]*<" {} \; 2>/dev/null | \
    grep -v "{t(\|className" | head -10

echo ""
echo "Match components:"
find src/app -path "*match*" -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec grep -Hn ">[^<{]*[A-Za-z][^<{]*<" {} \; 2>/dev/null | \
    grep -v "{t(\|className" | head -10

# 7. Check for Button and Link text
echo ""
echo "7. CHECKING BUTTON AND LINK TEXT"
check_pattern "<Button[^>]*>[^<{]*[A-Za-z][^<{]*</Button>" \
    "Button components with hardcoded text" \
    "{t("

check_pattern "<Link[^>]*>[^<{]*[A-Za-z][^<{]*</Link>" \
    "Link components with hardcoded text" \
    "{t("

# 8. Check for form validation messages
echo "8. CHECKING FORM VALIDATION MESSAGES"
check_pattern "message:[[:space:]]*['\"][^'\"]*[A-Za-z][^'\"]*['\"]" \
    "Form validation messages (should use translations)" \
    "t(\|{\`"

# 9. Summary
echo ""
echo "=== SUMMARY ==="
echo "Run this script regularly to catch hardcoded strings."
echo "Key areas that often have hardcoded strings:"
echo "- Form placeholders and labels"
echo "- Button text"
echo "- Error and success messages"
echo "- Page titles and headings"
echo "- Tooltips and help text"
echo "- Table headers"
echo "- Empty state messages"