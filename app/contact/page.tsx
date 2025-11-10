import { TopNav } from "@/components/top-nav"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { generateSEOMetadata } from "@/components/seo-head"
import { getServerTranslator } from "@/lib/i18n/server"

const t = getServerTranslator("common")
const metaTitle = t("pages.contact.metaTitle")
const metaDescription = t("pages.contact.metaDescription")

export const metadata = generateSEOMetadata({
  title: metaTitle,
  description: metaDescription,
})

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1 py-12">
        <div className="container max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">{t("pages.contact.heading")}</h1>
          <p className="text-lg text-muted-foreground mb-8">{t("pages.contact.intro")}</p>

          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t("pages.contact.form.name")}</Label>
              <Input id="name" placeholder={t("pages.contact.form.namePlaceholder")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("pages.contact.form.email")}</Label>
              <Input id="email" type="email" placeholder={t("pages.contact.form.emailPlaceholder")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">{t("pages.contact.form.subject")}</Label>
              <Input id="subject" placeholder={t("pages.contact.form.subjectPlaceholder")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{t("pages.contact.form.message")}</Label>
              <Textarea id="message" rows={6} placeholder={t("pages.contact.form.messagePlaceholder")} />
            </div>

            <Button type="submit" size="lg">
              {t("pages.contact.form.submit")}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}
