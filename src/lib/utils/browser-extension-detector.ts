/**
 * Browser Extension Detection Utility
 * Helps identify browser extensions that might interfere with React hydration
 */

// Type declaration for Chrome extension API
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        id?: string
      }
    }
  }
}

export interface ExtensionDetection {
  hasInterferingExtensions: boolean
  detectedExtensions: string[]
  recommendedActions: string[]
}

/**
 * Detect browser extensions that commonly interfere with React hydration
 */
export function detectInterferingExtensions(): ExtensionDetection {
  if (typeof window === 'undefined') {
    return {
      hasInterferingExtensions: false,
      detectedExtensions: [],
      recommendedActions: []
    }
  }

  const detectedExtensions: string[] = []
  const recommendedActions: string[] = []

  // Check for common interfering attributes added by extensions
  const interferingAttributes = [
    'bis_skin_checked', // Bitdefender/security extensions
    'data-adblock', // AdBlock extensions
    'data-extension', // Generic extension markers
    'cz-shortcut-listen' // CZ keyboard extensions
  ]

  // Check if any elements have these attributes
  interferingAttributes.forEach(attr => {
    const elements = document.querySelectorAll(`[${attr}]`)
    if (elements.length > 0) {
      detectedExtensions.push(attr)
    }
  })

  // Check for specific extension indicators
  if (window.chrome?.runtime) {
    // Chrome extension environment detected
    if (document.querySelector('[bis_skin_checked]')) {
      detectedExtensions.push('Bitdefender Traffic Light')
      recommendedActions.push('Consider disabling Bitdefender Traffic Light on this domain')
    }
  }

  // Check for modified DOM that might indicate extensions
  const modifiedElements = document.querySelectorAll('[style*="display: none !important"]')
  if (modifiedElements.length > 10) {
    detectedExtensions.push('Ad Blocker (detected many hidden elements)')
    recommendedActions.push('Ad blockers may interfere with the app. Consider allowlisting this domain.')
  }

  return {
    hasInterferingExtensions: detectedExtensions.length > 0,
    detectedExtensions,
    recommendedActions: recommendedActions.length > 0 ? recommendedActions : [
      'If you experience issues, try disabling browser extensions temporarily',
      'Allowlist this domain in your security/ad-blocking extensions'
    ]
  }
}

/**
 * Clean up extension-added attributes from elements to prevent hydration mismatches
 */
export function cleanupExtensionAttributes(element?: Element): void {
  if (typeof window === 'undefined') return

  const targetElement = element || document.body
  const interferingAttributes = [
    'bis_skin_checked',
    'data-adblock',
    'data-extension',
    'cz-shortcut-listen'
  ]

  // Remove interfering attributes from all descendants
  interferingAttributes.forEach(attr => {
    const elements = targetElement.querySelectorAll(`[${attr}]`)
    elements.forEach(el => {
      el.removeAttribute(attr)
    })
  })
}

/**
 * Hook to monitor and handle extension interference
 */
export function useExtensionDetection() {
  if (typeof window === 'undefined') {
    return {
      hasInterferingExtensions: false,
      detectedExtensions: [],
      recommendedActions: []
    }
  }

  const detection = detectInterferingExtensions()

  // Set up a mutation observer to clean up extension attributes
  if (detection.hasInterferingExtensions) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const target = mutation.target as Element
          if (target.hasAttribute('bis_skin_checked')) {
            target.removeAttribute('bis_skin_checked')
          }
        }
      })
    })

    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['bis_skin_checked', 'data-adblock', 'data-extension']
    })

    // Cleanup function
    return {
      ...detection,
      cleanup: () => observer.disconnect()
    }
  }

  return detection
} 