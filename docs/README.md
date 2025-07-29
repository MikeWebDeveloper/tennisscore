# Documentation and Analysis Files

This directory contains project documentation, analysis reports, and maintenance tools for the TennisScore application.

## Directory Structure

### 📚 Core Documentation
- `PRD.md` - Product Requirements Document
- `SAD.md` - Software Architecture Document
- `ADVANCED_TENNIS_STATISTICS_GUIDE.md` - Guide for tennis statistics implementation
- `APPWRITE_SETUP.md` - Appwrite backend setup instructions
- `TENNIS_SCORING_SYSTEM.md` - Tennis scoring system documentation
- `IMPLEMENTATION_WORKFLOW.md` - Development workflow guide
- `Frontend.md` - Frontend architecture documentation

### 📸 Screenshots (`screenshots/`)
- Development screenshots for documentation
- Czech localization verification screenshots
- UI component documentation images

### 🔧 Scripts (`scripts/`)
- **`translation/`** - Translation analysis and management tools
  - `analyze-namespace-structure.js` - Analyzes translation namespace organization
  - `extract-clean-translation-keys.js` - Extracts legitimate translation keys
  - `extract-translation-keys.js` - Basic translation key extraction
- **`maintenance/`** - Database and application maintenance scripts
  - Various debugging and data migration scripts
  - Environment variable management tools
  - Database investigation and repair utilities

### 🧪 Testing (`testing/`)
- **`playwright-report/`** - Playwright test execution reports
- **`test-results/`** - Test execution artifacts
- **`visual-*/`** - Visual regression test baselines and results

### 📊 Translation Analysis (`translation-analysis/`)
- Complete translation system analysis reports
- Key extraction and validation results
- Namespace structure analysis
- Translation coverage reports
- Historical translation system evolution

### 🗂️ Legacy (`legacy/`)
- **`spec/`** - Old specification files and tournament data
- `DIAGNOSTIC-TranslationTest.tsx` - Legacy diagnostic components
- Archived experimental files

### ⚙️ Configuration
- `tasks.md` & `tasks 2.md` - Development task tracking (historical)
- `cs.i18n.ts` - Czech localization configuration (legacy)

## Usage

### For Developers
- Refer to architecture documents before making significant changes
- Use translation analysis scripts when modifying i18n system
- Consult testing artifacts when debugging test failures

### For Maintenance
- Use scripts in `scripts/maintenance/` for database operations
- Review translation analysis reports before adding new languages
- Check screenshots for UI consistency verification

## File Lifecycle

- **Active**: Core documentation files that are regularly updated
- **Reference**: Analysis reports and screenshots for historical reference
- **Maintenance**: Scripts that are used periodically for system maintenance
- **Legacy**: Archived files kept for historical context

---

*This documentation structure was organized to maintain project history while keeping the root directory clean and focused on active development files.*