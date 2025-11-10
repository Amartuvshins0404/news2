"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import { useTranslations } from "@/lib/i18n/use-translations"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t } = useTranslations("common")

  useEffect(() => {
    console.error("[v0] Error occurred:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="container max-w-2xl text-center">
        <div className="rounded-full bg-destructive/10 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold mb-4">{t("common.error")}</h1>
        <p className="text-lg text-muted-foreground mb-8">An unexpected error occurred. Please try again.</p>
        <Button onClick={reset} size="lg">
          {t("common.back")}
        </Button>
      </div>
    </div>
  )
}
