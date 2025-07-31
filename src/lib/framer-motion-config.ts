/**
 * Centralized Framer Motion configuration
 * Uses LazyMotion for ~90% bundle size reduction
 */

import { domAnimation } from 'framer-motion'

// Export the feature set for LazyMotion
export const features = domAnimation

// Re-export commonly used motion components with lazy loading
export { LazyMotion, m as motion } from 'framer-motion'

// Re-export animation utilities
export { 
  AnimatePresence, 
  useAnimation, 
  useInView, 
  useMotionValue, 
  useTransform,
  useSpring,
  useScroll,
  animate,
  useVelocity,
  useMotionTemplate,
  useReducedMotion,
  useDragControls,
  useAnimationControls
} from 'framer-motion'

// Common animation variants
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export const slideDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0 }
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

// Common transition presets
export const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30
}

export const smoothTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] // Custom easing
}