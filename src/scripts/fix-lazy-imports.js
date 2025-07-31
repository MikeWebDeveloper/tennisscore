#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Directory containing the lazy loading components
const LAZY_DIR = path.join(__dirname, '..', 'components', 'features')

// Fix import paths in a file
function fixImportPaths(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  
  // Replace relative imports with absolute imports
  const fixed = content
    // Fix app imports
    .replace(/import\('\.\.\/app\//g, "import('@/app/")
    .replace(/import\('\.\.\/\.\.\/app\//g, "import('@/app/")
    // Fix components imports
    .replace(/import\('\.\.\/\.\.\/components\//g, "import('@/components/")
    .replace(/import\('\.\.\/components\//g, "import('@/components/")
    // Fix lib imports
    .replace(/import\('\.\.\/\.\.\/lib\//g, "import('@/lib/")
    .replace(/import\('\.\.\/lib\//g, "import('@/lib/")
  
  if (content !== fixed) {
    fs.writeFileSync(filePath, fixed)
    console.log(`✅ Fixed imports in: ${path.basename(filePath)}`)
    return true
  }
  
  return false
}

// Process all lazy-*.tsx files
console.log('🔧 Fixing import paths in lazy loading components...\n')

const files = fs.readdirSync(LAZY_DIR)
  .filter(file => file.startsWith('lazy-') && file.endsWith('.tsx'))

let fixedCount = 0

files.forEach(file => {
  const filePath = path.join(LAZY_DIR, file)
  if (fixImportPaths(filePath)) {
    fixedCount++
  }
})

console.log(`\n✨ Fixed ${fixedCount} files!`)