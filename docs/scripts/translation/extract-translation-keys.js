#!/usr/bin/env node

/**
 * Comprehensive Translation Key Extraction Tool
 * 
 * Extracts all translation keys used in the codebase and creates:
 * 1. Complete inventory of keys being called
 * 2. Mapping to proper next-intl namespace structure  
 * 3. Missing key identification per locale
 * 4. Restoration plan with priority levels
 */

const fs = require('fs');
const path = require('path');

const TEMP_DIR = './temp_translation_analysis';
const SRC_DIR = './src';

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

// Language configuration
const LOCALES = ['en', 'cs'];
const NAMESPACES = ['admin', 'auth', 'common', 'dashboard', 'match', 'navigation', 'player', 'settings', 'statistics'];

console.log('🔍 Starting comprehensive translation key extraction...\n');

// 1. Extract all translation keys from TypeScript/TSX files
function extractTranslationKeys() {
  console.log('📋 Phase 1: Extracting translation keys from components...');
  
  const keyPattern = /(?:useTranslations\s*\(\s*['"`]([^'"`]+)['"`]\s*\)|t\s*\(\s*['"`]([^'"`]+)['"`])/g;
  const allKeys = new Set();
  const keysByFile = {};
  const keysByNamespace = {};
  
  // Find all .ts and .tsx files (excluding .d.ts)
  function findSourceFiles(dir) {
    const files = [];
    
    function walk(currentDir) {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          walk(fullPath);
        } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx')) && !item.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    }
    
    walk(dir);
    return files;
  }
  
  const sourceFiles = findSourceFiles(SRC_DIR);
  console.log(`   Found ${sourceFiles.length} source files to analyze`);
  
  for (const file of sourceFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const matches = [...content.matchAll(keyPattern)];
      const fileKeys = new Set();
      
      for (const match of matches) {
        // match[1] is namespace from useTranslations, match[2] is key from t()
        const key = match[1] || match[2];
        if (key && key.length > 0) {
          allKeys.add(key);
          fileKeys.add(key);
          
          // Extract namespace
          const namespace = key.includes('.') ? key.split('.')[0] : 'common';
          if (!keysByNamespace[namespace]) {
            keysByNamespace[namespace] = new Set();
          }
          keysByNamespace[namespace].add(key);
        }
      }
      
      if (fileKeys.size > 0) {
        keysByFile[file] = Array.from(fileKeys);
      }
    } catch (error) {
      console.warn(`   ⚠️  Could not read file ${file}: ${error.message}`);
    }
  }
  
  // Write results
  fs.writeFileSync(
    path.join(TEMP_DIR, 'all_translation_keys.txt'),
    Array.from(allKeys).sort().join('\n')
  );
  
  fs.writeFileSync(
    path.join(TEMP_DIR, 'keys_by_file.json'),
    JSON.stringify(keysByFile, null, 2)
  );
  
  // Convert Sets to Arrays for JSON serialization
  const keysByNamespaceArray = {};
  for (const [namespace, keys] of Object.entries(keysByNamespace)) {
    keysByNamespaceArray[namespace] = Array.from(keys).sort();
  }
  
  fs.writeFileSync(
    path.join(TEMP_DIR, 'keys_by_namespace.json'),
    JSON.stringify(keysByNamespaceArray, null, 2)
  );
  
  console.log(`   ✅ Extracted ${allKeys.size} unique translation keys`);
  console.log(`   📊 Distribution by namespace:`);
  for (const [namespace, keys] of Object.entries(keysByNamespaceArray)) {
    console.log(`      ${namespace}: ${keys.length} keys`);
  }
  
  return { allKeys: Array.from(allKeys), keysByNamespace: keysByNamespaceArray };
}

// 2. Load existing translation files
function loadExistingTranslations() {
  console.log('\n📚 Phase 2: Loading existing translation files...');
  
  const existingTranslations = {};
  
  for (const locale of LOCALES) {
    existingTranslations[locale] = {};
    
    for (const namespace of NAMESPACES) {
      const filePath = path.join(SRC_DIR, 'i18n', 'locales', locale, `${namespace}.json`);
      
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const translations = JSON.parse(content);
          existingTranslations[locale][namespace] = translations;
          
          // Count nested keys
          function countKeys(obj, prefix = '') {
            let count = 0;
            for (const [key, value] of Object.entries(obj)) {
              if (typeof value === 'string') {
                count++;
              } else if (typeof value === 'object' && value !== null) {
                count += countKeys(value, `${prefix}${key}.`);
              }
            }
            return count;
          }
          
          const keyCount = countKeys(translations);
          console.log(`   📄 ${locale}/${namespace}.json: ${keyCount} keys`);
        } else {
          console.log(`   ❌ Missing: ${locale}/${namespace}.json`);
          existingTranslations[locale][namespace] = {};
        }
      } catch (error) {
        console.warn(`   ⚠️  Error loading ${locale}/${namespace}.json: ${error.message}`);
        existingTranslations[locale][namespace] = {};
      }
    }
  }
  
  return existingTranslations;
}

// 3. Identify missing keys
function identifyMissingKeys(calledKeys, existingTranslations) {
  console.log('\n🔍 Phase 3: Identifying missing translation keys...');
  
  const missingKeys = {};
  const availableKeys = {};
  
  for (const locale of LOCALES) {
    missingKeys[locale] = {};
    availableKeys[locale] = {};
    
    for (const namespace of NAMESPACES) {
      missingKeys[locale][namespace] = [];
      availableKeys[locale][namespace] = [];
      
      // Get all keys that should be in this namespace
      const namespaceKeys = calledKeys.keysByNamespace[namespace] || [];
      
      for (const fullKey of namespaceKeys) {
        // Remove namespace prefix to get the actual key path
        const keyPath = fullKey.startsWith(`${namespace}.`) 
          ? fullKey.substring(namespace.length + 1)
          : fullKey;
        
        // Check if key exists in translation file
        const exists = checkKeyExists(existingTranslations[locale][namespace], keyPath);
        
        if (exists) {
          availableKeys[locale][namespace].push(fullKey);
        } else {
          missingKeys[locale][namespace].push(fullKey);
        }
      }
    }
  }
  
  // Helper function to check if nested key exists
  function checkKeyExists(obj, keyPath) {
    const keys = keyPath.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return false;
      }
    }
    
    return typeof current === 'string';
  }
  
  // Write results
  fs.writeFileSync(
    path.join(TEMP_DIR, 'missing_keys.json'),
    JSON.stringify(missingKeys, null, 2)
  );
  
  fs.writeFileSync(
    path.join(TEMP_DIR, 'available_keys.json'),
    JSON.stringify(availableKeys, null, 2)
  );
  
  // Summary
  console.log(`   📊 Missing keys summary:`);
  let totalMissing = 0;
  for (const locale of LOCALES) {
    console.log(`   ${locale.toUpperCase()}:`);
    for (const namespace of NAMESPACES) {
      const missing = missingKeys[locale][namespace].length;
      totalMissing += missing;
      if (missing > 0) {
        console.log(`      ${namespace}: ${missing} missing keys`);
      }
    }
  }
  console.log(`   🚨 Total missing keys: ${totalMissing}`);
  
  return { missingKeys, availableKeys };
}

// 4. Create restoration plan
function createRestorationPlan(missingKeys, calledKeys) {
  console.log('\n📋 Phase 4: Creating restoration plan...');
  
  const restorationPlan = {
    metadata: {
      createdAt: new Date().toISOString(),
      totalMissingKeys: 0,
      criticalNamespaces: ['common', 'match', 'navigation', 'auth'],
      supportedLocales: LOCALES
    },
    phases: []
  };
  
  // Calculate total missing keys
  let totalMissing = 0;
  for (const locale of LOCALES) {
    for (const namespace of NAMESPACES) {
      totalMissing += missingKeys[locale][namespace].length;
    }
  }
  restorationPlan.metadata.totalMissingKeys = totalMissing;
  
  // Phase 2: Critical Components (high priority namespaces)
  const criticalNamespaces = ['common', 'match', 'navigation'];
  let criticalKeys = 0;
  for (const locale of LOCALES) {
    for (const namespace of criticalNamespaces) {
      criticalKeys += missingKeys[locale][namespace].length;
    }
  }
  
  restorationPlan.phases.push({
    name: 'PHASE 2: Critical Component Translation Restoration',
    priority: 'HIGH',
    description: 'Restore missing keys for core functionality (common, match, navigation)',
    estimatedKeys: criticalKeys,
    namespaces: criticalNamespaces,
    tasks: criticalNamespaces.map(ns => ({
      namespace: ns,
      missingKeys: {
        en: missingKeys.en[ns].length,
        cs: missingKeys.cs[ns].length
      },
      examples: missingKeys.en[ns].slice(0, 5)
    }))
  });
  
  // Phase 3: Secondary Components
  const secondaryNamespaces = ['statistics', 'player', 'dashboard', 'auth'];
  let secondaryKeys = 0;
  for (const locale of LOCALES) {
    for (const namespace of secondaryNamespaces) {
      secondaryKeys += missingKeys[locale][namespace].length;
    }
  }
  
  restorationPlan.phases.push({
    name: 'PHASE 3: Secondary Component Translation Restoration',
    priority: 'MEDIUM',
    description: 'Restore missing keys for secondary functionality',
    estimatedKeys: secondaryKeys,
    namespaces: secondaryNamespaces,
    tasks: secondaryNamespaces.map(ns => ({
      namespace: ns,
      missingKeys: {
        en: missingKeys.en[ns].length,
        cs: missingKeys.cs[ns].length
      },
      examples: missingKeys.en[ns].slice(0, 5)
    }))
  });
  
  // Write restoration plan
  fs.writeFileSync(
    path.join(TEMP_DIR, 'restoration_plan.json'),
    JSON.stringify(restorationPlan, null, 2)
  );
  
  console.log(`   ✅ Created restoration plan with ${restorationPlan.phases.length} phases`);
  console.log(`   🎯 Critical phase: ${criticalKeys} keys`);
  console.log(`   📊 Secondary phase: ${secondaryKeys} keys`);
  
  return restorationPlan;
}

// 5. Generate summary report
function generateSummaryReport(calledKeys, missingKeys, restorationPlan) {
  console.log('\n📝 Phase 5: Generating summary report...');
  
  const report = `# Translation Key Inventory & Restoration Plan
Generated: ${new Date().toISOString()}

## Overview
- **Total Translation Keys Called**: ${calledKeys.allKeys.length}
- **Total Missing Keys**: ${restorationPlan.metadata.totalMissingKeys}
- **Supported Locales**: ${LOCALES.join(', ')}
- **Namespaces**: ${NAMESPACES.length}

## Key Distribution by Namespace
${Object.entries(calledKeys.keysByNamespace).map(([ns, keys]) => 
  `- **${ns}**: ${keys.length} keys`
).join('\n')}

## Missing Keys Summary

### English (en)
${NAMESPACES.map(ns => 
  `- **${ns}**: ${missingKeys.en[ns].length} missing keys`
).join('\n')}

### Czech (cs)  
${NAMESPACES.map(ns => 
  `- **${ns}**: ${missingKeys.cs[ns].length} missing keys`
).join('\n')}

## Restoration Plan

${restorationPlan.phases.map(phase => `
### ${phase.name}
- **Priority**: ${phase.priority}
- **Estimated Keys**: ${phase.estimatedKeys}
- **Description**: ${phase.description}

${phase.tasks.map(task => `
#### ${task.namespace} Namespace
- English: ${task.missingKeys.en} missing keys
- Czech: ${task.missingKeys.cs} missing keys
- Examples: ${task.examples.join(', ')}
`).join('')}
`).join('')}

## Critical Issues Identified

1. **Common Namespace Gaps**: The common namespace is missing critical UI keys
2. **Match Component Failures**: Live scoring components lack translation keys
3. **Navigation Inconsistencies**: Menu and routing translations incomplete
4. **Legacy System Conflicts**: Previous 8-language system left translation gaps

## Next Steps

1. Execute restoration plan phases in order
2. Test each phase before proceeding
3. Validate translation quality for Czech language
4. Implement translation health monitoring
5. Add automated key validation to build process

---
*This report was generated by the comprehensive translation analysis tool*
`;

  fs.writeFileSync(path.join(TEMP_DIR, 'TRANSLATION_INVENTORY_REPORT.md'), report);
  
  console.log(`   ✅ Generated comprehensive summary report`);
  console.log(`   📁 All analysis files written to: ${TEMP_DIR}/`);
  
  return report;
}

// Main execution
async function main() {
  try {
    const calledKeys = extractTranslationKeys();
    const existingTranslations = loadExistingTranslations();
    const { missingKeys, availableKeys } = identifyMissingKeys(calledKeys, existingTranslations);
    const restorationPlan = createRestorationPlan(missingKeys, calledKeys);
    const report = generateSummaryReport(calledKeys, missingKeys, restorationPlan);
    
    console.log('\n🎉 Translation key inventory extraction completed!');
    console.log(`📊 Key Statistics:`);
    console.log(`   - Total keys called: ${calledKeys.allKeys.length}`);
    console.log(`   - Total missing keys: ${restorationPlan.metadata.totalMissingKeys}`);
    console.log(`   - Coverage: ${((calledKeys.allKeys.length - restorationPlan.metadata.totalMissingKeys) / calledKeys.allKeys.length * 100).toFixed(1)}%`);
    console.log(`\n📁 Analysis files written to: ${TEMP_DIR}/`);
    
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    process.exit(1);
  }
}

main();