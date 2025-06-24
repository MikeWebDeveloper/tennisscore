"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, X, Crop, Check } from "lucide-react"
import Image from "next/image"
import ReactCrop, { 
  centerCrop, 
  makeAspectCrop, 
  Crop as CropType, 
  PixelCrop 
} from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/hooks/use-translations"

interface ImageUploadProps {
  onFileChange: (file: File | null) => void
  initialImageUrl?: string | null
}



// Simple canvas cropping - avoiding all CORS issues
async function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string = 'cropped-image.jpg'
): Promise<File | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      console.error('Could not get canvas context')
      resolve(null)
      return
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = crop.width
    canvas.height = crop.height

    // Draw the cropped image
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    )

    // Convert to blob with fallback
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], fileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(file)
          } else {
            // Fallback: use dataURL method
            try {
              const dataURL = canvas.toDataURL('image/jpeg', 0.9)
              const arr = dataURL.split(',')
              const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
              const bstr = atob(arr[1])
              let n = bstr.length
              const u8arr = new Uint8Array(n)
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n)
              }
              const blob = new Blob([u8arr], { type: mime })
              const file = new File([blob], fileName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              })
              resolve(file)
            } catch (fallbackError) {
              console.error('Fallback dataURL method failed:', fallbackError)
              resolve(null)
            }
          }
        },
        'image/jpeg',
        0.9
      )
    } catch (error) {
      console.error('Canvas.toBlob threw error:', error)
      resolve(null)
    }
  })
}

export function ImageUpload({
  onFileChange,
  initialImageUrl,
}: ImageUploadProps) {
  const t = useTranslations()
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null)
  const [croppedImageSrc, setCroppedImageSrc] = useState<string | null>(initialImageUrl || null)
  const [crop, setCrop] = useState<CropType>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [showCropper, setShowCropper] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isExternalImage, setIsExternalImage] = useState(!!initialImageUrl)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (file) {
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size cannot exceed 10MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setOriginalImageSrc(reader.result as string)
        setShowCropper(true)
        setCroppedImageSrc(null)
        setIsExternalImage(false)
      }
      reader.onerror = () => {
        console.error('File read failed')
        alert('Failed to read the selected file')
      }
      reader.readAsDataURL(file)
    }
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    
    // Store reference to the image element
    if (e.currentTarget && imageRef.current !== e.currentTarget) {
      imageRef.current = e.currentTarget
    }
    
    // Create a square crop in the center
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80,
        },
        1, // Square aspect ratio
        width,
        height
      ),
      width,
      height
    )
    
    setCrop(crop)
  }, [])

  const handleCropComplete = async () => {
    if (!completedCrop || !imageRef.current) {
      alert('Please make sure to select a crop area before applying.')
      return
    }
    
    setIsProcessing(true)
    
    try {
      const croppedFile = await getCroppedImg(
        imageRef.current,
        completedCrop,
        'profile-picture.jpg'
      )
      
      if (croppedFile) {
        // Create preview URL for the cropped image
        const previewUrl = URL.createObjectURL(croppedFile)
        setCroppedImageSrc(previewUrl)
        setShowCropper(false)
        onFileChange(croppedFile)
      } else {
        alert('Failed to process the cropped image. Please try again.')
      }
    } catch (error) {
      console.error('Error cropping image:', error)
      alert('Error processing image. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelCrop = () => {
    setShowCropper(false)
    setOriginalImageSrc(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleRemoveImage = () => {
    setOriginalImageSrc(null)
    setCroppedImageSrc(null)
    setShowCropper(false)
    setIsExternalImage(false)
    onFileChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleEditCrop = () => {
    if (isExternalImage) {
      // For external images, we can't crop them, so trigger a new upload instead
      if (fileInputRef.current) {
        fileInputRef.current.click()
      }
      return
    }
    if (originalImageSrc) {
      setShowCropper(true)
    }
  }

  const handleReplaceImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        ref={fileInputRef}
        id="image-upload"
      />
      
      {!showCropper ? (
        // Preview/Upload interface
        <div className="relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center overflow-hidden">
          {croppedImageSrc ? (
            <>
              <Image
                src={croppedImageSrc}
                alt="Profile preview"
                fill
                sizes="128px"
                className="rounded-full object-cover"
              />
              <div className="absolute top-0 right-0 flex gap-1">
                {isExternalImage ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="rounded-full h-8 w-8"
                    onClick={handleReplaceImage}
                    title={t('replaceWithNewImage')}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="rounded-full h-8 w-8"
                    onClick={handleEditCrop}
                    title={t('editCrop')}
                  >
                    <Crop className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="rounded-full h-8 w-8"
                  onClick={handleRemoveImage}
                  title={t('removeImage')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <label
              htmlFor="image-upload"
              className="cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 w-full h-full"
            >
              <Upload className="w-8 h-8" />
              <span className="text-xs mt-1">{t('upload')}</span>
            </label>
          )}
        </div>
      ) : (
        // Cropping interface
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border">
            <h3 className="text-lg font-semibold mb-3 text-center">Crop Your Image</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
              Drag to position and resize the crop area to focus on your face
            </p>
            
            <div className="relative h-64 mb-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                className="max-h-64"
              >
                <img
                  ref={imageRef}
                  alt="Crop me"
                  src={originalImageSrc!}
                  className="max-h-64 w-auto mx-auto"
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>

            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelCrop}
                disabled={isProcessing}
              >
                {t('cancel')}
              </Button>
              <Button
                type="button"
                onClick={handleCropComplete}
                disabled={!completedCrop || isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Apply Crop
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!showCropper && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
          {croppedImageSrc 
            ? (isExternalImage 
                ? "Click the upload button to replace this image, or the X to remove it." 
                : "Click the crop button to edit, upload button to replace, or X to remove.")
            : "Upload an image up to 10MB. You'll be able to crop and position it after selection."
          }
        </p>
      )}
    </div>
  )
} 