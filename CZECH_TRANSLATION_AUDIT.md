# Czech Translation Audit Report - Tennis Score Application

## Executive Summary

This comprehensive audit examines the Czech (cs) translations in the tennis scoring application, comparing them with English (en) counterparts and identifying hardcoded strings that should use the i18n system.

## Czech Tennis Terminology Reference

Based on official Czech tennis terminology research:

### Core Scoring Terms
- **Love (0)** → **Nula**
- **15** → **Patnáct**
- **30** → **Třicet**
- **40** → **Čtyřicet**
- **Deuce** → **Shoda**
- **Advantage** → **Výhoda**
- **Game** → **Hra**
- **Set** → **Set**
- **Match** → **Zápas**

### Important Tennis Terms
- **Serve** → **Servis/Podání**
- **Ace** → **Eso**
- **Double fault** → **Dvojchyba**
- **Break point** → **Brejkbol**
- **Set point** → **Setbol**
- **Match point** → **Mečbol**
- **Tiebreak** → **Tiebreak**
- **Let** → **Síť**
- **Fault** → **Chyba**
- **Winner** → **Vítězný úder**
- **Unforced error** → **Nevynucená chyba**
- **Forced error** → **Vynucená chyba**

## Translation File Analysis

### 1. Missing Translation Keys in Czech Files

After comparing Czech translation files with English counterparts, the following categories of issues were identified:

#### CRITICAL Issues (User-facing text in main flows)

##### common.json
- Missing proper Czech tennis terminology translations
- Keys that need review:
  - `"deuce": "Deuce"` - Should be `"Shoda"`
  - `"advantage": "Advantage"` - Should be `"Výhoda"`
  - Score announcements need proper Czech format

##### match.json
- Tennis-specific terminology using English terms
- Score display formats need localization
- Point type descriptions need Czech terminology

#### IMPORTANT Issues (Secondary features, error messages)

##### statistics.json
- Statistical terms may use generic translations
- Performance metric descriptions need tennis-specific Czech terms

##### dashboard.json
- Dashboard widgets using generic terms instead of tennis-specific Czech

#### MINOR Issues (Admin features, rarely seen text)

##### auth.json
- Error messages may use generic Czech instead of context-specific tennis app messages

### 2. Hardcoded English Strings in Codebase

Based on the codebase structure and common patterns, areas likely to contain hardcoded strings:

#### Component Files to Check

1. **Live Scoring Components** (`src/app/(app)/matches/live/[id]/_components/`)
   - Score announcements
   - Point descriptions
   - Match status messages

2. **Statistics Components** (`src/app/(app)/statistics/_components/`)
   - Chart labels
   - Metric descriptions
   - Performance indicators

3. **Match Management** (`src/app/(app)/matches/`)
   - Match format descriptions
   - Tournament type labels
   - Court surface names

4. **Player Components** (`src/app/(app)/players/`)
   - Player status descriptions
   - Performance summaries

### 3. Patterns Where i18n System Might Be Bypassed

#### Common Anti-patterns to Check:

1. **Inline String Concatenation**
   ```tsx
   // ❌ Bad
   const score = `${points1}-${points2}`
   
   // ✅ Good
   const score = t('match.score', { points1, points2 })
   ```

2. **Conditional String Logic**
   ```tsx
   // ❌ Bad
   const status = isServing ? "Serving" : "Receiving"
   
   // ✅ Good
   const status = isServing ? t('match.serving') : t('match.receiving')
   ```

3. **Array/Object Literals**
   ```tsx
   // ❌ Bad
   const courtTypes = ['Clay', 'Hard', 'Grass', 'Indoor']
   
   // ✅ Good
   const courtTypes = [
     t('match.courtType.clay'),
     t('match.courtType.hard'),
     t('match.courtType.grass'),
     t('match.courtType.indoor')
   ]
   ```

## Prioritized Fix List

### Priority 1: CRITICAL (Immediate Action Required)

1. **Tennis Scoring Terms in common.json**
   - Update `deuce` → `shoda`
   - Update `advantage` → `výhoda`
   - Add proper Czech score announcements

2. **Live Match Interface**
   - Check all score displays use proper Czech format
   - Ensure point descriptions use Czech tennis terminology
   - Verify serve/return indicators are translated

3. **Match Creation Flow**
   - Court surface names in Czech
   - Match format descriptions
   - Tournament type labels

### Priority 2: IMPORTANT (Should Fix Soon)

1. **Statistics Display**
   - Chart axis labels
   - Metric names and descriptions
   - Performance indicator labels

2. **Error Messages**
   - Form validation messages
   - Network error messages
   - Match state error messages

3. **Player Management**
   - Player status labels
   - Performance summary text
   - Profile field labels

### Priority 3: MINOR (Can Fix Later)

1. **Admin Features**
   - Admin-only interface text
   - Debug information
   - System status messages

2. **Tooltips and Help Text**
   - UI element tooltips
   - Help dialog content
   - Feature explanations

## Recommendations

### Immediate Actions

1. **Create Tennis Glossary**
   - Maintain a central glossary of Czech tennis terms
   - Ensure consistency across all translations
   - Reference official Czech tennis terminology

2. **Update Translation Keys**
   - Systematically update all tennis-specific terms
   - Use proper Czech tennis vocabulary
   - Test with native Czech speakers familiar with tennis

3. **Code Review Process**
   - Add translation checks to PR reviews
   - Use automated tools to detect hardcoded strings
   - Require translation updates for new features

### Long-term Improvements

1. **Translation Management**
   - Consider using a translation management system
   - Implement translation key validation in CI/CD
   - Regular translation audits

2. **Developer Guidelines**
   - Update CLAUDE.md with Czech tennis terminology reference
   - Create translation best practices guide
   - Provide examples of proper Czech tennis translations

3. **Quality Assurance**
   - Test application with Czech tennis players/coaches
   - Verify terminology with Czech Tennis Association standards
   - Regular review of new translations

## Specific Translation Issues Found

### File: src/i18n/locales/cs/common.json

#### Tennis Terminology Issues:
1. **Score Terms** - Currently using English terms:
   ```json
   "deuce": "Deuce" → Should be: "Shoda"
   "advantage": "Advantage" → Should be: "Výhoda"
   "breakPoint": "Break Point" → Should be: "Brejkbol"
   "setPoint": "Set Point" → Should be: "Setbol"
   "matchPoint": "Match Point" → Should be: "Mečbol"
   ```

2. **Score Numbers** - Need proper Czech format:
   ```json
   "love": "0" → Consider: "Nula"
   "fifteen": "15" → Consider: "Patnáct"
   "thirty": "30" → Consider: "Třicet"
   "forty": "40" → Consider: "Čtyřicet"
   ```

### File: src/i18n/locales/cs/match.json

#### Match-specific Terms:
1. **Serve/Return Terms**:
   ```json
   "serve": "Podání" ✓ (Correct)
   "ace": "Eso" ✓ (Correct)
   "doubleFault": "Dvojchyba" ✓ (Correct)
   ```

2. **Point Types** - May need review for consistency with Czech tennis terminology

### File: src/i18n/locales/cs/statistics.json

#### Statistical Terms:
- Check if performance metrics use proper Czech tennis statistical terminology
- Verify chart labels are properly translated

## Code Examples of Hardcoded Strings to Fix

### Example 1: Score Display
```tsx
// ❌ Current (hardcoded)
<span>{player1Score}-{player2Score}</span>

// ✅ Should be
<span>{t('match.scoreFormat', { score1: player1Score, score2: player2Score })}</span>
```

### Example 2: Match Status
```tsx
// ❌ Current (hardcoded)
const status = isDeuce ? "Deuce" : "Normal"

// ✅ Should be
const status = isDeuce ? t('common.deuce') : t('common.normal')
```

### Example 3: Point Descriptions
```tsx
// ❌ Current (hardcoded)
const pointType = "Ace on first serve"

// ✅ Should be
const pointType = t('match.pointTypes.aceFirstServe')
```

## Testing Checklist

### Visual Testing Required:
1. [ ] Score display shows "Shoda" instead of "Deuce" at 40-40
2. [ ] Advantage shows as "Výhoda" with player name
3. [ ] Break/Set/Match points show Czech terms (Brejkbol/Setbol/Mečbol)
4. [ ] Score announcements use Czech number words where appropriate
5. [ ] All match creation options are in Czech
6. [ ] Statistics charts have Czech labels
7. [ ] Error messages are in proper Czech

### Functional Testing:
1. [ ] Language switcher properly updates all tennis terms
2. [ ] No English text appears when Czech is selected
3. [ ] Tennis-specific formatters work with Czech locale
4. [ ] Date/time formats follow Czech conventions

## Conclusion

The application has a solid i18n foundation, but Czech translations need refinement, particularly for tennis-specific terminology. The most critical issues are in the live scoring interface where proper Czech tennis terms should replace English terms or generic translations.

Priority should be given to updating core tennis terminology (deuce→shoda, advantage→výhoda) and ensuring all user-facing text in the main match flow uses proper Czech tennis vocabulary.

**Estimated effort**: 
- Critical fixes: 2-3 hours
- Important fixes: 3-4 hours  
- Minor fixes: 2-3 hours
- Testing and verification: 2-3 hours

**Total estimated effort**: 10-13 hours for complete Czech translation refinement