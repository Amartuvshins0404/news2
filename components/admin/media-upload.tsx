"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { useTranslations } from "@/lib/i18n/use-translations"
import { validateFileUpload } from "@/lib/sanitize"
import type { MediaFile } from "@/lib/types"
import { Upload } from "lucide-react"
import { useRef, useState } from "react"

interface MediaUploadProps {
  onUploadComplete: (file: MediaFile) => void
}

export function MediaUpload({ onUploadComplete }: MediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { t } = useTranslations("admin")

  const handleFile = async (file: File) => {
    const validation = validateFileUpload(file)
    if (!validation.valid) {
      const sizeLimit = 15 * 1024 * 1024
      const description =
        file.size > sizeLimit ? t("media.error.fileTooLarge") : t("media.error.invalidFile")
      toast({
        title: t("media.error.invalidFileTitle"),
        description,
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const uploadedFile = await apiClient.uploadMedia(file)
      toast({
        title: t("media.success.uploaded"),
        description: t("media.success.uploadedDescription", { filename: file.name }),
      })
      onUploadComplete(uploadedFile)
    } catch (error) {
      toast({
        title: t("media.error.uploadFailedTitle"),
        description: error instanceof Error ? error.message : t("media.error.uploadFailed"),
        variant: "destructive",
      })
    } finally {
      setUploading(false)
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <Card
      className={`border-2 border-dashed p-8 text-center transition-colors ${
        dragActive ? "border-primary bg-accent" : "border-muted-foreground/25"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        disabled={uploading}
      />

      <div className="flex flex-col items-center gap-4">
        <div className="rounded-full bg-primary/10 p-4">
          <Upload className="h-8 w-8 text-primary" />
        </div>

        <div>
          <p className="font-medium mb-1">
            {uploading ? t("media.status.uploading") : t("media.uploadPrompt")}
          </p>
          <p className="text-sm text-muted-foreground">{t("media.uploadHint")}</p>
        </div>

        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {t("media.selectFile")}
        </Button>
      </div>
    </Card>
  )
}
