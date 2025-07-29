#!/bin/bash

# Search for hardcoded English strings and untranslated content in the tennisscore app

echo "=== Searching for hardcoded English strings in JSX ==="
echo ""

# Search for common hardcoded patterns
echo "1. Searching for placeholder attributes with hardcoded text:"
grep -r 'placeholder="[^{]' src/app src/components 2>/dev/null | grep -v "placeholder=\"\"" || echo "No hardcoded placeholders found"
echo ""

echo "2. Searching for title attributes with hardcoded text:"
grep -r 'title="[^{]' src/app src/components 2>/dev/null | grep -v "title=\"\"" || echo "No hardcoded titles found"
echo ""

echo "3. Searching for aria-label attributes with hardcoded text:"
grep -r 'aria-label="[^{]' src/app src/components 2>/dev/null | grep -v "aria-label=\"\"" || echo "No hardcoded aria-labels found"
echo ""

echo "4. Searching for common button/form text patterns:"
grep -r -E '>(Save|Submit|Cancel|Delete|Edit|Add|Remove|Update|Create|Back|Next|Previous|Close|Open|Search|Filter|Reset|Clear|Confirm|Yes|No|OK|Apply|Select|Choose|Upload|Download|Export|Import|View|Show|Hide|Enable|Disable|Start|Stop|Pause|Resume|Retry|Refresh|Reload|Login|Logout|Sign|Register|Forgot|Remember|Loading|Error|Success|Warning|Info|Help|Settings|Profile|Dashboard|Home|About|Contact|Support|Terms|Privacy|Policy)(<|</)' src/app src/components 2>/dev/null || echo "No common hardcoded button text found"
echo ""

echo "5. Searching for translation keys displayed as text (pattern: word.word):"
grep -r -E '>[a-zA-Z]+\.[a-zA-Z]+[^<]*<' src/app src/components 2>/dev/null | grep -v "\.com" | grep -v "\.org" | grep -v "\.json" | grep -v "\.tsx" | grep -v "\.ts" | grep -v "\.js" || echo "No translation keys found displayed as text"
echo ""

echo "6. Searching for common form labels:"
grep -r -E '>(Name|Email|Password|Username|Phone|Address|City|State|Country|Zip|Code|Date|Time|Message|Comment|Description|Title|Label|Value|Type|Status|Category|Tags|Notes|Required|Optional|Invalid|Valid|Minimum|Maximum|Length|Format|Example)(<|:)' src/app src/components 2>/dev/null || echo "No common form labels found"
echo ""

echo "7. Searching for error messages:"
grep -r -E '>(Error|Failed|Invalid|Required|Must|Cannot|Unable|Please|Try|Again|Sorry|Oops|Something went wrong)[^<]*<' src/app src/components 2>/dev/null || echo "No hardcoded error messages found"
echo ""

echo "8. Searching for status messages:"
grep -r -E '>(Pending|Processing|Complete|Completed|Active|Inactive|Enabled|Disabled|Online|Offline|Available|Unavailable|Connected|Disconnected|Ready|Not ready)[^<]*<' src/app src/components 2>/dev/null || echo "No hardcoded status messages found"
echo ""

echo "9. Searching for empty state messages:"
grep -r -E '>(No |None|Empty|Nothing|Not found|No results|No data|No items|No matches|No players|No statistics)[^<]*<' src/app src/components 2>/dev/null || echo "No hardcoded empty state messages found"
echo ""

echo "10. Searching for tooltips and helper text:"
grep -r -E 'tooltip|hint|helper|tip' src/app src/components 2>/dev/null | grep -E '"[A-Z]|"[a-z]{2,}' || echo "No hardcoded tooltips found"
echo ""

echo "=== Summary ==="
echo "Search complete. Review the results above for any hardcoded strings that need translation."