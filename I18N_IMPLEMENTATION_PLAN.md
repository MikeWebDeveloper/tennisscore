# I18N System Implementation Plan

## Executive Summary

**Critical Issue Identified**: The internationalization system is only loading 1 of 8 required namespaces, causing 87.5% of translations to fail. This is due to an incomplete migration from custom i18n to next-intl.

**Impact**: Users see English fallback text instead of localized content, breaking the multilingual user experience.

**Solution**: Three-phase implementation plan with immediate emergency fix.

## Phase 1: Emergency Fix (Day 1) - CRITICAL ⚡

### Fix 1: Update src/i18n/config.ts

**Current Code (BROKEN)**:
```typescript
return {
  messages: (await import(`./locales/${locale}/common.json`)).default
}
```

**Fixed Code**:
```typescript
return {
  messages: {
    common: (await import(`./locales/${locale}/common.json`)).default,
    auth: (await import(`./locales/${locale}/auth.json`)).default,
    match: (await import(`./locales/${locale}/match.json`)).default,
    dashboard: (await import(`./locales/${locale}/dashboard.json`)).default,
    player: (await import(`./locales/${locale}/player.json`)).default,
    statistics: (await import(`./locales/${locale}/statistics.json`)).default,
    navigation: (await import(`./locales/${locale}/navigation.json`)).default,
    admin: (await import(`./locales/${locale}/admin.json`)).default,
    settings: (await import(`./locales/${locale}/settings.json`)).default,
  }
}
```

### Fix 2: Update src/i18n/routing.ts

Ensure routing only supports available languages:
```typescript
export const routing = defineRouting({
  locales: ['en', 'cs'], // Only 2 languages currently available
  defaultLocale: 'en'
});
```

### Fix 3: Verify middleware.ts

Ensure middleware configuration matches reduced language set.

## Phase 2: Architecture Cleanup (Week 1) - HIGH PRIORITY

### Migration to Standard next-intl Structure

**Option A: Flat Structure (Recommended)**
```
messages/
├── en.json (all namespaces merged)
└── cs.json (all namespaces merged)
```

**Option B: Keep Namespace Files**
```
src/i18n/messages/
├── en/
│   ├── common.json
│   ├── auth.json
│   └── ...other namespaces
└── cs/
    └── ...same structure
```

### Remove Dual Directory System
- Delete `src/i18n/locales/` directory
- Keep only `src/i18n/messages/` or move to root-level `messages/`

## Phase 3: Optimization (Week 2) - MEDIUM PRIORITY

### Consider next-intl-split Plugin
For advanced splitting capabilities while maintaining build-time optimization.

### Implement Static Rendering
Optimize for Next.js 15 static rendering where possible.

## Immediate Action Items

1. **CRITICAL**: Fix config.ts namespace loading (blocks all translations)
2. **HIGH**: Update routing.ts for 2-language support
3. **MEDIUM**: Test all major user flows in both languages
4. **LOW**: Plan architecture migration strategy

## Success Criteria

**Phase 1 Complete When**:
- ✅ All existing translations display correctly
- ✅ No translation loading errors in console
- ✅ Both English and Czech work fully

**Long-term Success**:
- ✅ System follows next-intl best practices
- ✅ Easy to add new languages/namespaces
- ✅ Automated testing for translations

## Risk Assessment

**High Risk**: Not fixing Phase 1 immediately
- **Impact**: Broken user experience in Czech language
- **Mitigation**: Implement config fix within 24 hours

**Medium Risk**: Delayed architecture cleanup
- **Impact**: Increased technical debt, developer confusion
- **Mitigation**: Schedule Phase 2 within one week

**Low Risk**: Optimization delay  
- **Impact**: Suboptimal performance, no user-facing issues
- **Mitigation**: Can be delayed if other priorities emerge

## Resource Requirements

- **Phase 1**: 4 hours (1 senior developer)
- **Phase 2**: 12 hours (1 senior developer + testing)
- **Phase 3**: 10 hours (1 senior developer)
- **Total**: ~26 hours over 2 weeks

## ROI Analysis

**Investment**: 26 hours development time
**Return**: 
- Restored multilingual functionality
- Reduced technical debt
- Improved maintainability
- Better developer experience
- Scalable i18n architecture

**Payback Period**: Immediate for Phase 1, long-term for Phases 2-3