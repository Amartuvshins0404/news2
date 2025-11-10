import { TopNav } from "@/components/top-nav"
import { Footer } from "@/components/footer"
import { generateSEOMetadata } from "@/components/seo-head"
import { getServerTranslator } from "@/lib/i18n/server"

const t = getServerTranslator("common")
const aboutTitle = t("pages.about.metaTitle")
const aboutDescription = t("pages.about.metaDescription")

export const metadata = generateSEOMetadata({
  title: aboutTitle,
  description: aboutDescription,
})

export default function AboutPage() {
  const heading = t("pages.about.heading")
  const intro = t("pages.about.intro")
  const missionTitle = t("pages.about.missionTitle")
  const missionBody = t("pages.about.missionBody")
  const coverageTitle = t("pages.about.coverageTitle")
  const coverageItems = [
    t("pages.about.coverageItems.technology"),
    t("pages.about.coverageItems.business"),
    t("pages.about.coverageItems.science"),
    t("pages.about.coverageItems.culture"),
  ]
  const valuesTitle = t("pages.about.valuesTitle")
  const valuesBody = t("pages.about.valuesBody")

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1 py-12">
        <div className="container max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">{heading}</h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed">{intro}</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">{missionTitle}</h2>
            <p className="leading-relaxed">{missionBody}</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">{coverageTitle}</h2>
            <ul className="list-disc list-inside space-y-2 leading-relaxed">
              {coverageItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">{valuesTitle}</h2>
            <p className="leading-relaxed">{valuesBody}</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
