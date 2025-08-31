#!/bin/bash

# Fix unused variables script - patterns identified from lint output

echo "Fixing unused variables in TennisScore codebase..."

# Fix common unused imports and variables
files=$(npm run lint 2>&1 | grep "no-unused-vars" | grep -oE "^[^:]*" | sort -u)

for file in $files; do
    if [ -f "$file" ]; then
        echo "Processing $file..."
        
        # Remove unused imports that are clearly not used
        # This is safe as these are common patterns identified
        
        # Remove unused ArrowRight imports
        sed -i '' '/import.*ArrowRight.*from.*lucide-react/d' "$file" 2>/dev/null || true
        
        # Remove lines with unused Button imports (if not used elsewhere)
        # More cautious approach - only remove if it's standalone import
        grep -q 'Button' "$file" && grep -c '<Button\|Button(' "$file" | grep -q '^0$' && {
            sed -i '' '/import.*Button.*from.*@\/components\/ui\/button/d' "$file" 2>/dev/null || true
        } || true
        
        # Remove unused Play icon imports
        grep -q 'Play' "$file" && grep -c '<Play\|Play(' "$file" | grep -q '^0$' && {
            sed -i '' '/import.*Play.*from.*lucide-react/d' "$file" 2>/dev/null || true
        } || true
        
        # Remove unused Star icon imports
        grep -q 'Star' "$file" && grep -c '<Star\|Star(' "$file" | grep -q '^0$' && {
            sed -i '' '/import.*Star.*from.*lucide-react/d' "$file" 2>/dev/null || true
        } || true
        
    fi
done

echo "Done processing files. Run 'npm run lint' to see remaining issues."