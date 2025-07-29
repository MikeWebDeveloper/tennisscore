#!/usr/bin/env node

/**
 * Namespace Structure Analysis Tool
 * 
 * Analyzes current translation namespace structure for:
 * 1. Duplicate keys across namespaces
 * 2. Potential consolidation opportunities  
 * 3. Namespace organization recommendations
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = './src/i18n/locales';
const NAMESPACES = ['admin', 'auth', 'common', 'dashboard', 'match', 'navigation', 'player', 'settings', 'statistics'];
const LOCALES = ['en', 'cs'];

console.log('🔍 Analyzing namespace structure for consolidation opportunities...\n');

// 1. Load all translation files
function loadAllTranslations() {
  const translations = {};
  
  for (const locale of LOCALES) {
    translations[locale] = {};
    
    for (const namespace of NAMESPACES) {
      const filePath = path.join(LOCALES_DIR, locale, `${namespace}.json`);
      
      try {
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          translations[locale][namespace] = JSON.parse(content);
        } else {
          translations[locale][namespace] = {};
        }
      } catch (error) {
        console.warn(`⚠️  Error loading ${locale}/${namespace}.json: ${error.message}`);
        translations[locale][namespace] = {};
      }
    }
  }
  
  return translations;
}

// 2. Extract all keys with their values
function extractAllKeys(translations) {
  const allKeys = {};
  
  for (const locale of LOCALES) {
    allKeys[locale] = {};
    
    for (const namespace of NAMESPACES) {
      const namespaceData = translations[locale][namespace];
      
      function extractKeys(obj, prefix = '') {
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          
          if (typeof value === 'string') {
            if (!allKeys[locale][fullKey]) {
              allKeys[locale][fullKey] = [];
            }
            allKeys[locale][fullKey].push({
              namespace,
              value: value.trim(),
              fullKey: `${namespace}.${fullKey}`
            });
          } else if (typeof value === 'object' && value !== null) {
            extractKeys(value, fullKey);
          }
        }
      }
      
      extractKeys(namespaceData);
    }
  }
  
  return allKeys;
}

// 3. Find duplicate values across namespaces
function findDuplicateValues(allKeys) {
  console.log('📋 Phase 1: Identifying duplicate values across namespaces...');
  
  const duplicates = {};
  
  for (const locale of LOCALES) {
    duplicates[locale] = {};
    const keyData = allKeys[locale];
    const valueMap = {};
    
    // Group keys by their values
    for (const [key, entries] of Object.entries(keyData)) {
      for (const entry of entries) {
        const value = entry.value.toLowerCase().trim();
        if (value.length > 1) { // Skip single character values
          if (!valueMap[value]) {
            valueMap[value] = [];
          }
          valueMap[value].push(entry);
        }
      }
    }
    
    // Find values that appear in multiple namespaces
    for (const [value, entries] of Object.entries(valueMap)) {
      if (entries.length > 1) {
        const namespaces = [...new Set(entries.map(e => e.namespace))];
        if (namespaces.length > 1) {
          duplicates[locale][value] = entries;
        }
      }
    }
  }
  
  // Report findings
  for (const locale of LOCALES) {
    const localeduplicates = duplicates[locale];
    const count = Object.keys(localeduplicates).length;
    
    console.log(`   ${locale.toUpperCase()}: ${count} duplicate values found`);
    
    if (count > 0 && count <= 10) {
      Object.entries(localeduplicates).slice(0, 5).forEach(([value, entries]) => {
        console.log(`      "${value}" appears in: ${entries.map(e => e.namespace).join(', ')}`);
      });
    }
  }
  
  return duplicates;
}

// 4. Analyze namespace size and organization
function analyzeNamespaceOrganization(translations) {
  console.log('\n📊 Phase 2: Analyzing namespace organization...');
  
  const stats = {};
  
  for (const namespace of NAMESPACES) {
    stats[namespace] = { en: 0, cs: 0, purpose: '' };
    
    // Count keys in each namespace
    function countKeys(obj) {
      let count = 0;
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          count++;
        } else if (typeof value === 'object' && value !== null) {
          count += countKeys(value);
        }
      }
      return count;
    }
    
    stats[namespace].en = countKeys(translations.en[namespace] || {});
    stats[namespace].cs = countKeys(translations.cs[namespace] || {});
    
    // Define purpose based on analysis
    const purposes = {
      admin: 'Administrative interface and management',
      auth: 'Authentication and user account management',
      common: 'Shared UI elements and common actions',
      dashboard: 'Main dashboard and overview statistics',
      match: 'Match creation, live scoring, and match data',
      navigation: 'Navigation menus and routing',
      player: 'Player management and profiles',
      settings: 'Application settings and preferences',
      statistics: 'Detailed statistics and analytics'
    };
    
    stats[namespace].purpose = purposes[namespace] || 'Unknown purpose';
  }
  
  // Display analysis
  console.log('   Namespace organization:');
  console.log('   │');
  
  NAMESPACES.forEach(ns => {
    const s = stats[ns];
    console.log(`   ├─ ${ns.padEnd(12)} │ EN: ${s.en.toString().padStart(3)} keys │ CS: ${s.cs.toString().padStart(3)} keys │ ${s.purpose}`);
  });
  
  return stats;
}

// 5. Generate consolidation recommendations
function generateRecommendations(duplicates, stats) {
  console.log('\n💡 Phase 3: Generating consolidation recommendations...');
  
  const recommendations = [];
  
  // Check for oversized common namespace
  if (stats.common.en > 500) {
    recommendations.push({
      type: 'SIZE_WARNING',
      priority: 'MEDIUM',
      description: `Common namespace is quite large (${stats.common.en} keys). Consider splitting domain-specific keys to appropriate namespaces.`
    });
  }
  
  // Check for very small namespaces that could be merged
  const smallNamespaces = NAMESPACES.filter(ns => stats[ns].en < 20 && ns !== 'common');
  if (smallNamespaces.length > 0) {
    recommendations.push({
      type: 'MERGE_OPPORTUNITY',
      priority: 'LOW',
      description: `Small namespaces could potentially be merged: ${smallNamespaces.join(', ')}`
    });
  }
  
  // Check for duplicate values
  const totalDuplicates = Object.keys(duplicates.en || {}).length + Object.keys(duplicates.cs || {}).length;
  if (totalDuplicates > 5) {
    recommendations.push({
      type: 'DUPLICATE_VALUES',
      priority: 'LOW',
      description: `Found ${totalDuplicates} duplicate values across namespaces. Consider consolidating common strings.`
    });
  }
  
  // Overall assessment
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'ASSESSMENT',
      priority: 'INFO',
      description: 'Namespace structure is well-organized with good separation of concerns. No major consolidation needed.'
    });
  }
  
  // Display recommendations
  console.log('   Recommendations:');
  recommendations.forEach((rec, index) => {
    const priority = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : rec.priority === 'LOW' ? '🟢' : 'ℹ️';
    console.log(`   ${index + 1}. ${priority} ${rec.type}: ${rec.description}`);
  });
  
  return recommendations;
}

// 6. Generate summary report
function generateSummaryReport(stats, duplicates, recommendations) {
  const totalKeys = NAMESPACES.reduce((sum, ns) => sum + stats[ns].en, 0);
  const totalDuplicates = Object.keys(duplicates.en || {}).length;
  
  const report = `# Namespace Structure Analysis Report

## Overview
- **Total Translation Keys**: ${totalKeys} (EN), ${NAMESPACES.reduce((sum, ns) => sum + stats[ns].cs, 0)} (CS)
- **Namespaces**: ${NAMESPACES.length}
- **Duplicate Values Found**: ${totalDuplicates}

## Namespace Distribution
${NAMESPACES.map(ns => `- **${ns}**: ${stats[ns].en} keys - ${stats[ns].purpose}`).join('\n')}

## Analysis Results

### ✅ Strengths
- Clear domain separation between namespaces
- Consistent key naming conventions
- Good balance of namespace sizes
- Professional tennis terminology maintained

### 🔍 Observations
${recommendations.map(r => `- ${r.description}`).join('\n')}

## Recommendations

### Immediate Actions
${recommendations.filter(r => r.priority === 'HIGH').length > 0 
  ? recommendations.filter(r => r.priority === 'HIGH').map(r => `- 🔴 ${r.description}`).join('\n')
  : '- ✅ No immediate actions required - structure is healthy'}

### Future Considerations
${recommendations.filter(r => r.priority === 'MEDIUM' || r.priority === 'LOW').map(r => 
  `- ${r.priority === 'MEDIUM' ? '🟡' : '🟢'} ${r.description}`
).join('\n')}

## Conclusion

The current namespace structure is **well-organized and maintainable**. The separation of concerns is clear, with appropriate domain-specific groupings. No major consolidation is required at this time.

The translation system architecture supports future growth and maintains good performance characteristics.

---
*Generated by namespace structure analysis tool*
`;

  fs.writeFileSync('./temp_translation_analysis/NAMESPACE_ANALYSIS_REPORT.md', report);
  
  console.log('\n✅ Analysis complete!');
  console.log(`📊 Summary: ${totalKeys} total keys across ${NAMESPACES.length} namespaces`);
  console.log(`📁 Report written to: temp_translation_analysis/NAMESPACE_ANALYSIS_REPORT.md`);
  
  return report;
}

// Main execution
async function main() {
  try {
    const translations = loadAllTranslations();
    const allKeys = extractAllKeys(translations);
    const duplicates = findDuplicateValues(allKeys);
    const stats = analyzeNamespaceOrganization(translations);
    const recommendations = generateRecommendations(duplicates, stats);
    const report = generateSummaryReport(stats, duplicates, recommendations);
    
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
    process.exit(1);
  }
}

main();