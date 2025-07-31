import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { AlertTriangle } from "lucide-react"
import { RefreshCw } from "lucide-react"
import { Home } from "lucide-react"
import { Wifi } from "lucide-react"
import { WifiOff } from "lucide-react"
import { Server } from "lucide-react"
import { Shield } from "lucide-react"
import { Clock } from "lucide-react"
import { ErrorType } from '@/lib/utils/error-handler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  errorType?: ErrorType
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { 
      hasError: true,
      error,
      errorType: this.determineErrorType(error)
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  private static determineErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'NETWORK_ERROR'
    }
    
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return 'AUTHENTICATION_ERROR'
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return 'PERMISSION_ERROR'
    }
    
    if (message.includes('not found') || message.includes('404')) {
      return 'NOT_FOUND_ERROR'
    }
    
    if (message.includes('timeout') || message.includes('aborted')) {
      return 'TIMEOUT_ERROR'
    }
    
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return 'RATE_LIMIT_ERROR'
    }
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'VALIDATION_ERROR'
    }
    
    return 'UNKNOWN_ERROR'
  }

  private getErrorIcon(): ReactNode {
    switch (this.state.errorType) {
      case 'NETWORK_ERROR':
        return <WifiOff className="h-8 w-8 text-red-500" />
      case 'AUTHENTICATION_ERROR':
        return <Shield className="h-8 w-8 text-yellow-500" />
      case 'PERMISSION_ERROR':
        return <Shield className="h-8 w-8 text-orange-500" />
      case 'TIMEOUT_ERROR':
        return <Clock className="h-8 w-8 text-blue-500" />
      case 'RATE_LIMIT_ERROR':
        return <Server className="h-8 w-8 text-purple-500" />
      default:
        return <AlertTriangle className="h-8 w-8 text-red-500" />
    }
  }

  private getErrorTitle(): string {
    switch (this.state.errorType) {
      case 'NETWORK_ERROR':
        return 'Connection Issue'
      case 'AUTHENTICATION_ERROR':
        return 'Authentication Required'
      case 'PERMISSION_ERROR':
        return 'Access Denied'
      case 'NOT_FOUND_ERROR':
        return 'Not Found'
      case 'TIMEOUT_ERROR':
        return 'Request Timeout'
      case 'RATE_LIMIT_ERROR':
        return 'Rate Limit Exceeded'
      case 'VALIDATION_ERROR':
        return 'Invalid Input'
      default:
        return 'Something Went Wrong'
    }
  }

  private getErrorDescription(): string {
    switch (this.state.errorType) {
      case 'NETWORK_ERROR':
        return 'Unable to connect to the server. Please check your internet connection and try again.'
      case 'AUTHENTICATION_ERROR':
        return 'You need to log in to access this feature. Please sign in and try again.'
      case 'PERMISSION_ERROR':
        return 'You don\'t have permission to access this resource. Please contact an administrator.'
      case 'NOT_FOUND_ERROR':
        return 'The requested resource was not found. It may have been moved or deleted.'
      case 'TIMEOUT_ERROR':
        return 'The request took too long to complete. Please try again.'
      case 'RATE_LIMIT_ERROR':
        return 'Too many requests. Please wait a moment and try again.'
      case 'VALIDATION_ERROR':
        return 'The provided information is invalid. Please check your input and try again.'
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.'
    }
  }

  private getActionButtons(): ReactNode {
    const buttons = []

    // Retry button for most errors
    if (this.state.errorType !== 'PERMISSION_ERROR' && this.state.errorType !== 'AUTHENTICATION_ERROR') {
      buttons.push(
        <Button
          key="retry"
          onClick={this.handleRetry}
          className="bg-primary hover:bg-primary/90 text-black font-semibold"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )
    }

    // Home button for navigation errors
    if (this.state.errorType === 'NOT_FOUND_ERROR' || this.state.errorType === 'PERMISSION_ERROR') {
      buttons.push(
        <Button
          key="home"
          onClick={this.handleGoHome}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          <Home className="h-4 w-4 mr-2" />
          Go to Dashboard
        </Button>
      )
    }

    // Login button for auth errors
    if (this.state.errorType === 'AUTHENTICATION_ERROR') {
      buttons.push(
        <Button
          key="login"
          onClick={this.handleLogin}
          className="bg-primary hover:bg-primary/90 text-black font-semibold"
        >
          Sign In
        </Button>
      )
    }

    return (
      <div className="space-y-3">
        {buttons}
      </div>
    )
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  handleLogin = () => {
    window.location.href = '/login'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                {this.getErrorIcon()}
              </div>
              <CardTitle className="text-xl">{this.getErrorTitle()}</CardTitle>
              <CardDescription className="text-slate-400">
                {this.getErrorDescription()}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Connection Status for Network Errors */}
              {this.state.errorType === 'NETWORK_ERROR' && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <Wifi className="h-4 w-4 text-red-500" />
                  <span className="text-red-400">Offline</span>
                </div>
              )}

              {/* Error Details in Development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs text-slate-500">
                  <summary className="cursor-pointer hover:text-slate-400">
                    Error Details (Development)
                  </summary>
                  <pre className="mt-2 p-2 bg-slate-900 rounded text-slate-300 overflow-auto">
                    {this.state.error.message}
                    {this.state.errorInfo && `\n\n${this.state.errorInfo.componentStack}`}
                  </pre>
                </details>
              )}

              {/* Action Buttons */}
              {this.getActionButtons()}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
} 