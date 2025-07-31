#!/usr/bin/env node

/**
 * Lucide React Import Optimizer
 * 
 * This script analyzes and optimizes lucide-react imports for better tree-shaking.
 * Modern bundlers like Webpack 5 and Vite handle lucide-react tree-shaking automatically,
 * but this script helps by:
 * 
 * 1. Converting bulk imports to individual imports for better static analysis
 * 2. Generating a report of all icons used across the project
 * 3. Identifying potential optimizations and unused imports
 * 
 * Example conversion:
 * FROM: import { Home } from "lucide-react"
import { Menu } from "lucide-react"
import { X } from "lucide-react"
import { ChevronDown } from "lucide-react"
 * TO:   import { Home } from "lucide-react"
 *       import { Menu } from "lucide-react"
 *       import { X } from "lucide-react"
 *       import { ChevronDown } from "lucide-react"
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Configuration
const SRC_DIR = path.join(__dirname, '..')
const BACKUP_DIR = path.join(__dirname, '..', 'backup-lucide-optimization')
const LUCIDE_IMPORT_PATTERN = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]lucide-react['"]/g
const MULTI_LINE_LUCIDE_PATTERN = /import\s*\{[^}]*from\s*['"]lucide-react['"]/gs

// Icon name to kebab-case mapping for lucide-react paths
function iconNameToKebabCase(iconName) {
  return iconName
    .trim()
    .replace(/Icon$/, '') // Remove 'Icon' suffix first
    .replace(/([A-Z])/g, (match, letter, index) => {
      return index === 0 ? letter.toLowerCase() : `-${letter.toLowerCase()}`
    })
    .replace(/^\-/, '') // Remove leading dash if any
}

// Get all TypeScript/React files that might contain lucide imports
function findTargetFiles(dir) {
  const files = []
  
  function scanDirectory(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name)
      
      if (entry.isDirectory()) {
        // Skip node_modules and other build directories
        if (!['node_modules', '.next', 'dist', 'build', '.git', 'backup-lucide-optimization'].includes(entry.name)) {
          scanDirectory(fullPath)
        }
      } else if (entry.isFile()) {
        // Include TypeScript and React files
        if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          files.push(fullPath)
        }
      }
    }
  }
  
  scanDirectory(dir)
  return files
}

// Check if file contains lucide-react imports
function hasLucideImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return content.includes('from "lucide-react"') || content.includes("from 'lucide-react'")
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error.message)
    return false
  }
}

// Parse lucide imports from file content (handles multi-line imports)
function parseLucideImports(content) {
  const imports = []
  
  // Updated regex to properly match lucide imports (both single and multi-line)
  const lucideImportRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]lucide-react['"]/gs
  
  const matches = content.matchAll(lucideImportRegex)
  for (const match of matches) {
    const iconNamesText = match[1]
    
    if (iconNamesText) {
      const iconNames = iconNamesText
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0)
      
      imports.push({
        fullMatch: match[0],
        icons: iconNames,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      })
    }
  }
  
  return imports
}

// Generate individual import statements for icons
function generateIndividualImports(icons) {
  // Modern lucide-react supports tree-shaking with individual imports from main package
  return icons.map(iconName => {
    return `import { ${iconName} } from "lucide-react"`
  }).join('\n')
}

// Process a single file
function processFile(filePath) {
  console.log(`Processing: ${path.relative(SRC_DIR, filePath)}`)
  
  let content = fs.readFileSync(filePath, 'utf8')
  const originalContent = content
  
  const lucideImports = parseLucideImports(content)
  
  if (lucideImports.length === 0) {
    console.log(`  ❌ No lucide-react imports found`)
    return { processed: false, iconCount: 0 }
  }
  
  let totalIcons = 0
  let offset = 0
  
  // Process imports in reverse order to maintain correct indices
  for (const importInfo of lucideImports.reverse()) {
    const { fullMatch, icons, startIndex, endIndex } = importInfo
    const adjustedStart = startIndex + offset
    const adjustedEnd = endIndex + offset
    
    console.log(`  📦 Converting ${icons.length} icons: ${icons.join(', ')}`)
    
    const individualImports = generateIndividualImports(icons)
    
    // Replace the import block
    content = content.slice(0, adjustedStart) + individualImports + content.slice(adjustedEnd)
    
    // Update offset for next replacement
    offset += individualImports.length - fullMatch.length
    totalIcons += icons.length
  }
  
  // Only write if content actually changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`  ✅ Optimized ${totalIcons} icon imports`)
    return { processed: true, iconCount: totalIcons }
  } else {
    console.log(`  ❌ No changes needed`)
    return { processed: false, iconCount: 0 }
  }
}

// Create backup of files before modification
function createBackup(files) {
  console.log(`\n📁 Creating backup in: ${BACKUP_DIR}`)
  
  if (fs.existsSync(BACKUP_DIR)) {
    fs.rmSync(BACKUP_DIR, { recursive: true, force: true })
  }
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  
  for (const file of files) {
    const relativePath = path.relative(SRC_DIR, file)
    const backupPath = path.join(BACKUP_DIR, relativePath)
    const backupDir = path.dirname(backupPath)
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }
    
    fs.copyFileSync(file, backupPath)
  }
  
  console.log(`✅ Backed up ${files.length} files`)
}

// Run TypeScript check to verify changes don't break compilation
function runTypeScriptCheck() {
  console.log('\n🔍 Running TypeScript check...')
  
  try {
    // Create a temporary tsconfig that excludes backup directory
    const projectRoot = path.dirname(SRC_DIR)
    const tempTsconfigPath = path.join(projectRoot, 'tsconfig.temp.json')
    const originalTsconfigPath = path.join(projectRoot, 'tsconfig.json')
    
    // Read original tsconfig
    const originalTsconfig = JSON.parse(fs.readFileSync(originalTsconfigPath, 'utf8'))
    
    // Create temp tsconfig with backup exclusion
    const tempTsconfig = {
      ...originalTsconfig,
      exclude: [
        ...(originalTsconfig.exclude || []),
        "**/backup-lucide-optimization/**",
        "src/backup-lucide-optimization/**"
      ]
    }
    
    fs.writeFileSync(tempTsconfigPath, JSON.stringify(tempTsconfig, null, 2))
    
    try {
      // Run tsc with temp config
      execSync(`npx tsc --noEmit --skipLibCheck -p ${tempTsconfigPath}`, { 
        stdio: 'pipe', 
        cwd: projectRoot 
      })
      console.log('✅ TypeScript check passed!')
      return true
    } finally {
      // Clean up temp config
      if (fs.existsSync(tempTsconfigPath)) {
        fs.unlinkSync(tempTsconfigPath)
      }
    }
  } catch (error) {
    console.error('❌ TypeScript check failed:')
    console.error(error.stdout?.toString() || error.message)
    return false
  }
}

// Restore files from backup
function restoreFromBackup(files) {
  console.log('\n🔄 Restoring files from backup...')
  
  for (const file of files) {
    const relativePath = path.relative(SRC_DIR, file)
    const backupPath = path.join(BACKUP_DIR, relativePath)
    
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, file)
    }
  }
  
  console.log('✅ Files restored from backup')
}

// Generate usage report
function generateUsageReport(targetFiles) {
  const iconUsage = new Map()
  const fileIconMap = new Map()
  
  for (const file of targetFiles) {
    const content = fs.readFileSync(file, 'utf8')
    const imports = parseLucideImports(content)
    const fileIcons = []
    
    for (const importInfo of imports) {
      for (const icon of importInfo.icons) {
        iconUsage.set(icon, (iconUsage.get(icon) || 0) + 1)
        fileIcons.push(icon)
      }
    }
    
    if (fileIcons.length > 0) {
      fileIconMap.set(file, fileIcons)
    }
  }
  
  return { iconUsage, fileIconMap }
}

// Display usage report
function displayUsageReport(iconUsage, fileIconMap, targetFiles) {
  console.log('\n📊 Lucide Icons Usage Report')
  console.log('='.repeat(50))
  
  // Most used icons
  const sortedIcons = Array.from(iconUsage.entries()).sort((a, b) => b[1] - a[1])
  console.log(`\n🏆 Most Used Icons (Top 10):`)
  sortedIcons.slice(0, 10).forEach(([icon, count], index) => {
    console.log(`  ${index + 1}. ${icon}: ${count} files`)
  })
  
  // Total statistics
  console.log(`\n📈 Summary:`)
  console.log(`  - Total unique icons used: ${iconUsage.size}`)
  console.log(`  - Total files with lucide imports: ${targetFiles.length}`)
  console.log(`  - Average icons per file: ${(Array.from(iconUsage.values()).reduce((a, b) => a + b, 0) / targetFiles.length).toFixed(1)}`)
  
  // Files with most icons
  const filesSorted = Array.from(fileIconMap.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
  
  console.log(`\n📁 Files with Most Icons:`)
  filesSorted.forEach(([file, icons], index) => {
    const relativePath = path.relative(SRC_DIR, file)
    console.log(`  ${index + 1}. ${relativePath}: ${icons.length} icons`)
  })
}

// Main execution
function main() {
  const args = process.argv.slice(2)
  const reportOnly = args.includes('--report-only') || args.includes('-r')
  
  console.log('🚀 Starting Lucide React Import Analysis\n')
  
  // Find all potential files
  console.log('📂 Scanning for files...')
  const allFiles = findTargetFiles(SRC_DIR)
  console.log(`Found ${allFiles.length} TypeScript/React files`)
  
  // Filter files that actually have lucide imports
  console.log('\n🔍 Filtering files with lucide-react imports...')
  const targetFiles = allFiles.filter(hasLucideImports)
  console.log(`Found ${targetFiles.length} files with lucide-react imports`)
  
  if (targetFiles.length === 0) {
    console.log('✅ No files with lucide-react imports found!')
    return
  }
  
  // Generate and display usage report
  const { iconUsage, fileIconMap } = generateUsageReport(targetFiles)
  displayUsageReport(iconUsage, fileIconMap, targetFiles)
  
  if (reportOnly) {
    console.log('\n📋 Report completed! (Use without --report-only flag to apply optimizations)')
    return
  }
  
  console.log('\n❓ Do you want to proceed with optimization? (Converting to individual imports)')
  console.log('💡 This will convert bulk imports to individual imports for better static analysis.')
  console.log('⚠️  Press Ctrl+C to cancel, or wait 10 seconds to proceed...')
  
  // Wait for user input or timeout
  setTimeout(() => {
    console.log('\n⚡ Proceeding with optimization...')
    
    // Create backup
    createBackup(targetFiles)
    
    // Process files
    console.log('\n⚡ Processing files...')
    let processedCount = 0
    let totalIconsOptimized = 0
    
    for (const file of targetFiles) {
      const result = processFile(file)
      if (result.processed) {
        processedCount++
        totalIconsOptimized += result.iconCount
      }
    }
    
    console.log(`\n📊 Processing complete:`)
    console.log(`  - Files processed: ${processedCount}/${targetFiles.length}`)
    console.log(`  - Total icons optimized: ${totalIconsOptimized}`)
    
    // Verify TypeScript still works
    const typeScriptPassed = runTypeScriptCheck()
    
    if (!typeScriptPassed) {
      console.log('\n⚠️  TypeScript check failed. Restoring backup...')
      restoreFromBackup(targetFiles)
      
      // Re-run TypeScript check to confirm restoration
      console.log('\n🔍 Re-running TypeScript check after restoration...')
      const restoredCheck = runTypeScriptCheck()
      
      if (restoredCheck) {
        console.log('✅ Files successfully restored. TypeScript check passed.')
      } else {
        console.error('❌ Critical error: TypeScript still failing after restoration!')
        process.exit(1)
      }
      
      console.log('\n❌ Optimization aborted due to TypeScript errors.')
      console.log('💡 Modern bundler configuration might be better than individual imports.')
      console.log('💡 Consider configuring your bundler for better tree-shaking instead.')
      process.exit(1)
    }
    
    // Success!
    console.log('\n🎉 Optimization completed successfully!')
    console.log('💡 Benefits:')
    console.log('  - More explicit imports for better static analysis')
    console.log('  - Easier to track individual icon usage')
    console.log('  - Better compatibility with some bundler configurations')
    console.log(`\n📁 Backup available at: ${BACKUP_DIR}`)
    console.log('💡 You can safely delete the backup if everything works correctly.')
  }, 10000)
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = {
  iconNameToKebabCase,
  parseLucideImports,
  generateIndividualImports,
  processFile
}