#!/usr/bin/env node
/**
 * Translation Validation Script
 * Validates translation completeness and consistency across all supported locales
 * 
 * Usage:
 *   npm run validate:translations
 *   node scripts/validate-translations.js
 *   node scripts/validate-translations.js --verbose
 */

const fs = require('fs')
const path = require('path')

// Configuration
const LOCALES_DIR = path.join(__dirname, '../src/i18n/locales')
const SUPPORTED_LOCALES = ['cs', 'en']
const NAMESPACES = ['admin', 'auth', 'common', 'dashboard', 'match', 'navigation', 'player', 'settings', 'statistics']

// Command line flags
const isVerbose = process.argv.includes('--verbose')
const isCI = process.env.CI === 'true'

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
}

function colorize(color, text) {
  return isCI ? text : `${colors[color]}${text}${colors.reset}`
}

function log(message, color = 'reset') {
  console.log(colorize(color, message))
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

/**
 * Load and parse a translation file
 */
function loadTranslationFile(locale, namespace) {
  const filePath = path.join(LOCALES_DIR, locale, `${namespace}.json`)
  
  try {
    if (!fs.existsSync(filePath)) {
      return { error: 'FILE_NOT_FOUND', path: filePath }
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(content)
    
    return { data: parsed, path: filePath }
  } catch (error) {
    return { error: 'PARSE_ERROR', message: error.message, path: filePath }
  }
}

/**
 * Get all translation keys from an object (nested support)
 */
function getAllKeys(obj, prefix = '') {
  const keys = []
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  
  return keys
}

/**
 * Validate individual translation file
 */
function validateTranslationFile(locale, namespace, data) {
  const issues = []
  const keys = getAllKeys(data)
  
  // Check for empty translations
  const emptyKeys = keys.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], data)
    return !value || (typeof value === 'string' && value.trim() === '')
  })
  
  if (emptyKeys.length > 0) {
    issues.push({
      type: 'EMPTY_TRANSLATIONS',
      keys: emptyKeys,
      severity: 'warning'
    })
  }
  
  // Check for placeholder consistency (e.g., {variable} format)
  const placeholderPattern = /\{[^}]+\}/g
  const placeholderIssues = []
  
  keys.forEach(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], data)
    if (typeof value === 'string') {
      const placeholders = value.match(placeholderPattern) || []
      if (placeholders.length > 0) {
        placeholderIssues.push({ key, placeholders })
      }
    }
  })
  
  return {
    keyCount: keys.length,
    issues,
    placeholders: placeholderIssues
  }
}

/**
 * Compare translations between locales
 */
function compareLocales(baseLocale, targetLocale, namespace, baseData, targetData) {
  const baseKeys = new Set(getAllKeys(baseData))
  const targetKeys = new Set(getAllKeys(targetData))
  
  const missingKeys = [...baseKeys].filter(key => !targetKeys.has(key))
  const extraKeys = [...targetKeys].filter(key => !baseKeys.has(key))
  
  // Compare placeholder consistency
  const placeholderMismatches = []
  const placeholderPattern = /\{[^}]+\}/g
  
  baseKeys.forEach(key => {
    if (targetKeys.has(key)) {
      const baseValue = key.split('.').reduce((obj, k) => obj?.[k], baseData)
      const targetValue = key.split('.').reduce((obj, k) => obj?.[k], targetData)
      
      if (typeof baseValue === 'string' && typeof targetValue === 'string') {
        const basePlaceholders = (baseValue.match(placeholderPattern) || []).sort()
        const targetPlaceholders = (targetValue.match(placeholderPattern) || []).sort()
        
        if (JSON.stringify(basePlaceholders) !== JSON.stringify(targetPlaceholders)) {
          placeholderMismatches.push({
            key,
            base: basePlaceholders,
            target: targetPlaceholders
          })
        }
      }
    }
  })
  
  return {
    missingKeys,
    extraKeys,
    placeholderMismatches,
    coverage: targetKeys.size / baseKeys.size
  }
}

/**
 * Main validation function
 */
async function validateTranslations() {
  log(colorize('bold', '🔍 Translation Validation Report\n'))
  
  const results = {
    locales: {},
    comparisons: {},
    summary: {
      totalFiles: 0,
      successfulFiles: 0,
      totalKeys: 0,
      errors: [],
      warnings: []
    }
  }
  
  // Load all translation files
  for (const locale of SUPPORTED_LOCALES) {
    results.locales[locale] = {}
    
    for (const namespace of NAMESPACES) {
      const result = loadTranslationFile(locale, namespace)
      results.summary.totalFiles++
      
      if (result.error) {
        const errorMsg = `${locale}/${namespace}: ${result.error}`
        results.summary.errors.push(errorMsg)
        logError(`Failed to load ${locale}/${namespace}.json: ${result.error}`)
        continue
      }
      
      results.summary.successfulFiles++
      const validation = validateTranslationFile(locale, namespace, result.data)
      
      results.locales[locale][namespace] = {
        ...validation,
        data: result.data
      }
      
      results.summary.totalKeys += validation.keyCount
      
      if (isVerbose) {
        logInfo(`Loaded ${locale}/${namespace}: ${validation.keyCount} keys`)
      }
      
      // Report issues
      validation.issues.forEach(issue => {
        if (issue.severity === 'warning') {
          const warningMsg = `${locale}/${namespace}: ${issue.type} (${issue.keys.length} keys)`
          results.summary.warnings.push(warningMsg)
          if (isVerbose) {
            logWarning(warningMsg)
          }
        }
      })
    }
  }
  
  // Compare locales (use English as base)
  const baseLocale = 'en'
  for (const targetLocale of SUPPORTED_LOCALES) {
    if (targetLocale === baseLocale) continue
    
    results.comparisons[targetLocale] = {}
    
    for (const namespace of NAMESPACES) {
      const baseData = results.locales[baseLocale]?.[namespace]?.data
      const targetData = results.locales[targetLocale]?.[namespace]?.data
      
      if (!baseData || !targetData) continue
      
      const comparison = compareLocales(baseLocale, targetLocale, namespace, baseData, targetData)
      results.comparisons[targetLocale][namespace] = comparison
      
      if (comparison.missingKeys.length > 0) {
        const errorMsg = `${targetLocale}/${namespace}: ${comparison.missingKeys.length} missing keys`
        results.summary.errors.push(errorMsg)
        logError(`${targetLocale}/${namespace}: Missing ${comparison.missingKeys.length} keys`)
        
        if (isVerbose) {
          comparison.missingKeys.forEach(key => {
            log(`  - Missing: ${key}`, 'red')
          })
        }
      }
      
      if (comparison.extraKeys.length > 0) {
        const warningMsg = `${targetLocale}/${namespace}: ${comparison.extraKeys.length} extra keys`
        results.summary.warnings.push(warningMsg)
        logWarning(`${targetLocale}/${namespace}: ${comparison.extraKeys.length} extra keys`)
      }
      
      if (comparison.placeholderMismatches.length > 0) {
        const errorMsg = `${targetLocale}/${namespace}: ${comparison.placeholderMismatches.length} placeholder mismatches`
        results.summary.errors.push(errorMsg)
        logError(`${targetLocale}/${namespace}: ${comparison.placeholderMismatches.length} placeholder mismatches`)
        
        if (isVerbose) {
          comparison.placeholderMismatches.forEach(mismatch => {
            log(`  - ${mismatch.key}: ${JSON.stringify(mismatch.base)} vs ${JSON.stringify(mismatch.target)}`, 'red')
          })
        }
      }
      
      const coverage = Math.round(comparison.coverage * 100)
      if (coverage < 100) {
        logWarning(`${targetLocale}/${namespace}: ${coverage}% translation coverage`)
      } else if (isVerbose) {
        logSuccess(`${targetLocale}/${namespace}: 100% translation coverage`)
      }
    }
  }
  
  // Print summary
  log('\n' + colorize('bold', '📊 Summary:'))
  log(`Total files: ${results.summary.totalFiles}`)
  log(`Successfully loaded: ${results.summary.successfulFiles}`)
  log(`Total translation keys: ${results.summary.totalKeys}`)
  log(`Errors: ${results.summary.errors.length}`, results.summary.errors.length > 0 ? 'red' : 'green')
  log(`Warnings: ${results.summary.warnings.length}`, results.summary.warnings.length > 0 ? 'yellow' : 'green')
  
  if (results.summary.errors.length === 0) {
    logSuccess('\n🎉 All translations are valid!')
    return true
  } else {
    logError(`\n💥 Found ${results.summary.errors.length} translation errors`)
    return false
  }
}

// Run validation
if (require.main === module) {
  validateTranslations()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      logError(`Validation failed: ${error.message}`)
      process.exit(1)
    })
}

module.exports = { validateTranslations }