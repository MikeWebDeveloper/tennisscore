'use client'

import { LazyMotion } from 'framer-motion'
import { features } from '@/lib/framer-motion-config'

interface MotionProviderProps {
  children: React.ReactNode
}

export function MotionProvider({ children }: MotionProviderProps) {
  return (
    <LazyMotion features={features} strict>
      {children}
    </LazyMotion>
  )
}