"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Copy, Trash2 } from "lucide-react"
import type { MediaFile } from "@/lib/types"
import { useTranslations } from "@/lib/i18n/use-translations"

interface MediaGridProps {
  files: MediaFile[]
  loading?: boolean
  onDelete: (id: string) => Promise<void> | void
}

export function MediaGrid({ files, loading = false, onDelete }: MediaGridProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()
  const { t } = useTranslations("admin")
  const { t: tCommon } = useTranslations("common")

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    toast({
      title: t("media.notifications.copiedTitle"),
      description: t("media.notifications.copiedDescription"),
    })
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await onDelete(deleteId)
    } finally {
      setDeleteId(null)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <Card key={`media-skeleton-${index}`} className="overflow-hidden">
            <div className="relative aspect-square bg-muted animate-pulse" />
            <CardContent className="p-3 space-y-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
              <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{t("media.empty")}</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {files.map((file) => (
          <Card key={file.id} className="overflow-hidden group">
            <div className="relative aspect-square bg-muted">
              <Image src={file.url || "/placeholder.svg"} alt={file.filename} fill className="object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="icon" variant="secondary" onClick={() => copyToClipboard(file.url)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="destructive" onClick={() => setDeleteId(file.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardContent className="p-3">
              <p className="text-sm font-medium truncate">{file.filename}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("media.dialog.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("media.dialog.deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t("media.dialog.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
