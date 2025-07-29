#!/bin/bash

echo "=== Checking Czech Translation Completeness ==="
echo ""

# Function to compare translation files
compare_translations() {
    local namespace="$1"
    local en_file="src/i18n/locales/en/${namespace}.json"
    local cs_file="src/i18n/locales/cs/${namespace}.json"
    
    echo "### Checking namespace: $namespace"
    echo "===================="
    
    if [ ! -f "$en_file" ]; then
        echo "❌ English file not found: $en_file"
        return
    fi
    
    if [ ! -f "$cs_file" ]; then
        echo "❌ Czech file not found: $cs_file"
        return
    fi
    
    # Extract all keys from English file
    en_keys=$(grep -o '"[^"]*"[[:space:]]*:' "$en_file" | sed 's/[[:space:]]*://g' | sed 's/"//g' | sort)
    
    # Extract all keys from Czech file
    cs_keys=$(grep -o '"[^"]*"[[:space:]]*:' "$cs_file" | sed 's/[[:space:]]*://g' | sed 's/"//g' | sort)
    
    # Find missing keys in Czech
    missing_in_cs=$(comm -23 <(echo "$en_keys") <(echo "$cs_keys"))
    
    if [ -n "$missing_in_cs" ]; then
        echo "❌ Missing in Czech translation:"
        echo "$missing_in_cs" | sed 's/^/  - /'
    else
        echo "✅ All keys present in Czech translation"
    fi
    
    # Find extra keys in Czech (keys not in English)
    extra_in_cs=$(comm -13 <(echo "$en_keys") <(echo "$cs_keys"))
    
    if [ -n "$extra_in_cs" ]; then
        echo "⚠️  Extra keys in Czech (not in English):"
        echo "$extra_in_cs" | sed 's/^/  - /'
    fi
    
    echo ""
}

# Check all namespaces
namespaces=("auth" "common" "dashboard" "match" "navigation" "player" "statistics")

for namespace in "${namespaces[@]}"; do
    compare_translations "$namespace"
done

echo "=== Checking for English text in Czech files ==="
echo ""

# Check if Czech files contain English text (common patterns)
for namespace in "${namespaces[@]}"; do
    cs_file="src/i18n/locales/cs/${namespace}.json"
    if [ -f "$cs_file" ]; then
        echo "Checking $namespace for English patterns..."
        
        # Look for common English words that shouldn't appear in Czech translations
        english_patterns="Submit|Cancel|Save|Loading|Error|Success|Delete|Edit|Create|Update|Close|Open|Search|Filter|Back|Next|Previous|Yes|No|OK|Confirm"
        
        matches=$(grep -E "\"[^\"]*\b($english_patterns)\b[^\"]*\"[[:space:]]*:" "$cs_file" 2>/dev/null)
        
        if [ -n "$matches" ]; then
            echo "⚠️  Possible English text in Czech file:"
            echo "$matches" | head -10
        fi
    fi
done

echo ""
echo "=== Checking defaultLocale Configuration ==="
echo ""

# Check if defaultLocale is set to 'cs'
echo "Checking i18n config files for defaultLocale setting..."

# Check various config files
grep -n "defaultLocale" src/i18n/*.{ts,js} 2>/dev/null | grep -v ".json"
grep -n "defaultLocale" src/middleware.ts 2>/dev/null
grep -n "defaultLocale" next.config.* 2>/dev/null

echo ""
echo "=== Summary ==="
echo "1. Ensure all English keys have Czech translations"
echo "2. Check that Czech translations don't contain English text"
echo "3. Verify defaultLocale is set to 'cs' in all config files"
echo "4. Test the application in Czech to ensure all text displays correctly"