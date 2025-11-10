import { TopNav } from "@/components/top-nav"
import { CategoryNav } from "@/components/category-nav"
import { Footer } from "@/components/footer"
import { ArticleCard } from "@/components/article-card"
import { apiClient } from "@/lib/api-client"
import { generateSEOMetadata } from "@/components/seo-head"
import { getServerTranslator } from "@/lib/i18n/server"

export const revalidate = 60

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = params
  const categories = await apiClient.getCategories()
  const category = categories.find((c) => c.slug === slug)
  const t = getServerTranslator("common")

  return generateSEOMetadata({
    title: category ? t("pages.category.metaTitleWithName", { name: category.name }) : t("pages.category.metaTitle"),
    description: category?.description || t("pages.category.metaDescription"),
  })
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = params
  const categories = await apiClient.getCategories()
  const category = categories.find((c) => c.slug === slug)
  const t = getServerTranslator("common")

  const { data: posts } = await apiClient.getPosts({
    published: true,
    categorySlug: slug,
    limit: 20,
  })

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <CategoryNav />

      <main className="flex-1 py-12">
        <div className="container">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3 text-balance">
              {category?.name || t("pages.category.fallbackTitle")}
            </h1>
            {category?.description && (
              <p className="text-lg text-muted-foreground text-pretty">{category.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {posts.length === 1
                ? t("pages.category.countSingular", { count: posts.length })
                : t("pages.category.countPlural", { count: posts.length })}
            </p>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t("pages.category.empty")}</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
