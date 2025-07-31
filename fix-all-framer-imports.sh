#!/bin/bash

echo "🔧 Fixing all framer-motion imports comprehensively..."

# Find all TypeScript/React files
files=$(find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) | grep -v "framer-motion-config.ts" | grep -v "motion-provider.tsx")

count=0
for file in $files; do
    # Check if file contains framer-motion imports
    if grep -q "from ['\"]framer-motion['\"]" "$file"; then
        count=$((count + 1))
        echo "📝 Updating ($count): $file"
        
        # Create a temporary file
        temp_file="${file}.tmp"
        
        # Process the file line by line
        while IFS= read -r line; do
            # Check if this is a framer-motion import line
            if echo "$line" | grep -q "from ['\"]framer-motion['\"]"; then
                # Replace the import source
                updated_line=$(echo "$line" | sed "s/from ['\"]framer-motion['\"]/from '@\/lib\/framer-motion-config'/g")
                echo "$updated_line" >> "$temp_file"
            else
                echo "$line" >> "$temp_file"
            fi
        done < "$file"
        
        # Replace original file with updated one
        mv "$temp_file" "$file"
    fi
done

echo "✅ Fixed imports in $count files!"
echo ""
echo "🔍 Checking for any remaining direct imports..."
remaining=$(grep -rl "from ['\"]framer-motion['\"]" src/ --include="*.tsx" --include="*.ts" | grep -v "framer-motion-config.ts" | grep -v "motion-provider.tsx" | wc -l)

if [ $remaining -eq 0 ]; then
    echo "✅ All framer-motion imports have been updated!"
else
    echo "⚠️  Found $remaining files still with direct imports"
fi