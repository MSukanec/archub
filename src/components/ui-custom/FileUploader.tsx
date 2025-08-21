import React, { useRef, useState } from 'react'
import { Upload, X, Image, Video, File } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FileUploaderProps {
  value: File[]
  onChange: (newFiles: File[]) => void
  accept?: string[]
  maxSizeMB?: number
  multiple?: boolean
  className?: string
}

export function FileUploader({
  value = [],
  onChange,
  accept = ["image/*", "video/*"],
  maxSizeMB = 10,
  multiple = true,
  className
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  const handleFiles = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).filter(file => {
      // Check file type
      const isValidType = accept.some(acceptType => {
        if (acceptType.endsWith('/*')) {
          const type = acceptType.slice(0, -2)
          return file.type.startsWith(type)
        }
        return file.type === acceptType
      })

      // Check file size
      const isValidSize = maxSizeMB ? file.size <= maxSizeMB * 1024 * 1024 : true

      return isValidType && isValidSize
    })

    if (multiple) {
      onChange([...value, ...newFiles])
    } else {
      onChange(newFiles.slice(0, 1))
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    const newFiles = value.filter((_, i) => i !== index)
    onChange(newFiles)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    } else if (file.type.startsWith('video/')) {
      return <Video className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          dragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {multiple ? "Arrastra archivos aquí o haz clic para seleccionar" : "Arrastra un archivo aquí o haz clic para seleccionar"}
          </p>
          <p className="text-xs text-muted-foreground">
            {accept.join(", ")} {maxSizeMB && `(máx. ${maxSizeMB}MB)`}
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept.join(",")}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {/* File Preview */}
      {value.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Archivos seleccionados</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {value.map((file, index) => (
              <div key={index} className="relative group">
                <div className="bg-card border rounded-lg p-3 space-y-2">
                  {/* Preview */}
                  {file.type.startsWith('image/') ? (
                    <div className="aspect-square rounded overflow-hidden bg-muted">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square rounded bg-muted flex items-center justify-center">
                      {getFileIcon(file)}
                      <span className="ml-2 text-xs text-muted-foreground">
                        {file.type.startsWith('video/') ? 'VIDEO' : 'ARCHIVO'}
                      </span>
                    </div>
                  )}

                  {/* File Info */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/90 hover:bg-destructive text-destructive-foreground"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}