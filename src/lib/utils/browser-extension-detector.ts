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

  const targetElement = element || document.documentElement
  const interferingAttributes = [
    'bis_skin_checked',
    'data-adblock',
    'data-extension',
    'cz-shortcut-listen'
  ]

  // Remove interfering attributes from all descendants including the target element itself
  interferingAttributes.forEach(attr => {
    // Remove from target element itself
    if (targetElement.hasAttribute(attr)) {
      targetElement.removeAttribute(attr)
    }
    
    // Remove from all descendants
    const elements = targetElement.querySelectorAll(`[${attr}]`)
    elements.forEach(el => {
      el.removeAttribute(attr)
    })
  })

  // Special handling for bis_skin_checked on common problematic elements
  const commonProblematicSelectors = [
    'div', 'html', 'body', 'main', 'section', 'article', 'nav', 'header', 'footer'
  ]
  
  commonProblematicSelectors.forEach(selector => {
    const elements = document.querySelectorAll(`${selector}[bis_skin_checked]`)
    elements.forEach(el => {
      el.removeAttribute('bis_skin_checked')
    })
  })
}

/**
 * Hook to monitor and handle extension interference (simplified to prevent layout jumping)
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

  // Only set up minimal monitoring if extensions are actually interfering
  if (detection.hasInterferingExtensions) {
    let lastCleanup = 0
    const CLEANUP_THROTTLE = 2000 // Only allow cleanup every 2 seconds

    const throttledCleanup = () => {
      const now = Date.now()
      if (now - lastCleanup > CLEANUP_THROTTLE) {
        lastCleanup = now
        // Use requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
          cleanupExtensionAttributes()
        })
      }
    }

    // Much more conservative observer - only for critical hydration issues
    const observer = new MutationObserver((mutations) => {
      let needsCleanup = false
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
          const target = mutation.target as Element
          // Only clean up if it's on critical elements that affect hydration
          if (target.tagName === 'DIV' || target.tagName === 'BODY' || target.tagName === 'HTML') {
            needsCleanup = true
          }
        }
      })

      if (needsCleanup) {
        throttledCleanup()
      }
    })

    // Only observe critical areas
    observer.observe(document.body, {
      attributes: true,
      subtree: false, // Don't observe deep changes
      attributeFilter: ['bis_skin_checked'] // Only the most problematic attribute
    })

    // Cleanup function
    return {
      ...detection,
      cleanup: () => observer.disconnect()
    }
  }

  return detection
} 