"use client"

import { MediaGrid } from "@/components/admin/media-grid"
import { MediaUpload } from "@/components/admin/media-upload"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { useTranslations } from "@/lib/i18n/use-translations"
import type { MediaFile } from "@/lib/types"
import { useCallback, useEffect, useRef, useState } from "react"

export default function MediaPage() {
  const { t } = useTranslations("admin")
  const { toast } = useToast()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const toastRef = useRef(toast)
  const tRef = useRef(t)

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  useEffect(() => {
    tRef.current = t
  }, [t])

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    try {
      const media = await apiClient.getMedia()
      setFiles(media)
    } catch (error) {
      const currentT = tRef.current
      toastRef.current({
        title: currentT("media.error.loadFailedTitle"),
        description: error instanceof Error ? error.message : currentT("media.error.loadFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMedia()
  }, [fetchMedia])

  const handleUploadComplete = (file: MediaFile) => {
    setFiles((prev) => [file, ...prev])
  }

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteMedia(id)
      setFiles((prev) => prev.filter((f) => f.id !== id))
      toast({
        title: t("media.success.deleted"),
        description: t("media.success.deletedDescription"),
      })
    } catch (error) {
      toast({
        title: t("media.error.deleteFailedTitle"),
        description: error instanceof Error ? error.message : t("media.error.deleteFailed"),
        variant: "destructive",
      })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("media.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("media.subtitle")}</p>
      </div>

      <div className="mb-8">
        <MediaUpload onUploadComplete={handleUploadComplete} />
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">
          {t("media.listHeading", { count: files.length })}
        </h2>
      </div>

      <MediaGrid files={files} onDelete={handleDelete} loading={loading} />
    </div>
  )
}
