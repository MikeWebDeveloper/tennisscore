"use client"

import { LanguageSwitcher } from "./language-switcher"

/**
 * Demo component showing different variants of the LanguageSwitcher
 * This file can be removed - it's for demonstration purposes only
 */
export function LanguageSwitcherDemo() {
  return (
    <div className="space-y-8 p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Language Switcher Variants</h2>
      
      {/* Dropdown variant (default) */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Dropdown Variant</h3>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher variant="dropdown" size="sm" />
          <LanguageSwitcher variant="dropdown" size="md" />
          <LanguageSwitcher variant="dropdown" size="lg" />
        </div>
      </div>

      {/* Select variant */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Select Variant</h3>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher variant="select" size="sm" />
          <LanguageSwitcher variant="select" size="md" />
        </div>
      </div>

      {/* Compact variant */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Compact Variant</h3>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher variant="compact" size="sm" />
          <LanguageSwitcher variant="compact" size="md" />
        </div>
      </div>

      {/* Configuration options */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Configuration Options</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-4">
            <span className="text-sm w-32">With native names:</span>
            <LanguageSwitcher variant="dropdown" showNativeNames={true} />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm w-32">English names only:</span>
            <LanguageSwitcher variant="dropdown" showNativeNames={false} />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm w-32">Without flags:</span>
            <LanguageSwitcher variant="dropdown" showFlags={false} />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm w-32">No flags, no native:</span>
            <LanguageSwitcher variant="dropdown" showFlags={false} showNativeNames={false} />
          </div>
        </div>
      </div>
    </div>
  )
}