"use client"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useState } from "react"

export function HomeNewsletter() {
  const { t } = useTranslations("common")
  const [email, setEmail] = useState("")

  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-accent/10 to-primary/5 border-y">
      <div className="container text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">{t("stayInformed")}</h2>
          <p className="text-lg text-muted-foreground text-pretty">{t("stayInformedDescription")}</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-4">
            <input
              type="email"
              placeholder={t("enterYourEmail")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="lg" className="sm:w-auto">
              {t("subscribe")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
