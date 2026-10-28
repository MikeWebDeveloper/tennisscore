'use client'

import { LazyMotion, MotionConfig } from 'framer-motion'
import { features } from '@/lib/framer-motion-config'

interface MotionProviderProps {
  children: React.ReactNode
}

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={features} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  )
}
