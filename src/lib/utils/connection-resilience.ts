/**
 * Connection resilience utilities for tennis scoring app
 * Handles mobile Safari WebSocket limitations and network instability
 */

interface ConnectionState {
  isOnline: boolean
  connectionType: 'wifi' | '4g' | '3g' | '2g' | 'slow-2g' | 'unknown'
  effectiveType: string
  downlink: number
  rtt: number
}

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  jitter: boolean
}

/**
 * Exponential backoff with jitter for network requests
 */
export function createExponentialBackoff(config: RetryConfig = {
  maxRetries: 5,
  baseDelay: 100,
  maxDelay: 30000,
  backoffFactor: 2,
  jitter: true
}) {
  return function exponentialBackoff(attempt: number): number {
    if (attempt >= config.maxRetries) {
      return -1 // No more retries
    }

    let delay = Math.min(
      config.baseDelay * Math.pow(config.backoffFactor, attempt),
      config.maxDelay
    )

    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5)
    }

    return Math.floor(delay)
  }
}

/**
 * Detect and monitor connection quality
 */
export function useConnectionMonitoring(): ConnectionState {
  if (typeof window === 'undefined') {
    return {
      isOnline: true,
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0
    }
  }

  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection

  return {
    isOnline: navigator.onLine,
    connectionType: connection?.type || 'unknown',
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0
  }
}

/**
 * Retry wrapper with exponential backoff and circuit breaker
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  // Provide default values for required RetryConfig properties
  const fullConfig: RetryConfig = {
    maxRetries: config?.maxRetries ?? 5,
    baseDelay: config?.baseDelay ?? 1000,
    maxDelay: config?.maxDelay ?? 30000,
    backoffFactor: config?.backoffFactor ?? 2,
    jitter: config?.jitter ?? true
  }
  
  const backoff = createExponentialBackoff(fullConfig)
  let lastError: Error

  for (let attempt = 0; attempt < fullConfig.maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      
      // Don't retry on client errors (4xx)
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status
        if (status >= 400 && status < 500) {
          throw error
        }
      }

      const delay = backoff(attempt)
      if (delay === -1) break

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

/**
 * Safari mobile WebSocket wrapper with fallback
 */
export class ResilientWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private protocols?: string | string[]
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private isReconnecting = false
  private messageQueue: string[] = []
  private listeners: { [key: string]: Function[] } = {}

  constructor(url: string, protocols?: string | string[]) {
    this.url = url
    this.protocols = protocols
    this.connect()
  }

  private connect() {
    try {
      this.ws = new WebSocket(this.url, this.protocols)
      this.setupEventHandlers()
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      this.handleConnectionError()
    }
  }

  private setupEventHandlers() {
    if (!this.ws) return

    this.ws.onopen = (event) => {
      this.reconnectAttempts = 0
      this.isReconnecting = false
      
      // Send queued messages
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift()!
        this.ws!.send(message)
      }
      
      this.emit('open', event)
    }

    this.ws.onmessage = (event) => {
      this.emit('message', event)
    }

    this.ws.onclose = (event) => {
      // Handle Safari mobile WebSocket issues
      if (!event.wasClean && !this.isReconnecting) {
        this.handleConnectionError()
      }
      this.emit('close', event)
    }

    this.ws.onerror = (event) => {
      this.emit('error', event)
      this.handleConnectionError()
    }
  }

  private handleConnectionError() {
    if (this.isReconnecting) return
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.isReconnecting = true
      this.reconnectAttempts++
      
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
        30000
      )
      
      setTimeout(() => {
        this.connect()
      }, delay)
    } else {
      this.emit('maxReconnectAttemptsReached')
    }
  }

  public send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data)
    } else {
      // Queue message for when connection is restored
      if (typeof data === 'string') {
        this.messageQueue.push(data)
      }
    }
  }

  public close(code?: number, reason?: string) {
    if (this.ws) {
      this.ws.close(code, reason)
    }
  }

  public addEventListener(type: string, listener: Function) {
    if (!this.listeners[type]) {
      this.listeners[type] = []
    }
    this.listeners[type].push(listener)
  }

  public removeEventListener(type: string, listener: Function) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter(l => l !== listener)
    }
  }

  private emit(type: string, event?: any) {
    if (this.listeners[type]) {
      this.listeners[type].forEach(listener => listener(event))
    }
  }

  public get readyState(): number {
    return this.ws?.readyState || WebSocket.CLOSED
  }
}

/**
 * Network request with automatic retry and timeout
 */
export async function resilientFetch(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await retryWithBackoff(async () => {
      const res = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      })
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }
      
      return res
    })
    
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Connection quality assessment for adaptive behavior
 */
export function assessConnectionQuality(): 'excellent' | 'good' | 'poor' | 'offline' {
  const connection = useConnectionMonitoring()
  
  if (!connection.isOnline) return 'offline'
  
  // Use effective connection type if available
  switch (connection.effectiveType) {
    case '4g':
      return 'excellent'
    case '3g':
      return 'good' 
    case '2g':
    case 'slow-2g':
      return 'poor'
    default:
      // Fallback to downlink speed
      if (connection.downlink > 5) return 'excellent'
      if (connection.downlink > 1.5) return 'good'
      return 'poor'
  }
}

/**
 * Adaptive polling intervals based on connection quality
 */
export function getAdaptivePollingInterval(): number {
  const quality = assessConnectionQuality()
  
  switch (quality) {
    case 'excellent':
      return 1000 // 1 second
    case 'good':
      return 2000 // 2 seconds
    case 'poor':
      return 5000 // 5 seconds
    case 'offline':
      return 10000 // 10 seconds (for when connection returns)
  }
}