import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['cs', 'en'],
  
  // Used when no locale matches
  defaultLocale: 'cs',
  
  // Always show locale in URL
  localePrefix: 'always'
});