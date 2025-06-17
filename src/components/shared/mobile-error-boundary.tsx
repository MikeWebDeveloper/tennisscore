"use client"

import React, { Component, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, Wifi, WifiOff } from "lucide-react"
import { motion } from "framer-motion"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  retryCount: number
  isOnline: boolean
}

export class MobileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0,
      isOnline: navigator.onLine
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo)
    }
  }

  componentDidMount() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
  }

  handleOnline = () => {
    this.setState({ isOnline: true })
  }

  handleOffline = () => {
    this.setState({ isOnline: false })
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }))
    
    if (this.props.onRetry) {
      this.props.onRetry()
    }
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  getErrorMessage = (): string => {
    if (!this.state.isOnline) {
      return "You're offline. Check your connection and try again."
    }
    
    if (this.state.error?.message.includes('fetch')) {
      return "Unable to connect to the server. Please check your internet connection."
    }
    
    if (this.state.error?.message.includes('ChunkLoadError')) {
      return "The app has been updated. Please refresh to get the latest version."
    }
    
    return this.state.error?.message || "Something went wrong. Please try again."
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
          >
            <Card className="bg-slate-900 border-slate-700 shadow-2xl">
              <CardHeader className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="mx-auto mb-4"
                >
                  {this.state.isOnline ? (
                    <AlertTriangle className="h-16 w-16 text-yellow-500" />
                  ) : (
                    <WifiOff className="h-16 w-16 text-red-500" />
                  )}
                </motion.div>
                <CardTitle className="text-white text-xl">
                  {this.state.isOnline ? "Oops! Something went wrong" : "You're offline"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300 text-center text-sm">
                  {this.getErrorMessage()}
                </p>
                
                {/* Connection Status */}
                <div className="flex items-center justify-center gap-2 text-sm">
                  {this.state.isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  <span className={this.state.isOnline ? "text-green-400" : "text-red-400"}>
                    {this.state.isOnline ? "Connected" : "Offline"}
                  </span>
                </div>

                {/* Retry Count Indicator */}
                {this.state.retryCount > 0 && (
                  <div className="text-center text-xs text-slate-400">
                    Retry attempt: {this.state.retryCount}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={this.handleRetry}
                    className="w-full bg-primary hover:bg-primary/90 text-black font-semibold"
                    disabled={!this.state.isOnline && this.state.error?.message.includes('fetch')}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go to Dashboard
                  </Button>
                </div>

                {/* Error Details in Development */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-4">
                    <summary className="text-xs text-slate-400 cursor-pointer">
                      Error Details (Dev Mode)
                    </summary>
                    <div className="mt-2 p-2 bg-slate-800 rounded text-xs text-slate-300 font-mono overflow-auto max-h-32">
                      {this.state.error.stack}
                    </div>
                  </details>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for error boundaries in functional components
export function useMobileErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = () => setError(null)

  const handleError = (error: Error) => {
    setError(error)
    
    // Haptic feedback for error
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100])
    }
  }

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError }
} 