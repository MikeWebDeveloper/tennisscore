const fs = require('fs');
const path = require('path');

// Patterns to look for
const patterns = {
  translationKeys: />[a-zA-Z]+\.[a-zA-Z]+[^<]*</g,
  placeholders: /placeholder="([^"{]+)"/g,
  titles: /title="([^"{]+)"/g,
  ariaLabels: /aria-label="([^"{]+)"/g,
  buttonText: />(Save|Submit|Cancel|Delete|Edit|Add|Remove|Update|Create|Back|Next|Previous|Close|Open|Search|Filter|Reset|Clear|Confirm|Yes|No|OK|Apply|Select|Choose|Upload|Download|Export|Import|View|Show|Hide|Enable|Disable|Start|Stop|Pause|Resume|Retry|Refresh|Reload|Login|Logout|Sign|Register|Forgot|Remember|Loading|Error|Success|Warning|Info|Help|Settings|Profile|Dashboard|Home|About|Contact|Support|Terms|Privacy|Policy)</g,
  errorMessages: />(Error|Failed|Invalid|Required|Must|Cannot|Unable|Please try|Try again|Sorry|Oops|Something went wrong)[^<]*/g,
  emptyStates: />(No |None|Empty|Nothing|Not found|No results|No data|No items|No matches|No players|No statistics)[^<]*/g,
};

// Directories to search
const searchDirs = ['src/app', 'src/components'];

// File extensions to check
const extensions = ['.tsx', '.ts'];

// Files to skip
const skipPatterns = ['node_modules', '.next', 'dist', 'build', '.git', '__tests__', '.test.', '.spec.'];

function shouldSkip(filePath) {
  return skipPatterns.some(pattern => filePath.includes(pattern));
}

function searchFile(filePath) {
  const issues = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Skip import statements and comments
      if (line.includes('import') || line.trim().startsWith('//') || line.trim().startsWith('/*')) {
        return;
      }
      
      // Check each pattern
      Object.entries(patterns).forEach(([patternName, pattern]) => {
        const matches = [...line.matchAll(pattern)];
        matches.forEach(match => {
          const text = match[1] || match[0];
          // Filter out false positives
          if (text && !text.includes('{') && !text.includes('}') && text.length > 1) {
            if (patternName === 'translationKeys' && 
                (text.includes('.com') || text.includes('.org') || text.includes('.json') || 
                 text.includes('.tsx') || text.includes('.ts') || text.includes('.js'))) {
              return;
            }
            
            issues.push({
              file: filePath,
              line: index + 1,
              type: patternName,
              text: text.trim(),
              fullLine: line.trim()
            });
          }
        });
      });
    });
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
  
  return issues;
}

function searchDirectory(dir) {
  const allIssues = [];
  
  function walk(currentDir) {
    try {
      const files = fs.readdirSync(currentDir);
      
      files.forEach(file => {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !shouldSkip(filePath)) {
          walk(filePath);
        } else if (stat.isFile() && extensions.some(ext => file.endsWith(ext)) && !shouldSkip(filePath)) {
          const issues = searchFile(filePath);
          allIssues.push(...issues);
        }
      });
    } catch (error) {
      console.error(`Error reading directory ${currentDir}:`, error.message);
    }
  }
  
  walk(dir);
  return allIssues;
}

// Main execution
console.log('=== Translation Audit Report ===\n');

const allIssues = [];
searchDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`Searching in ${dir}...`);
    const issues = searchDirectory(dir);
    allIssues.push(...issues);
  }
});

// Group issues by type
const issuesByType = {};
allIssues.forEach(issue => {
  if (!issuesByType[issue.type]) {
    issuesByType[issue.type] = [];
  }
  issuesByType[issue.type].push(issue);
});

// Display results
if (allIssues.length === 0) {
  console.log('\nNo untranslated strings found!');
} else {
  console.log(`\nTotal issues found: ${allIssues.length}\n`);
  
  Object.entries(issuesByType).forEach(([type, issues]) => {
    console.log(`\n${type.toUpperCase()} (${issues.length} found):`);
    console.log('-'.repeat(80));
    
    // Group by file
    const byFile = {};
    issues.forEach(issue => {
      if (!byFile[issue.file]) {
        byFile[issue.file] = [];
      }
      byFile[issue.file].push(issue);
    });
    
    Object.entries(byFile).forEach(([file, fileIssues]) => {
      console.log(`\n${file}:`);
      fileIssues.slice(0, 5).forEach(issue => {
        console.log(`  Line ${issue.line}: "${issue.text}"`);
        if (issue.fullLine.length < 100) {
          console.log(`    ${issue.fullLine}`);
        }
      });
      if (fileIssues.length > 5) {
        console.log(`  ... and ${fileIssues.length - 5} more`);
      }
    });
  });
  
  // Summary by file
  console.log('\n\nFiles with most issues:');
  const fileCount = {};
  allIssues.forEach(issue => {
    fileCount[issue.file] = (fileCount[issue.file] || 0) + 1;
  });
  
  Object.entries(fileCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([file, count]) => {
      console.log(`  ${count} issues: ${file}`);
    });
}