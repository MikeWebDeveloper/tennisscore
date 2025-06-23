"use client"

import React, { Component, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cleanupExtensionAttributes } from "@/lib/utils/browser-extension-detector"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class HydrationErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log hydration errors
    console.error('Hydration Error Caught:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Attempt to clean up extension attributes that might be causing issues
    setTimeout(() => {
      cleanupExtensionAttributes()
    }, 100)
  }

  handleRetry = () => {
    // Clean up extension attributes before retry
    cleanupExtensionAttributes()
    
    // Reset the error boundary
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    
    // Force a page reload as last resort
    setTimeout(() => {
      if (this.state.hasError) {
        window.location.reload()
      }
    }, 1000)
  }

  render() {
    if (this.state.hasError) {
      const isHydrationError = this.state.error?.message?.includes('hydration') ||
                              this.state.error?.message?.includes('server') ||
                              this.state.errorInfo?.componentStack?.includes('hydrat')

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-destructive/20 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle className="text-destructive">
                  {isHydrationError ? 'Hydration Error' : 'Application Error'}
                </CardTitle>
              </div>
              <CardDescription>
                {isHydrationError 
                  ? 'The app encountered a hydration mismatch. This is often caused by browser extensions.'
                  : 'Something went wrong. Please try refreshing the page.'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isHydrationError && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <p className="font-medium mb-2">Common causes:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Browser security extensions (Bitdefender, etc.)</li>
                    <li>• Ad blockers modifying page content</li>
                    <li>• Browser developer tools</li>
                  </ul>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Reload Page
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium">Error Details</summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
} 