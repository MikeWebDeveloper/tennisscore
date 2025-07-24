'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Smartphone, Wifi, BarChart3, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const PWAOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isStandalone, setIsStandalone] = useState(false)

  const features = [
    {
      icon: <Smartphone className="h-8 w-8 text-primary" />,
      title: "Native App Experience",
      description: "TennisScore now works like a native app with faster loading and smooth animations.",
      color: "from-blue-500/20 to-cyan-500/20"
    },
    {
      icon: <Wifi className="h-8 w-8 text-primary" />,
      title: "Works Offline",
      description: "View your matches, stats, and player data even without an internet connection.",
      color: "from-green-500/20 to-emerald-500/20"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-primary" />,
      title: "Enhanced Performance",
      description: "Experience faster loading times and instant navigation between pages.",
      color: "from-purple-500/20 to-pink-500/20"
    }
  ]

  useEffect(() => {
    const checkPWAStatus = () => {
      // Check if running as PWA
      const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone ||
                        document.referrer.includes('android-app://')
      
      setIsStandalone(standalone)
      
      if (standalone) {
        // Check if this is the first time opening as PWA
        const hasSeenOnboarding = localStorage.getItem('pwa-onboarding-seen')
        if (!hasSeenOnboarding) {
          // Add a small delay to let the app load
          setTimeout(() => setShowOnboarding(true), 1000)
        }
      }
    }

    checkPWAStatus()

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addListener(checkPWAStatus)

    return () => {
      mediaQuery.removeListener(checkPWAStatus)
    }
  }, [])

  const handleNext = () => {
    if (currentStep < features.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  const handleComplete = () => {
    setShowOnboarding(false)
    localStorage.setItem('pwa-onboarding-seen', 'true')
  }

  if (!isStandalone || !showOnboarding) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="p-6 bg-background border-primary/20">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🎾</span>
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Welcome to TennisScore!
              </h2>
              <p className="text-muted-foreground text-sm">
                You&apos;ve successfully installed the app. Here&apos;s what&apos;s new:
              </p>
            </div>

            {/* Feature Showcase */}
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`p-4 rounded-lg bg-gradient-to-br ${features[currentStep].color} border border-primary/10 mb-6`}
            >
              <div className="flex items-start gap-3">
                {features[currentStep].icon}
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {features[currentStep].title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {features[currentStep].description}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Progress Indicators */}
            <div className="flex justify-center gap-2 mb-6">
              {features.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === currentStep 
                      ? 'bg-primary' 
                      : index < currentStep 
                      ? 'bg-primary/60' 
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1"
              >
                Skip
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {currentStep < features.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Get Started
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {/* Step Counter */}
            <div className="text-center mt-4 text-xs text-muted-foreground">
              {currentStep + 1} of {features.length}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PWAOnboarding