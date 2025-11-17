'use client'

import { useState, useRef, ReactNode } from 'react'
import clsx from 'clsx'

type DragAndDropProps = {
  children: ReactNode
  onDrop: (files: File[]) => void
  accept?: string
  multiple?: boolean
  className?: string
  disabled?: boolean
}

export default function DragAndDrop({
  children,
  onDrop,
  accept,
  multiple = false,
  className,
  disabled = false
}: DragAndDropProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    if (disabled) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim())
      const filteredFiles = files.filter(file => {
        return acceptedTypes.some(type => {
          if (type.startsWith('.')) {
            return file.name.toLowerCase().endsWith(type.toLowerCase())
          }
          return file.type.match(type.replace('*', '.*'))
        })
      })
      onDrop(filteredFiles)
    } else {
      onDrop(files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onDrop(Array.from(e.target.files))
    }
  }

  return (
    <div
      className={clsx(
        'relative transition-all duration-200',
        isDragging && 'ring-2 ring-secondary-500 ring-offset-2',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}
