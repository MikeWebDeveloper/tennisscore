#!/bin/bash

# Fix all framer-motion imports to use the lazy loading config

echo "🔧 Fixing framer-motion imports to use LazyMotion config..."

# Find all files with framer-motion imports
files=$(grep -rl "from ['\"]framer-motion['\"]" src/ --include="*.tsx" --include="*.ts" | grep -v "framer-motion-config.ts" | grep -v "motion-provider.tsx")

for file in $files; do
    echo "📝 Updating: $file"
    
    # Replace basic motion import
    sed -i '' "s/import { motion } from ['\"]framer-motion['\"]/import { motion } from '@\/lib\/framer-motion-config'/g" "$file"
    
    # Replace motion with AnimatePresence import
    sed -i '' "s/import { motion, AnimatePresence } from ['\"]framer-motion['\"]/import { motion, AnimatePresence } from '@\/lib\/framer-motion-config'/g" "$file"
    
    # Replace other framer-motion imports that we haven't exported yet
    if grep -q "useMotionValue\|useTransform\|animate\|useAnimation\|useInView\|useScroll" "$file"; then
        echo "⚠️  Found advanced hooks in $file - needs manual review"
    fi
done

echo "✅ Import fixes complete!"
echo "⚠️  Note: Some files may need manual review for advanced framer-motion features"