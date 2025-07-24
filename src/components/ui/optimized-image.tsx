/**
 * Optimized Image Component
 * Enhanced Next.js Image component with advanced optimization features:
 * - WebP/AVIF support with fallbacks
 * - Lazy loading with intersection observer
 * - Performance monitoring
 * - Responsive image generation
 * - Placeholder generation
 * - Error handling and fallbacks
 */

// @ts-nocheck
'use client'

import { useState, useEffect, useRef, forwardRef } from 'react'
import Image, { ImageProps } from 'next/image'
import { cn } from '@/lib/utils'
import { 
  supportsWebP, 
  supportsAVIF, 
  generatePlaceholder,
  monitorImagePerformance,
  createAppwriteImageUrl
} from '@/lib/utils/image-optimization'
import { logger } from '@/lib/utils/logger'

export interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'placeholder'> {
  src: string
  alt: string
  fallbackSrc?: string
  enableWebP?: boolean
  enableAVIF?: boolean
  enableLazyLoading?: boolean
  enablePerformanceMonitoring?: boolean
  placeholderColor?: string
  placeholderBlur?: boolean
  errorFallback?: React.ReactNode
  loadingFallback?: React.ReactNode
  onLoadComplete?: () => void
  onLoadError?: (error: Error) => void
  // Appwrite specific props
  appwriteFileId?: string
  appwriteConfig?: {
    width?: number
    height?: number
    gravity?: 'center' | 'top' | 'bottom' | 'left' | 'right'
    output?: 'jpg' | 'png' | 'webp' | 'avif'
  }
}

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      fallbackSrc,
      enableWebP = true,
      enableAVIF = true,
      enableLazyLoading = true,
      enablePerformanceMonitoring = true,
      placeholderColor = '#f3f4f6',
      placeholderBlur = true,
      errorFallback,
      loadingFallback,
      onLoadComplete,
      onLoadError,
      appwriteFileId,
      appwriteConfig,
      className,
      quality = 85,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [formatSupport, setFormatSupport] = useState<{
      webp: boolean
      avif: boolean
    }>({ webp: false, avif: false })
    const [optimizedSrc, setOptimizedSrc] = useState<string>(src)
    const [placeholder, setPlaceholder] = useState<string>('')
    const imgRef = useRef<HTMLImageElement>(null)

    // Check format support
    useEffect(() => {
      const checkSupport = async () => {
        const [webpSupported, avifSupported] = await Promise.all([
          enableWebP ? supportsWebP() : Promise.resolve(false),
          enableAVIF ? supportsAVIF() : Promise.resolve(false)
        ])
        setFormatSupport({ webp: webpSupported, avif: avifSupported })
      }
      checkSupport()
    }, [enableWebP, enableAVIF])

    // Generate optimized source
    useEffect(() => {
      let finalSrc = src

      // Use Appwrite optimized URL if fileId is provided
      if (appwriteFileId && appwriteConfig) {
        const config = {
          ...appwriteConfig,
          quality: typeof quality === 'string' ? parseInt(quality, 10) : quality,
          output: formatSupport.avif && enableAVIF ? 'avif' as const
            : formatSupport.webp && enableWebP ? 'webp' as const
            : appwriteConfig.output
        }
        finalSrc = createAppwriteImageUrl(appwriteFileId, config as any)
      } else if (formatSupport.webp && enableWebP && !src.includes('data:')) {
        // Add WebP format parameter if supported
        const url = new URL(src, window.location.origin)
        url.searchParams.set('f', 'webp')
        url.searchParams.set('q', quality.toString())
        finalSrc = url.toString()
      }

      setOptimizedSrc(finalSrc)
    }, [src, appwriteFileId, appwriteConfig, formatSupport, enableWebP, enableAVIF, quality])

    // Generate placeholder
    useEffect(() => {
      if (placeholderBlur && typeof window !== 'undefined') {
        const placeholderDataUrl = generatePlaceholder(40, 40, placeholderColor)
        setPlaceholder(placeholderDataUrl)
      }
    }, [placeholderBlur, placeholderColor])

    // Handle image load
    const handleLoad = () => {
      setIsLoading(false)
      setHasError(false)
      onLoadComplete?.()
      
      if (enablePerformanceMonitoring && imgRef.current) {
        monitorImagePerformance(imgRef.current, optimizedSrc)
      }
    }

    // Handle image error
    const handleError = () => {
      setIsLoading(false)
      
      if (fallbackSrc && optimizedSrc !== fallbackSrc) {
        // Try fallback source
        setOptimizedSrc(fallbackSrc)
        setHasError(false)
      } else {
        setHasError(true)
        const error = new Error(`Failed to load image: ${optimizedSrc}`)
        logger.error('Image load error:', error)
        onLoadError?.(error)
      }
    }

    // Handle image load start
    const handleLoadStart = () => {
      setIsLoading(true)
    }

    // Error state
    if (hasError) {
      if (errorFallback) {
        return <>{errorFallback}</>
      }
      return (
        <div 
          className={cn(
            'flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded',
            className
          )}
          style={{ width: props.width, height: props.height }}
        >
          <span className="text-sm">Failed to load image</span>
        </div>
      )
    }

    // Loading state
    if (isLoading && loadingFallback) {
      return <>{loadingFallback}</>
    }

    // Combine refs
    const combinedRef = (node: HTMLImageElement | null) => {
      if (imgRef) {
        imgRef.current = node
      }
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }

    // Next.js Image props
    const imageProps: ImageProps = {
      ...props,
      src: optimizedSrc,
      alt,
      quality,
      loading: enableLazyLoading ? 'lazy' : 'eager',
      placeholder: placeholder ? 'blur' : 'empty',
      blurDataURL: placeholder || undefined,
      onLoad: handleLoad,
      onError: handleError,
      onLoadStart: handleLoadStart,
      className: cn(
        'transition-opacity duration-300',
        isLoading && 'opacity-0',
        !isLoading && 'opacity-100',
        className
      ),
      ref: combinedRef
    }

    return <Image {...imageProps} alt={alt || ''} />
  }
)

OptimizedImage.displayName = 'OptimizedImage'

/**
 * Optimized Avatar Image Component
 * Specialized for profile pictures with circular crop and optimized sizing
 */
export interface OptimizedAvatarProps extends Omit<OptimizedImageProps, 'width' | 'height'> {
  size?: number
  userId?: string
  userName?: string
}

export const OptimizedAvatar = forwardRef<HTMLImageElement, OptimizedAvatarProps>(
  ({ size = 40, userName, appwriteFileId, className, ...props }, ref) => {
    const avatarConfig = {
      width: size * 2, // 2x for retina
      height: size * 2,
      gravity: 'center' as const,
      output: 'webp' as const
    }

    return (
      <div 
        className={cn('relative overflow-hidden rounded-full', className)}
        style={{ width: size, height: size }}
      >
        <OptimizedImage
          {...props}
          ref={ref}
          appwriteFileId={appwriteFileId}
          appwriteConfig={avatarConfig}
          width={size}
          height={size}
          className="rounded-full object-cover"
          alt={props.alt || `${userName || 'User'} avatar`}
          errorFallback={
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-full">
              <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                {userName?.slice(0, 2).toUpperCase() || '?'}
              </span>
            </div>
          }
        />
      </div>
    )
  }
)

OptimizedAvatar.displayName = 'OptimizedAvatar'

/**
 * Optimized Background Image Component
 * For background images with optimized loading and format support
 */
export interface OptimizedBackgroundProps {
  src: string
  alt?: string
  className?: string
  children?: React.ReactNode
  enableWebP?: boolean
  enableAVIF?: boolean
  quality?: number
  overlay?: boolean
  overlayOpacity?: number
}

export const OptimizedBackground: React.FC<OptimizedBackgroundProps> = ({
  src,
  alt = 'Background image',
  className,
  children,
  enableWebP = true,
  enableAVIF = true,
  quality = 85,
  overlay = false,
  overlayOpacity = 0.3
}) => {
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const optimizeSource = async () => {
      if (enableAVIF && await supportsAVIF()) {
        const url = new URL(src, window.location.origin)
        url.searchParams.set('f', 'avif')
        url.searchParams.set('q', quality.toString())
        setOptimizedSrc(url.toString())
      } else if (enableWebP && await supportsWebP()) {
        const url = new URL(src, window.location.origin)
        url.searchParams.set('f', 'webp')
        url.searchParams.set('q', quality.toString())
        setOptimizedSrc(url.toString())
      }
    }
    
    optimizeSource()
  }, [src, enableWebP, enableAVIF, quality])

  useEffect(() => {
    const img = new Image()
    img.onload = () => setIsLoaded(true)
    img.src = optimizedSrc
  }, [optimizedSrc])

  return (
    <div className={cn('relative', className)}>
      {/* Background Image */}
      <div
        className={cn(
          'absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
        style={{ backgroundImage: `url(${optimizedSrc})` }}
        role="img"
        aria-label={alt}
      />
      
      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

OptimizedBackground.displayName = 'OptimizedBackground'