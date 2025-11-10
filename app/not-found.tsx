"use client"

import Link from "next/link"
import { TopNav } from "@/components/top-nav"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import { useTranslations } from "@/lib/i18n/use-translations"

export default function NotFound() {
  const { t } = useTranslations("common")

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container max-w-2xl text-center">
          <h1 className="text-6xl font-bold mb-4">{t("pages.notFound.title")}</h1>
          <h2 className="text-3xl font-bold mb-4">{t("pages.notFound.heading")}</h2>
          <p className="text-lg text-muted-foreground mb-8">{t("pages.notFound.description")}</p>
          <Button size="lg" asChild>
            <Link href="/" className="gap-2">
              <Home className="h-5 w-5" />
              {t("pages.notFound.goHome")}
            </Link>
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
