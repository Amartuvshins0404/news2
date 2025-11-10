"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { useTranslations } from "@/lib/i18n/use-translations"
import type { MediaFile } from "@/lib/types"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { MediaUpload } from "./media-upload"

interface MediaPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (file: MediaFile) => void
}

export function MediaPickerDialog({ open, onOpenChange, onSelect }: MediaPickerDialogProps) {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()
  const toastRef = useRef(toast)
  const { t } = useTranslations("admin")
  const translationRef = useRef(t)
  const hasFetchedRef = useRef(false)
  const activeRequestRef = useRef<AbortController | null>(null)
  const fetchCountRef = useRef(0)
  const loadingRef = useRef(loading)
  const refreshingRef = useRef(refreshing)

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  useEffect(() => {
    translationRef.current = t
  }, [t])

  useEffect(() => {
    loadingRef.current = loading
  }, [loading])

  useEffect(() => {
    refreshingRef.current = refreshing
  }, [refreshing])

  const fetchMedia = useCallback(
    async (options?: { showLoader?: boolean }) => {
      const { showLoader = true } = options ?? {}

      const invocationId = ++fetchCountRef.current
      if (process.env.NODE_ENV !== "production") {
        console.debug("[MediaPickerDialog] fetchMedia invoked", {
          invocationId,
          showLoader,
          loadingBefore: loadingRef.current,
          refreshing: refreshingRef.current,
          trigger: showLoader ? "auto" : "manual-refresh",
        })
      }

      if (showLoader) {
        setLoading(true)
      }

      if (activeRequestRef.current) {
        activeRequestRef.current.abort()
        if (process.env.NODE_ENV !== "production") {
          console.debug("[MediaPickerDialog] aborted previous request")
        }
      }

      const controller = new AbortController()
      activeRequestRef.current = controller
      const startedAt = performance.now()

      try {
        const media = await apiClient.getMedia(controller.signal)
        if (!controller.signal.aborted) {
          setFiles(media)
          if (process.env.NODE_ENV !== "production") {
            console.debug("[MediaPickerDialog] fetchMedia resolved", {
              invocationId,
              durationMs: performance.now() - startedAt,
              resultCount: media.length,
            })
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (process.env.NODE_ENV !== "production") {
            console.debug("[MediaPickerDialog] fetchMedia aborted", { invocationId })
          }
          return
        }
        const translations = translationRef.current
        toastRef.current({
          title: translations("media.error.loadFailedTitle"),
          description: error instanceof Error ? error.message : translations("media.error.loadFailed"),
          variant: "destructive",
        })
        if (process.env.NODE_ENV !== "production") {
          console.error("[MediaPickerDialog] fetchMedia error", { invocationId, error })
        }
      } finally {
        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null
        }
        if (showLoader) {
          setLoading(false)
        }
        if (process.env.NODE_ENV !== "production") {
          console.debug("[MediaPickerDialog] fetchMedia finished", {
            invocationId,
            showLoader,
            loadingAfter: loadingRef.current,
            refreshingAfter: refreshingRef.current,
          })
        }
      }
    },
    []
  )

  useEffect(() => {
    return () => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[MediaPickerDialog] useEffect open trigger", {
        open,
        hasFetched: hasFetchedRef.current,
      })
    }
    if (open && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      void fetchMedia()
    } else if (!open) {
      hasFetchedRef.current = false
    }
  }, [open, fetchMedia])

  const handleUploadComplete = (file: MediaFile) => {
    setFiles((prev) => [file, ...prev])
  }

  const handleSelect = (file: MediaFile) => {
    onSelect(file)
    onOpenChange(false)
  }

  const handleRefresh = async () => {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[MediaPickerDialog] manual refresh requested")
    }
    try {
      setRefreshing(true)
      await fetchMedia({ showLoader: false })
    } catch (error) {
      toastRef.current({
        title: t("media.error.refreshFailedTitle"),
        description: error instanceof Error ? error.message : t("media.error.refreshFailed"),
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("media.dialog.libraryTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <MediaUpload onUploadComplete={handleUploadComplete} />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{t("media.dialog.instructions")}</p>
            <Button variant="outline" size="sm" onClick={() => void handleRefresh()} disabled={refreshing}>
              {refreshing ? t("media.status.refreshing") : t("media.actions.refresh")}
            </Button>
          </div>

          <div className="max-h-[400px] overflow-y-auto pr-1">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={`picker-skeleton-${index}`}
                    className="rounded-lg border border-dashed border-muted-foreground/30 aspect-square animate-pulse"
                  />
                ))}
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t("media.dialog.empty")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {files.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => handleSelect(file)}
                    className="group relative overflow-hidden rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <div className="relative aspect-square">
                      <Image src={file.url || "/placeholder.svg"} alt={file.filename} fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-sm font-medium text-white">{t("media.dialog.select")}</span>
                      </div>
                    </div>
                    <div className="p-2 text-left">
                      <p className="text-sm font-medium truncate">{file.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
