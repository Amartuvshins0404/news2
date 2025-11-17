"use client"

import { useTranslations } from "@/lib/i18n/use-translations"
import logo from '@/public/logo.png'
import Image from "next/image"
import Link from "next/link"

export function Footer() {
  const { t } = useTranslations("common")
  const currentYear = new Date().getFullYear()
  const brandName = t("brand.name")

  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <Image src={logo} alt={brandName} width={64} height={64} />
            <p className="text-sm text-muted-foreground mt-2">{t("footer.madeWith")}</p>
          </div>

          <div>
            <h4 className="font-semibold mb-3">{t("nav.categories")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/category/technology"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("categories.technology")}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/business"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("categories.business")}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/science"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("categories.science")}
                </Link>
              </li>
              <li>
                <Link
                  href="/category/culture"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("categories.culture")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">{t("nav.about")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("nav.contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/editorial-policy"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t("nav.editorial")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">{t("footer.legal")}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("nav.privacy")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          {t("footer.rights", { year: currentYear, siteName: brandName })}
        </div>
      </div>
    </footer>
  )
}
