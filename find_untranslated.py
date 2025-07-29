#!/usr/bin/env python3
import os
import re

# Patterns to search for
patterns = {
    'placeholder': re.compile(r'placeholder="([^"{]+)"'),
    'title': re.compile(r'title="([^"{]+)"'),
    'aria-label': re.compile(r'aria-label="([^"{]+)"'),
    'text_in_jsx': re.compile(r'>([A-Z][a-zA-Z\s]+)<'),
    'translation_keys': re.compile(r'>([a-z]+\.[a-zA-Z]+)<'),
    'button_text': re.compile(r'>(Save|Submit|Cancel|Delete|Edit|Add|Remove|Update|Create|Back|Next|Previous|Close|Open|Search|Filter|Reset|Clear|Confirm|Yes|No|OK|Apply|Select|Choose|Upload|Download|Export|Import|View|Show|Hide|Enable|Disable|Start|Stop|Pause|Resume|Retry|Refresh|Reload|Login|Logout|Sign|Register|Forgot|Remember|Loading|Error|Success|Warning|Info|Help|Settings|Profile|Dashboard|Home|About|Contact|Support|Terms|Privacy|Policy)(<|</)', re.IGNORECASE),
    'error_messages': re.compile(r'>(Error|Failed|Invalid|Required|Must|Cannot|Unable|Please|Try|Again|Sorry|Oops|Something went wrong)[^<]*<', re.IGNORECASE),
    'empty_states': re.compile(r'>(No |None|Empty|Nothing|Not found|No results|No data|No items|No matches|No players|No statistics)[^<]*<', re.IGNORECASE),
}

# Directories to search
search_dirs = ['src/app', 'src/components']

# Extensions to check
extensions = ['.tsx', '.ts', '.jsx', '.js']

# Exclusions
exclude_patterns = [
    'node_modules',
    '.next',
    'dist',
    'build',
    '.git',
    '__tests__',
    '.test.',
    '.spec.',
]

def should_exclude(path):
    for pattern in exclude_patterns:
        if pattern in path:
            return True
    return False

def search_file(filepath):
    issues = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
            
            for i, line in enumerate(lines, 1):
                # Skip import statements and comments
                if 'import' in line or line.strip().startswith('//') or line.strip().startswith('/*'):
                    continue
                
                # Check each pattern
                for pattern_name, pattern in patterns.items():
                    matches = pattern.findall(line)
                    for match in matches:
                        # Filter out false positives
                        if match and not match.startswith('{') and not match.endswith('}'):
                            # Additional filters
                            if pattern_name == 'translation_keys' and any(ext in match for ext in ['.com', '.org', '.json', '.tsx', '.ts', '.js']):
                                continue
                            if len(match.strip()) > 1:  # Ignore single characters
                                issues.append({
                                    'file': filepath,
                                    'line': i,
                                    'type': pattern_name,
                                    'text': match,
                                    'full_line': line.strip()
                                })
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
    
    return issues

def main():
    all_issues = []
    
    for search_dir in search_dirs:
        for root, dirs, files in os.walk(search_dir):
            # Filter out excluded directories
            dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d))]
            
            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    filepath = os.path.join(root, file)
                    if not should_exclude(filepath):
                        issues = search_file(filepath)
                        all_issues.extend(issues)
    
    # Group issues by type
    issues_by_type = {}
    for issue in all_issues:
        issue_type = issue['type']
        if issue_type not in issues_by_type:
            issues_by_type[issue_type] = []
        issues_by_type[issue_type].append(issue)
    
    # Print results
    print("=== Untranslated Strings Found ===\n")
    
    if not all_issues:
        print("No untranslated strings found!")
        return
    
    for issue_type, issues in issues_by_type.items():
        print(f"\n{issue_type.upper()} ({len(issues)} found):")
        print("-" * 80)
        
        # Group by file
        by_file = {}
        for issue in issues:
            if issue['file'] not in by_file:
                by_file[issue['file']] = []
            by_file[issue['file']].append(issue)
        
        for file, file_issues in by_file.items():
            print(f"\n{file}:")
            for issue in file_issues[:5]:  # Limit to 5 per file to avoid clutter
                print(f"  Line {issue['line']}: \"{issue['text']}\"")
                if len(issue['full_line']) < 100:
                    print(f"    Full line: {issue['full_line']}")
            if len(file_issues) > 5:
                print(f"  ... and {len(file_issues) - 5} more")
    
    print(f"\n\nTotal issues found: {len(all_issues)}")
    
    # Summary by file
    files_with_issues = {}
    for issue in all_issues:
        if issue['file'] not in files_with_issues:
            files_with_issues[issue['file']] = 0
        files_with_issues[issue['file']] += 1
    
    print("\nFiles with most issues:")
    sorted_files = sorted(files_with_issues.items(), key=lambda x: x[1], reverse=True)
    for file, count in sorted_files[:10]:
        print(f"  {count:3d} issues: {file}")

if __name__ == "__main__":
    main()