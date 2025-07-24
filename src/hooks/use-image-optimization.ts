/**
 * Image Optimization Hook
 * Provides comprehensive image optimization features for React components
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  supportsWebP, 
  supportsAVIF, 
  compressImage,
  preloadImages,
  createAppwriteImageUrl,
  generatePlaceholder,
  ImageOptimizationConfig,
  OptimizedImageResult,
  ImageLazyLoader
} from '@/lib/utils/image-optimization'
import { logger } from '@/lib/utils/logger'

export interface UseImageOptimizationConfig extends ImageOptimizationConfig {
  enableFormatDetection?: boolean
  enablePreloading?: boolean
  enableCompression?: boolean
  enableLazyLoading?: boolean
  enablePerformanceMonitoring?: boolean
}

export interface ImageOptimizationState {
  supportsWebP: boolean
  supportsAVIF: boolean
  isLoading: boolean
  error: string | null
  optimizedSources: Map<string, OptimizedImageResult>
  preloadedImages: Set<string>
  compressionProgress: number
}

export const useImageOptimization = (config: UseImageOptimizationConfig = {}) => {
  const [state, setState] = useState<ImageOptimizationState>({
    supportsWebP: false,
    supportsAVIF: false,
    isLoading: false,
    error: null,
    optimizedSources: new Map(),
    preloadedImages: new Set(),
    compressionProgress: 0
  })

  const lazyLoaderRef = useRef<ImageLazyLoader | null>(null)
  const performanceMarks = useRef<Map<string, number>>(new Map())

  // Initialize format detection
  useEffect(() => {
    if (config.enableFormatDetection !== false) {
      const checkFormats = async () => {
        setState(prev => ({ ...prev, isLoading: true }))
        
        try {
          const [webpSupported, avifSupported] = await Promise.all([
            supportsWebP(),
            supportsAVIF()
          ])
          
          setState(prev => ({
            ...prev,
            supportsWebP: webpSupported,
            supportsAVIF: avifSupported,
            isLoading: false
          }))
          
          logger.debug('Format support detected:', { webpSupported, avifSupported })
        } catch (error) {
          setState(prev => ({
            ...prev,
            error: 'Failed to detect format support',
            isLoading: false
          }))
          logger.error('Format detection error:', error)
        }
      }
      
      checkFormats()
    }
  }, [config.enableFormatDetection])

  // Initialize lazy loader
  useEffect(() => {
    if (config.enableLazyLoading !== false) {
      lazyLoaderRef.current = new ImageLazyLoader({
        rootMargin: '50px',
        threshold: 0.1,
        enableWebP: state.supportsWebP
      })
      
      return () => {
        lazyLoaderRef.current?.disconnect()
      }
    }
  }, [config.enableLazyLoading, state.supportsWebP])

  // Optimize image source
  const optimizeImageSource = useCallback((
    src: string,
    options: {
      width?: number
      height?: number
      quality?: number
      format?: 'webp' | 'avif' | 'auto'
      appwriteFileId?: string
    } = {}
  ): OptimizedImageResult => {
    const cacheKey = `${src}-${JSON.stringify(options)}`
    
    // Check cache first
    const cached = state.optimizedSources.get(cacheKey)
    if (cached) {
      return cached
    }

    let optimizedSrc = src
    const format = options.format || 'auto'
    const quality = options.quality || config.quality || 85

    // Handle Appwrite images
    if (options.appwriteFileId) {
      const appwriteConfig = {
        width: options.width,
        height: options.height,
        quality,
        output: format === 'auto' 
          ? (state.supportsAVIF ? 'avif' : state.supportsWebP ? 'webp' : 'jpg')
          : format as 'jpg' | 'png' | 'webp' | 'avif'
      }
      optimizedSrc = createAppwriteImageUrl(options.appwriteFileId, appwriteConfig)
    } else if (format === 'auto' && !src.startsWith('data:')) {
      // Auto-detect best format
      const url = new URL(src, window.location.origin)
      
      if (state.supportsAVIF) {
        url.searchParams.set('f', 'avif')
      } else if (state.supportsWebP) {
        url.searchParams.set('f', 'webp')
      }
      
      url.searchParams.set('q', quality.toString())
      if (options.width) url.searchParams.set('w', options.width.toString())
      if (options.height) url.searchParams.set('h', options.height.toString())
      
      optimizedSrc = url.toString()
    }

    const result: OptimizedImageResult = {
      src: optimizedSrc,
      webpSrc: state.supportsWebP ? optimizedSrc : undefined,
      avifSrc: state.supportsAVIF ? optimizedSrc : undefined,
      width: options.width,
      height: options.height
    }

    // Cache the result
    setState(prev => ({
      ...prev,
      optimizedSources: new Map(prev.optimizedSources.set(cacheKey, result))
    }))

    return result
  }, [state.supportsWebP, state.supportsAVIF, state.optimizedSources, config.quality])

  // Compress image file
  const compressImageFile = useCallback(async (
    file: File,
    options: {
      maxWidth?: number
      maxHeight?: number
      quality?: number
      format?: 'webp' | 'jpeg' | 'png'
      onProgress?: (progress: number) => void
    } = {}
  ): Promise<File> => {
    if (!config.enableCompression) {
      return file
    }

    setState(prev => ({ ...prev, compressionProgress: 0 }))

    try {
      const compressionConfig = {
        maxWidth: options.maxWidth || config.maxWidth || 1920,
        maxHeight: options.maxHeight || config.maxHeight || 1080,
        quality: options.quality || config.quality || 85,
        format: options.format || (state.supportsWebP ? 'webp' : 'jpeg'),
        compressionLevel: config.compressionLevel || 0.85
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          compressionProgress: Math.min(prev.compressionProgress + 10, 90)
        }))
        options.onProgress?.(state.compressionProgress)
      }, 100)

      const compressedFile = await compressImage(file, compressionConfig)
      
      clearInterval(progressInterval)
      setState(prev => ({ ...prev, compressionProgress: 100 }))
      options.onProgress?.(100)

      logger.debug('Image compressed:', {
        original: file.size,
        compressed: compressedFile.size,
        reduction: ((file.size - compressedFile.size) / file.size * 100).toFixed(1) + '%'
      })

      return compressedFile
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Compression failed' }))
      logger.error('Image compression error:', error)
      throw error
    }
  }, [config, state.supportsWebP, state.compressionProgress])

  // Preload critical images
  const preloadCriticalImages = useCallback(async (
    sources: string[],
    options: {
      maxConcurrent?: number
      priority?: 'high' | 'low'
      crossOrigin?: string
    } = {}
  ): Promise<void> => {
    if (!config.enablePreloading) {
      return
    }

    setState(prev => ({ ...prev, isLoading: true }))

    try {
      await preloadImages(sources, {
        maxConcurrent: options.maxConcurrent || 3,
        crossOrigin: options.crossOrigin
      })

      setState(prev => ({
        ...prev,
        preloadedImages: new Set([...prev.preloadedImages, ...sources]),
        isLoading: false
      }))

      logger.debug(`Preloaded ${sources.length} images`)
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Preloading failed',
        isLoading: false
      }))
      logger.error('Image preloading error:', error)
    }
  }, [config.enablePreloading])

  // Lazy load image
  const lazyLoadImage = useCallback((
    element: HTMLImageElement,
    src: string,
    options: {
      onLoad?: () => void
      onError?: (error: Error) => void
    } = {}
  ): void => {
    if (!config.enableLazyLoading || !lazyLoaderRef.current) {
      element.src = src
      return
    }

    // Add performance monitoring
    if (config.enablePerformanceMonitoring) {
      const startTime = performance.now()
      performanceMarks.current.set(src, startTime)
      
      const originalOnLoad = options.onLoad
      options.onLoad = () => {
        const loadTime = performance.now() - startTime
        logger.debug(`Lazy loaded image in ${loadTime.toFixed(2)}ms: ${src}`)
        originalOnLoad?.()
      }
    }

    lazyLoaderRef.current.observe(element, src)
  }, [config.enableLazyLoading, config.enablePerformanceMonitoring])

  // Generate placeholder
  const createPlaceholder = useCallback((
    width: number = 40,
    height: number = 40,
    color: string = '#f3f4f6'
  ): string => {
    return generatePlaceholder(width, height, color)
  }, [])

  // Get performance metrics
  const getPerformanceMetrics = useCallback(() => {
    const metrics = {
      formatSupport: {
        webp: state.supportsWebP,
        avif: state.supportsAVIF
      },
      cacheSize: state.optimizedSources.size,
      preloadedCount: state.preloadedImages.size,
      compressionProgress: state.compressionProgress
    }

    return metrics
  }, [state])

  // Clear cache
  const clearCache = useCallback(() => {
    setState(prev => ({
      ...prev,
      optimizedSources: new Map(),
      preloadedImages: new Set(),
      compressionProgress: 0,
      error: null
    }))
  }, [])

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    supportsWebP: state.supportsWebP,
    supportsAVIF: state.supportsAVIF,
    compressionProgress: state.compressionProgress,
    
    // Methods
    optimizeImageSource,
    compressImageFile,
    preloadCriticalImages,
    lazyLoadImage,
    createPlaceholder,
    getPerformanceMetrics,
    clearCache
  }
}

/**
 * Hook for optimized avatar images
 */
export const useAvatarOptimization = () => {
  const imageOptimization = useImageOptimization({
    enableFormatDetection: true,
    enableCompression: true,
    quality: 90,
    maxWidth: 200,
    maxHeight: 200
  })

  const getAvatarSrc = useCallback((
    fileId: string,
    size: number = 40
  ): OptimizedImageResult => {
    return imageOptimization.optimizeImageSource('', {
      appwriteFileId: fileId,
      width: size * 2, // 2x for retina
      height: size * 2,
      quality: 90,
      format: 'auto'
    })
  }, [imageOptimization])

  return {
    ...imageOptimization,
    getAvatarSrc
  }
}

/**
 * Hook for background image optimization
 */
export const useBackgroundOptimization = () => {
  const imageOptimization = useImageOptimization({
    enableFormatDetection: true,
    enablePreloading: true,
    quality: 75,
    maxWidth: 1920,
    maxHeight: 1080
  })

  const getBackgroundSrc = useCallback((
    src: string,
    viewport: { width: number; height: number }
  ): OptimizedImageResult => {
    return imageOptimization.optimizeImageSource(src, {
      width: viewport.width,
      height: viewport.height,
      quality: 75,
      format: 'auto'
    })
  }, [imageOptimization])

  return {
    ...imageOptimization,
    getBackgroundSrc
  }
}