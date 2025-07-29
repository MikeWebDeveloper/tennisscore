'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';

/**
 * Diagnostic component to test if translation system is working
 * Add this component to any page to test translation loading
 */
export function TranslationDiagnostic() {
  const locale = useLocale();
  const t = useTranslations('common');
  
  // Test various translation keys that should exist in common.json
  const testKeys = [
    'save',
    'cancel', 
    'delete',
    'edit',
    'close',
    'loading',
    'error',
    'success'
  ];

  return (
    <div className="p-4 border-2 border-red-500 bg-red-50 rounded-lg">
      <h2 className="text-lg font-bold text-red-700 mb-4">🔧 Translation System Diagnostic</h2>
      
      <div className="mb-4">
        <strong>Current Locale:</strong> {locale}
      </div>

      <div className="mb-4">
        <strong>Translation Test Results:</strong>
        <ul className="list-disc pl-6 mt-2">
          {testKeys.map((key) => {
            try {
              const translation = t(key);
              const isLiteral = translation === `common.${key}` || translation === key;
              
              return (
                <li key={key} className={isLiteral ? 'text-red-600' : 'text-green-600'}>
                  <strong>{key}:</strong> "{translation}" 
                  {isLiteral && ' ❌ (LITERAL KEY - TRANSLATION FAILED)'}
                  {!isLiteral && ' ✅ (WORKING)'}
                </li>
              );
            } catch (error) {
              return (
                <li key={key} className="text-red-600">
                  <strong>{key}:</strong> ERROR - {(error as Error).message}
                </li>
              );
            }
          })}
        </ul>
      </div>

      <div className="text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal pl-6">
          <li>If you see literal keys like "common.save" instead of Czech text, the translation system is broken</li>
          <li>Apply the fixes in FIXED-request.ts and FIXED-next.config.mjs</li>
          <li>Restart your dev server after making changes</li>
          <li>Remove this component once translations are working</li>
        </ol>
      </div>
    </div>
  );
}

// Usage example:
// Add this to any page to test:
// import { TranslationDiagnostic } from './DIAGNOSTIC-TranslationTest';
// 
// export default function TestPage() {
//   return (
//     <div>
//       <TranslationDiagnostic />
//       {/* your other content */}
//     </div>
//   );
// }