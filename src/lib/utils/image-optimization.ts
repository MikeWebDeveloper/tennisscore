/**
 * Image Optimization Utilities
 * Provides comprehensive image optimization features including:
 * - WebP support with fallbacks
 * - Image compression
 * - Responsive image loading
 * - Image preloading
 * - Lazy loading enhancements
 */

import { logger } from './logger'

export interface ImageOptimizationConfig {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  format?: 'webp' | 'jpeg' | 'png' | 'avif'
  enableWebP?: boolean
  enableLazyLoading?: boolean
  enablePreloading?: boolean
  compressionLevel?: number
}

export interface OptimizedImageResult {
  src: string
  webpSrc?: string
  avifSrc?: string
  srcSet?: string
  sizes?: string
  width?: number
  height?: number
  placeholder?: string
}

// Default configuration
const DEFAULT_CONFIG: ImageOptimizationConfig = {
  quality: 85,
  maxWidth: 1920,
  maxHeight: 1080,
  format: 'webp',
  enableWebP: true,
  enableLazyLoading: true,
  enablePreloading: false,
  compressionLevel: 0.85
}

/**
 * Check if browser supports WebP format
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA=='
  })
}

/**
 * Check if browser supports AVIF format
 */
export const supportsAVIF = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    const avif = new Image()
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2)
    }
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI='
  })
}

/**
 * Create responsive image sources for different screen sizes
 */
export const createResponsiveImageSources = (
  baseSrc: string,
  config: ImageOptimizationConfig = {}
): OptimizedImageResult => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  // For Next.js Image component, we can use the built-in optimization
  if (baseSrc.startsWith('/_next/image')) {
    return {
      src: baseSrc,
      srcSet: `${baseSrc}&w=640 640w, ${baseSrc}&w=1200 1200w, ${baseSrc}&w=1920 1920w`,
      sizes: '(max-width: 640px) 640px, (max-width: 1200px) 1200px, 1920px'
    }
  }

  // For external images or static assets
  const srcSet = [
    `${baseSrc}?w=640&q=${finalConfig.quality} 640w`,
    `${baseSrc}?w=1200&q=${finalConfig.quality} 1200w`,
    `${baseSrc}?w=1920&q=${finalConfig.quality} 1920w`
  ].join(', ')

  const webpSrcSet = finalConfig.enableWebP ? [
    `${baseSrc}?w=640&q=${finalConfig.quality}&f=webp 640w`,
    `${baseSrc}?w=1200&q=${finalConfig.quality}&f=webp 1200w`,
    `${baseSrc}?w=1920&q=${finalConfig.quality}&f=webp 1920w`
  ].join(', ') : undefined

  return {
    src: baseSrc,
    webpSrc: webpSrcSet,
    srcSet,
    sizes: '(max-width: 640px) 640px, (max-width: 1200px) 1200px, 1920px'
  }
}

/**
 * Compress image file on client-side
 */
export const compressImage = (
  file: File,
  config: ImageOptimizationConfig = {}
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      const maxWidth = finalConfig.maxWidth || 1920
      const maxHeight = finalConfig.maxHeight || 1080

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: finalConfig.format === 'webp' ? 'image/webp' : file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        finalConfig.format === 'webp' ? 'image/webp' : file.type,
        finalConfig.compressionLevel
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Preload critical images
 */
export const preloadImage = (src: string, crossOrigin?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = src
    if (crossOrigin) link.crossOrigin = crossOrigin

    link.onload = () => {
      logger.debug(`Image preloaded: ${src}`)
      resolve()
    }
    link.onerror = () => {
      logger.error(`Failed to preload image: ${src}`)
      reject(new Error(`Failed to preload image: ${src}`))
    }

    document.head.appendChild(link)
  })
}

/**
 * Preload multiple images
 */
export const preloadImages = async (
  sources: string[],
  config: { crossOrigin?: string; maxConcurrent?: number } = {}
): Promise<void> => {
  const { crossOrigin, maxConcurrent = 3 } = config
  
  const chunks = []
  for (let i = 0; i < sources.length; i += maxConcurrent) {
    chunks.push(sources.slice(i, i + maxConcurrent))
  }

  for (const chunk of chunks) {
    await Promise.allSettled(
      chunk.map(src => preloadImage(src, crossOrigin))
    )
  }

  logger.debug(`Preloaded ${sources.length} images`)
}

/**
 * Create optimized Appwrite image URL
 */
export const createAppwriteImageUrl = (
  fileId: string,
  config: ImageOptimizationConfig & {
    width?: number
    height?: number
    gravity?: 'center' | 'top' | 'bottom' | 'left' | 'right'
    output?: 'jpg' | 'png' | 'webp' | 'avif'
  } = {}
): string => {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT
  const bucketId = process.env.NEXT_PUBLIC_APPWRITE_PROFILE_PICTURES_BUCKET_ID
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT

  if (!endpoint || !bucketId || !projectId) {
    logger.error('Missing Appwrite configuration for image optimization')
    return ''
  }

  const params = new URLSearchParams({
    project: projectId
  })

  if (config.width) params.append('width', config.width.toString())
  if (config.height) params.append('height', config.height.toString())
  if (config.quality) params.append('quality', config.quality.toString())
  if (config.gravity) params.append('gravity', config.gravity)
  if (config.output) params.append('output', config.output)

  return `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/view?${params.toString()}`
}

/**
 * Generate placeholder blur data URL
 */
export const generatePlaceholder = (
  width: number = 40,
  height: number = 40,
  color: string = '#f3f4f6'
): string => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  canvas.width = width
  canvas.height = height
  
  if (ctx) {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, width, height)
  }
  
  return canvas.toDataURL()
}

/**
 * Intersection Observer for lazy loading
 */
export class ImageLazyLoader {
  private observer: IntersectionObserver | null = null
  private images: Map<HTMLImageElement, string> = new Map()

  constructor(
    private config: {
      rootMargin?: string
      threshold?: number
      enableWebP?: boolean
    } = {}
  ) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          rootMargin: config.rootMargin || '50px',
          threshold: config.threshold || 0.1
        }
      )
    }
  }

  private async handleIntersection(entries: IntersectionObserverEntry[]) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement
        const src = this.images.get(img)
        
        if (src) {
          await this.loadImage(img, src)
          this.observer?.unobserve(img)
          this.images.delete(img)
        }
      }
    }
  }

  private async loadImage(img: HTMLImageElement, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tempImg = new Image()
      tempImg.onload = () => {
        img.src = src
        img.classList.add('loaded')
        resolve()
      }
      tempImg.onerror = reject
      tempImg.src = src
    })
  }

  public observe(img: HTMLImageElement, src: string): void {
    if (!this.observer) {
      // Fallback for browsers without IntersectionObserver
      img.src = src
      return
    }

    this.images.set(img, src)
    this.observer.observe(img)
  }

  public disconnect(): void {
    this.observer?.disconnect()
    this.images.clear()
  }
}

/**
 * Performance monitoring for images
 */
export const monitorImagePerformance = (img: HTMLImageElement, src: string): void => {
  const startTime = performance.now()
  
  const handleLoad = () => {
    const loadTime = performance.now() - startTime
    logger.debug(`Image loaded in ${loadTime.toFixed(2)}ms: ${src}`)
    
    // Report to performance monitoring if available
    if (window.performance && window.performance.mark) {
      window.performance.mark(`image-loaded-${src}`)
    }
    
    cleanup()
  }

  const handleError = () => {
    const errorTime = performance.now() - startTime
    logger.error(`Image failed to load after ${errorTime.toFixed(2)}ms: ${src}`)
    cleanup()
  }

  const cleanup = () => {
    img.removeEventListener('load', handleLoad)
    img.removeEventListener('error', handleError)
  }

  img.addEventListener('load', handleLoad)
  img.addEventListener('error', handleError)
}

/**
 * Image optimization hook for React components
 */
export const useImageOptimization = (config: ImageOptimizationConfig = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
  return {
    createResponsiveImageSources: (src: string) => 
      createResponsiveImageSources(src, finalConfig),
    compressImage: (file: File) => 
      compressImage(file, finalConfig),
    preloadImage,
    preloadImages,
    createAppwriteImageUrl: (fileId: string, imageConfig = {}) => 
      createAppwriteImageUrl(fileId, { ...finalConfig, ...imageConfig }),
    generatePlaceholder,
    monitorImagePerformance
  }
}

// Export singleton lazy loader
export const defaultLazyLoader = new ImageLazyLoader()