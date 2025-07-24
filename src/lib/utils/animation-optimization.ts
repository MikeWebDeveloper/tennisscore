/**
 * Animation Optimization Utilities
 * Provides optimized animation configurations and performance enhancements
 */

import { gsap } from 'gsap'

// Animation performance configuration
export const ANIMATION_CONFIG = {
  // Reduced motion support
  prefersReducedMotion: typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false,
    
  // Performance settings
  performance: {
    force3D: true,
    autoAlpha: true,
    transformOrigin: '50% 50%',
    willChange: 'transform, opacity'
  },
  
  // Optimized easing functions
  easing: {
    smooth: 'power2.out',
    bounce: 'elastic.out(1, 0.3)',
    quick: 'power1.inOut',
    counter: 'power3.out'
  },
  
  // Standard durations
  duration: {
    fast: 0.3,
    normal: 0.6,
    slow: 1.0,
    counter: 1.5
  }
}

/**
 * Create optimized GSAP timeline with performance hints
 */
export const createOptimizedTimeline = (config?: gsap.TimelineVars): gsap.core.Timeline => {
  return gsap.timeline({
    ...config,
    // Add performance optimizations
    onStart: () => {
      // Hint to browser about incoming animations
      if (document.body.style.willChange !== 'transform') {
        document.body.style.willChange = 'transform'
      }
    },
    onComplete: () => {
      // Clean up performance hints
      document.body.style.willChange = 'auto'
    }
  })
}

/**
 * Optimized fade in animation (replaces basic Framer Motion fade)
 */
export const fadeIn = (
  target: gsap.TweenTarget, 
  options: {
    duration?: number
    delay?: number
    y?: number
    stagger?: number
    ease?: string
  } = {}
): gsap.core.Timeline => {
  const {
    duration = ANIMATION_CONFIG.duration.normal,
    delay = 0,
    y = 20,
    stagger = 0,
    ease = ANIMATION_CONFIG.easing.smooth
  } = options

  if (ANIMATION_CONFIG.prefersReducedMotion) {
    gsap.set(target, { opacity: 1, y: 0 })
    return gsap.timeline()
  }

  const tl = createOptimizedTimeline()
  
  // Set initial state with performance optimizations
  tl.set(target, {
    opacity: 0,
    y: y,
    force3D: true,
    transformOrigin: '50% 50%'
  })
  
  // Animate to final state
  tl.to(target, {
    opacity: 1,
    y: 0,
    duration,
    ease,
    stagger,
    delay,
    force3D: true
  })

  return tl
}

/**
 * Optimized stagger animation for card grids
 */
export const staggerCards = (
  targets: gsap.TweenTarget,
  options: {
    duration?: number
    stagger?: number
    y?: number
    scale?: number
    ease?: string
  } = {}
): gsap.core.Timeline => {
  const {
    duration = ANIMATION_CONFIG.duration.normal,
    stagger = 0.1,
    y = 30,
    scale = 0.9,
    ease = ANIMATION_CONFIG.easing.smooth
  } = options

  if (ANIMATION_CONFIG.prefersReducedMotion) {
    gsap.set(targets, { opacity: 1, y: 0, scale: 1 })
    return gsap.timeline()
  }

  const tl = createOptimizedTimeline()
  
  tl.set(targets, {
    opacity: 0,
    y: y,
    scale: scale,
    force3D: true,
    transformOrigin: '50% 50%'
  })
  
  tl.to(targets, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration,
    ease,
    stagger: {
      amount: stagger * (Array.isArray(targets) ? targets.length : 1),
      from: 'start'
    },
    force3D: true
  })

  return tl
}

/**
 * Optimized interactive card hover effects
 */
export const createCardHoverAnimation = (
  target: gsap.TweenTarget,
  type: 'performance' | 'serve' | 'return' | 'shotmaking' | 'insights' = 'performance'
): { 
  enter: () => void
  leave: () => void
  cleanup: () => void
} => {
  let hoverTween: gsap.core.Tween | null = null
  let leaveTween: gsap.core.Tween | null = null

  const animations = {
    performance: {
      scale: 1.02,
      rotationX: 2,
      rotationY: 1,
      z: 10
    },
    serve: {
      scale: 1.03,
      rotationY: 3,
      z: 15
    },
    return: {
      scale: 1.02,
      rotationX: -2,
      rotationY: 2,
      z: 12
    },
    shotmaking: {
      scale: 1.025,
      rotationX: 1,
      rotationY: -2,
      z: 8
    },
    insights: {
      scale: 1.02,
      rotationY: 2,
      z: 10
    }
  }

  const config = animations[type]

  const enter = () => {
    if (ANIMATION_CONFIG.prefersReducedMotion) return
    
    // Kill any existing animations
    if (leaveTween) leaveTween.kill()
    
    hoverTween = gsap.to(target, {
      ...config,
      duration: ANIMATION_CONFIG.duration.fast,
      ease: ANIMATION_CONFIG.easing.smooth,
      force3D: true,
      transformOrigin: '50% 50%'
    })
  }

  const leave = () => {
    if (ANIMATION_CONFIG.prefersReducedMotion) return
    
    // Kill any existing animations
    if (hoverTween) hoverTween.kill()
    
    leaveTween = gsap.to(target, {
      scale: 1,
      rotationX: 0,
      rotationY: 0,
      z: 0,
      duration: ANIMATION_CONFIG.duration.fast,
      ease: ANIMATION_CONFIG.easing.smooth,
      force3D: true
    })
  }

  const cleanup = () => {
    if (hoverTween) hoverTween.kill()
    if (leaveTween) leaveTween.kill()
    gsap.set(target, { clearProps: 'all' })
  }

  return { enter, leave, cleanup }
}

/**
 * Optimized number counting animation
 */
export const animateCounter = (
  target: HTMLElement,
  options: {
    from?: number
    to: number
    duration?: number
    ease?: string
    format?: (value: number) => string
    onUpdate?: (value: number) => void
    onComplete?: () => void
  }
): gsap.core.Tween => {
  const {
    from = 0,
    to,
    duration = ANIMATION_CONFIG.duration.counter,
    ease = ANIMATION_CONFIG.easing.counter,
    format = (value: number) => Math.round(value).toString(),
    onUpdate,
    onComplete
  } = options

  if (ANIMATION_CONFIG.prefersReducedMotion) {
    target.textContent = format(to)
    onUpdate?.(to)
    onComplete?.()
    return gsap.to({}, { duration: 0 })
  }

  const obj = { value: from }
  
  return gsap.to(obj, {
    value: to,
    duration,
    ease,
    onUpdate: () => {
      const currentValue = obj.value
      target.textContent = format(currentValue)
      onUpdate?.(currentValue)
    },
    onComplete
  })
}

/**
 * Performance optimized CSS transforms
 */
export const optimizedTransforms = {
  // Use transform3d to trigger hardware acceleration
  translate3d: (x: number, y: number, z: number = 0) => `translate3d(${x}px, ${y}px, ${z}px)`,
  
  // Optimized scale with Z-axis hint
  scale3d: (scale: number) => `scale3d(${scale}, ${scale}, 1)`,
  
  // Combined transform for better performance
  transformMatrix: (scale: number, x: number, y: number) => 
    `matrix3d(${scale}, 0, 0, 0, 0, ${scale}, 0, 0, 0, 0, 1, 0, ${x}, ${y}, 0, 1)`,
    
  // Will-change hints for upcoming animations
  willChange: {
    transform: 'transform',
    opacity: 'opacity', 
    transformOpacity: 'transform, opacity',
    auto: 'auto'
  }
}

/**
 * Reduced motion detection and handling
 */
export const motionPreference = {
  prefersReduced: ANIMATION_CONFIG.prefersReducedMotion,
  
  // Update preference if it changes
  updatePreference: () => {
    if (typeof window !== 'undefined') {
      ANIMATION_CONFIG.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  },
  
  // Setup listener for preference changes
  watchPreference: (callback?: (prefersReduced: boolean) => void) => {
    if (typeof window === 'undefined') return
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = (e: MediaQueryListEvent) => {
      ANIMATION_CONFIG.prefersReducedMotion = e.matches
      callback?.(e.matches)
    }
    
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }
}

/**
 * Global animation performance settings
 */
export const initializeAnimationOptimizations = (): void => {
  // Set global GSAP defaults for better performance
  gsap.defaults({
    force3D: true,
    transformOrigin: '50% 50%'
  })

  // Set up reduced motion preference watching
  motionPreference.watchPreference()

  // Optimize for mobile devices
  if (typeof window !== 'undefined') {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile) {
      // Reduce animation complexity on mobile
      ANIMATION_CONFIG.duration.fast = 0.2
      ANIMATION_CONFIG.duration.normal = 0.4
      ANIMATION_CONFIG.duration.slow = 0.8
    }
  }
}

export default {
  ANIMATION_CONFIG,
  createOptimizedTimeline,
  fadeIn,
  staggerCards,
  createCardHoverAnimation,
  animateCounter,
  optimizedTransforms,
  motionPreference,
  initializeAnimationOptimizations
}