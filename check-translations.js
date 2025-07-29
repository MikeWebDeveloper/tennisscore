const fs = require('fs');
const path = require('path');

const files = [
  'src/app/[locale]/(app)/statistics/_components/clutch-performance.tsx',
  'src/app/[locale]/(app)/statistics/_components/head-to-head-analysis.tsx',
  'src/app/[locale]/(app)/statistics/_components/serve-return-analysis.tsx',
  'src/app/[locale]/(app)/statistics/_components/virtual-matches-list.tsx'
];

// Patterns to find hardcoded English text
const patterns = [
  // Text between > and < (excluding JSX expressions)
  />([A-Z][a-zA-Z\s,\.!?:]+)</g,
  // String literals in quotes that look like UI text
  /["'`]([A-Z][a-zA-Z\s,\.!?:]{2,})["'`]/g,
  // Common UI attributes with English values
  /(?:title|label|placeholder|aria-label)=["'`]([^"'`]+)["'`]/g,
  // Hardcoded messages
  /(?:message|description|error|warning|info):\s*["'`]([^"'`]+)["'`]/g
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`\n=== Checking ${file} ===`);
    
    let foundIssues = false;
    
    patterns.forEach((pattern, index) => {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 0) {
        matches.forEach(match => {
          // Skip common false positives
          if (match[1] && 
              !match[1].match(/^(Loading|Error|Success|Warning|Info)$/) &&
              !match[1].match(/^[A-Z]+$/) && // Skip all caps (likely constants)
              !match[1].includes('{') && // Skip JSX expressions
              !match[1].includes('t(') // Skip translation calls
          ) {
            foundIssues = true;
            const lineNumber = content.substring(0, match.index).split('\n').length;
            console.log(`Line ${lineNumber}: "${match[1]}"`);
          }
        });
      }
    });
    
    if (!foundIssues) {
      console.log('No hardcoded English text found.');
    }
  } catch (error) {
    console.log(`Error reading file: ${error.message}`);
  }
});