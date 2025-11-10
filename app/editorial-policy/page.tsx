import { TopNav } from "@/components/top-nav"
import { Footer } from "@/components/footer"
import { generateSEOMetadata } from "@/components/seo-head"
import { getServerTranslator } from "@/lib/i18n/server"

const t = getServerTranslator("common")
const metaTitle = t("pages.editorial.metaTitle")
const metaDescription = t("pages.editorial.metaDescription")

export const metadata = generateSEOMetadata({
  title: metaTitle,
  description: metaDescription,
})

export default function EditorialPolicyPage() {
  const heading = t("pages.editorial.heading")
  const sections = [
    {
      title: t("pages.editorial.sections.standards.title"),
      body: t("pages.editorial.sections.standards.body"),
    },
    {
      title: t("pages.editorial.sections.accuracy.title"),
      body: t("pages.editorial.sections.accuracy.body"),
    },
    {
      title: t("pages.editorial.sections.independence.title"),
      body: t("pages.editorial.sections.independence.body"),
    },
    {
      title: t("pages.editorial.sections.corrections.title"),
      body: t("pages.editorial.sections.corrections.body"),
    },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1 py-12">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-bold mb-6">{heading}</h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
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
