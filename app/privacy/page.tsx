import { TopNav } from "@/components/top-nav"
import { Footer } from "@/components/footer"
import { generateSEOMetadata } from "@/components/seo-head"
import { getServerTranslator } from "@/lib/i18n/server"

const t = getServerTranslator("common")
const metaTitle = t("pages.privacy.metaTitle")
const metaDescription = t("pages.privacy.metaDescription")

export const metadata = generateSEOMetadata({
  title: metaTitle,
  description: metaDescription,
})

export default function PrivacyPage() {
  const lastUpdated = t("pages.privacy.lastUpdated")
  const sections = [
    {
      title: t("pages.privacy.sections.collection.title"),
      body: t("pages.privacy.sections.collection.body"),
    },
    {
      title: t("pages.privacy.sections.usage.title"),
      body: t("pages.privacy.sections.usage.body"),
    },
    {
      title: t("pages.privacy.sections.security.title"),
      body: t("pages.privacy.sections.security.body"),
    },
    {
      title: t("pages.privacy.sections.contact.title"),
      body: t("pages.privacy.sections.contact.body"),
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-bold mb-6">{t("pages.privacy.heading")}</h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-muted-foreground">{lastUpdated}</p>

            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-bold mt-8 mb-4">{section.title}</h2>
                <p className="leading-relaxed">{section.body}</p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
