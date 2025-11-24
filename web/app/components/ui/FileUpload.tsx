'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import clsx from 'clsx'
import { Upload, X, File } from 'lucide-react'
import Button from './Button'

type FileWithPreview = File & {
  preview?: string
}

type Props = {
  label?: string
  helpText?: string
  error?: string
  accept?: string
  multiple?: boolean
  maxSize?: number // bytes
  value?: File[]
  onChange?: (files: File[]) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

export default function FileUpload({
  label,
  helpText,
  error,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  value = [],
  onChange,
  onError,
  disabled = false,
  className,
}: Props) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<FileWithPreview[]>(value)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback((file: File): string | null => {
    if (maxSize && file.size > maxSize) {
      return `파일 크기는 ${Math.round(maxSize / 1024 / 1024)}MB를 초과할 수 없습니다.`
    }
    return null
  }, [maxSize])

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      const fileArray = Array.from(fileList)
      const validFiles: FileWithPreview[] = []
      const errors: string[] = []

      fileArray.forEach((file) => {
        const error = validateFile(file)
        if (error) {
          errors.push(`${file.name}: ${error}`)
        } else {
          const fileWithPreview = file as FileWithPreview
          if (file.type.startsWith('image/')) {
            fileWithPreview.preview = URL.createObjectURL(file)
          }
          validFiles.push(fileWithPreview)
        }
      })

      if (errors.length > 0) {
        onError?.(errors.join('\n'))
      }

      const newFiles = multiple ? [...files, ...validFiles] : validFiles
      setFiles(newFiles)
      onChange?.(newFiles)
    },
    [files, multiple, onChange, onError, validateFile]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemove = (index: number) => {
    const fileToRemove = files[index]
    if (fileToRemove && fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }

    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onChange?.(newFiles)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className={clsx('w-full', className)}>
      {label && <div className="mb-1 text-sm text-neutral-700">{label}</div>}
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={clsx(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-neutral-300 hover:border-neutral-400',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-rose-400'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <Upload className={clsx('h-8 w-8', isDragging ? 'text-blue-500' : 'text-neutral-400')} />
          <div className="text-sm text-neutral-600">
            <span className="text-blue-600">클릭하여 업로드</span> 또는 파일을 드래그하세요
          </div>
          {helpText && !error && (
            <div className="text-xs text-neutral-500">{helpText}</div>
          )}
          {error && <div className="text-xs text-rose-600">{error}</div>}
          {maxSize && (
            <div className="text-xs text-neutral-400">
              최대 크기: {Math.round(maxSize / 1024 / 1024)}MB
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="mt-4"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          파일 선택
        </Button>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200"
            >
              {file.preview ? (
                <Image
                  src={file.preview}
                  alt={file.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 object-cover rounded"
                  unoptimized
                />
              ) : (
                <div className="h-12 w-12 flex items-center justify-center bg-neutral-200 rounded">
                  <File className="h-6 w-6 text-neutral-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-700 truncate">
                  {file.name}
                </div>
                <div className="text-xs text-neutral-500">
                  {formatFileSize(file.size)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
