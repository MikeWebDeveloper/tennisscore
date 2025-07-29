#!/bin/bash

echo "=== Checking for Hardcoded Strings and Translation Issues ==="
echo ""
echo "Searching in: src/"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check and display results
check_files() {
    local description="$1"
    local pattern="$2"
    local path="$3"
    
    echo -e "${YELLOW}### $description${NC}"
    echo "Pattern: $pattern"
    echo "Path: $path"
    echo "-----------------------------------------"
    
    # Count total matches
    local count=$(grep -r "$pattern" \
        --include="*.tsx" \
        --include="*.jsx" \
        --include="*.ts" \
        --exclude-dir=node_modules \
        --exclude-dir=.next \
        --exclude-dir=dist \
        "$path" 2>/dev/null | wc -l)
    
    if [ $count -gt 0 ]; then
        echo -e "${RED}Found $count potential issues:${NC}"
        grep -rn "$pattern" \
            --include="*.tsx" \
            --include="*.jsx" \
            --include="*.ts" \
            --exclude-dir=node_modules \
            --exclude-dir=.next \
            --exclude-dir=dist \
            "$path" 2>/dev/null | \
            grep -v "useTranslations\|getTranslations\|t(\|t.raw(\|className\|console\|import\|export" | \
            head -20
    else
        echo -e "${GREEN}✓ No issues found${NC}"
    fi
    echo ""
}

# 1. Check for hardcoded text between JSX tags
check_files \
    "Text between JSX tags (excluding {t(...)} calls)" \
    ">[[:space:]]*[A-Za-z][^<{]*<" \
    "src/app"

# 2. Check for hardcoded strings in button text
check_files \
    "Button text without translations" \
    "<Button[^>]*>[[:space:]]*[A-Za-z][^<{]*</Button>" \
    "src"

# 3. Check for hardcoded placeholder text
check_files \
    "Placeholder attributes without translations" \
    'placeholder="[^{][^"]*[A-Za-z][^"]*"' \
    "src"

# 4. Check for hardcoded title attributes
check_files \
    "Title attributes without translations" \
    'title="[^{][^"]*[A-Za-z][^"]*"' \
    "src"

# 5. Check for common English UI words
echo -e "${YELLOW}### Common English UI words (should use translations)${NC}"
echo "Checking for: Submit, Cancel, Save, Loading, Error, etc."
echo "-----------------------------------------"

COMMON_WORDS="Submit|Cancel|Save|Loading|Error|Success|Delete|Edit|Create|Update|Close|Open|Back|Next|Previous"
count=$(grep -rE "\b($COMMON_WORDS)\b" \
    --include="*.tsx" \
    --include="*.jsx" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    "src" 2>/dev/null | \
    grep -v "useTranslations\|getTranslations\|t(\|className\|variant\|type\|name\|console\|import\|export\|interface\|const" | \
    wc -l)

if [ $count -gt 0 ]; then
    echo -e "${RED}Found $count potential hardcoded UI words:${NC}"
    grep -rnE "\b($COMMON_WORDS)\b" \
        --include="*.tsx" \
        --include="*.jsx" \
        --exclude-dir=node_modules \
        --exclude-dir=.next \
        "src" 2>/dev/null | \
        grep -v "useTranslations\|getTranslations\|t(\|className\|variant\|type\|name\|console\|import\|export\|interface\|const" | \
        head -20
else
    echo -e "${GREEN}✓ No hardcoded UI words found${NC}"
fi
echo ""

# 6. Check for hardcoded 'en' locale
check_files \
    "Hardcoded 'en' locale (should use defaultLocale from config)" \
    "['\"]en['\"]" \
    "src"

# 7. Check for translation keys showing as text
check_files \
    "Translation keys (namespace.key) possibly showing as text" \
    '[">][a-zA-Z]+\.[a-zA-Z]+[<"]' \
    "src/app"

# 8. Check specific high-risk areas
echo -e "${YELLOW}### Checking specific high-risk areas${NC}"
echo "-----------------------------------------"

# Dashboard
echo "Dashboard components:"
find src/app -path "*dashboard*" -name "*.tsx" -exec grep -Hn ">[^<{]*[A-Za-z][^<{]*<" {} \; 2>/dev/null | \
    grep -v "{t(\|className\|key\|id" | head -5

# Statistics
echo ""
echo "Statistics components:"
find src/app -path "*statistics*" -name "*.tsx" -exec grep -Hn ">[^<{]*[A-Za-z][^<{]*<" {} \; 2>/dev/null | \
    grep -v "{t(\|className\|key\|id" | head -5

# Matches
echo ""
echo "Match components:"
find src/app -path "*match*" -name "*.tsx" -exec grep -Hn ">[^<{]*[A-Za-z][^<{]*<" {} \; 2>/dev/null | \
    grep -v "{t(\|className\|key\|id" | head -5

echo ""
echo -e "${YELLOW}=== SUMMARY ===${NC}"
echo "Review the results above and update any hardcoded strings to use the translation system."
echo "Remember to:"
echo "1. Import useTranslations or getTranslations"
echo "2. Use the appropriate namespace (auth, match, statistics, dashboard, player, common, navigation)"
echo "3. Add missing keys to all language files in src/i18n/locales/"
echo "4. Test in Czech (cs) as it's the default locale"