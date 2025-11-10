import { CategoryNav } from "@/components/category-nav"
import { Footer } from "@/components/footer"
import { HomeHero } from "@/components/home-hero"
import { HomeLatest } from "@/components/home-latest"
import { HomeNewsletter } from "@/components/home-newsletter"
import { HomeTrending } from "@/components/home-trending"
import { TopNav } from "@/components/top-nav"
import { apiClient } from "@/lib/api-client"

export const revalidate = 60

export default async function HomePage() {
  const { data: posts } = await apiClient.getPosts({
    published: true,
    limit: 12,
    revalidate: 60,
  })

  const featuredPost = posts.find((p) => p.is_featured)
  const trendingPosts = posts.filter((p) => p.views > 500).slice(0, 3)
  const regularPosts = posts.filter((p) => p.id !== featuredPost?.id).slice(0, 8)

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <CategoryNav />

      <main className="flex-1">
        <HomeHero featuredPost={featuredPost} />
        <HomeTrending posts={trendingPosts} />
        <HomeLatest posts={regularPosts} />
        <HomeNewsletter />
      </main>

      <Footer />
    </div>
  )
}
