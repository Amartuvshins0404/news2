"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Library, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import type { MediaFile } from "@/lib/types"
import { MediaPickerDialog } from "./media-picker-dialog"
import { useTranslations } from "@/lib/i18n/use-translations"

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const { toast } = useToast()
  const { t } = useTranslations("admin")
  const [pickerOpen, setPickerOpen] = useState(false)

  const handleSelectFromLibrary = (file: MediaFile) => {
    onChange(file.url)
    toast({
      title: t("media.image.selectedTitle"),
      description: t("media.image.selectedDescription", { filename: file.filename }),
    })
  }

  return (
    <div className="space-y-4">
      <Label>{label ?? t("media.image.label")}</Label>
      <div className="border-2 border-dashed border-border rounded-lg overflow-hidden">
        <div className="relative w-full h-40 bg-muted">
          {value ? (
            <Image src={value || "/placeholder.svg"} alt={t("media.image.alt")} fill className="object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center flex-col gap-2 text-muted-foreground">
              <Library className="h-8 w-8" />
              <span className="text-sm font-medium">{t("media.image.empty")}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => {
            if (process.env.NODE_ENV !== "production") {
              console.debug("[ImageUpload] open picker from button")
            }
            setPickerOpen(true)
          }}
        >
          <Library className="h-4 w-4 mr-2" />
          {t("media.image.chooseFromLibrary")}
        </Button>
        {value && (
          <Button type="button" variant="outline" onClick={() => onChange("")}>
            <X className="h-4 w-4 mr-2" />
            {t("media.image.remove")}
          </Button>
        )}
      </div>

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={(next) => {
          if (process.env.NODE_ENV !== "production") {
            console.debug("[ImageUpload] onOpenChange", { next })
          }
          setPickerOpen(next)
        }}
        onSelect={handleSelectFromLibrary}
      />
    </div>
  )
}
