import { Suspense } from "react"

import { ArticleCard } from "@/components/article-card"
import { CommentsSection } from "@/components/post/comments-section"
import { TrackPostView } from "@/components/post/track-post-view"
import { Footer } from "@/components/footer"
import { generateArticleSchema, generateSEOMetadata } from "@/components/seo-head"
import { TopNav } from "@/components/top-nav"
import { Button } from "@/components/ui/button"
import { getServerTranslator } from "@/lib/i18n/server"
import { sanitizeHtml } from "@/lib/sanitize"
import { getPost, getPosts } from "@/lib/supabase-api"
import { ArrowLeft, Calendar, Clock, Share2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PostPageSkeleton } from "@/components/skeletons/page-skeletons"

export const revalidate = 60

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = params
  const post = await getPost(slug)
  const t = getServerTranslator("common")

  if (!post) {
    return { title: t("pages.post.metaNotFound") }
  }

  return generateSEOMetadata({
    title: post.title,
    description: post.excerpt,
    image: post.featured_image,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/post/${post.slug}`,
    type: "article",
    publishedTime: post.published_at,
    author: post.author.name,
  })
}

async function PostPageContent({ slug }: { slug: string }) {
  const post = await getPost(slug)
  const t = getServerTranslator("common")

  if (!post) {
    notFound()
  }

  const sanitizedHtml = sanitizeHtml(post.body_html)
  const publishedDate = new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const relatedPosts = await getPosts({
    published: true,
    categoryId: post.category.id,
    limit: 3,
  })
  const filteredRelated = relatedPosts.filter((p) => p.id !== post.id).slice(0, 3)

  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.excerpt,
    image: post.featured_image,
    author: post.author.name,
    publishedTime: post.published_at || post.created_at,
    url: `${process.env.NEXT_PUBLIC_SITE_URL}/post/${post.slug}`,
  })

  return (
    <>
      <TrackPostView postSlug={post.slug} />

      <main className="flex-1">
        <section className="relative overflow-hidden bg-background text-foreground transition-colors">
          <div className="container relative max-w-5xl py-16">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="mb-8 rounded-full border border-slate-700/80 bg-slate-900/70 text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800/80 hover:text-white"
            >
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                {t("pages.post.back")}
              </Link>
            </Button>

            <div className="space-y-12">
              <div className="editorial-surface">
                {post.featured_image && (
                  <div className="editorial-hero">
                    <Image
                      src={post.featured_image || "/placeholder.svg"}
                      alt={post.title}
                      fill
                      priority
                      className="object-cover"
                      sizes="(min-width: 1024px) 960px, 100vw"
                    />
                  </div>
                )}

                <div className="editorial-body">
                  <span className="editorial-kicker">{post.category.name}</span>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="editorial-meta">
                      <span className="editorial-meta-item">
                        <Calendar className="h-4 w-4" />
                        {publishedDate}
                      </span>
                      <span className="editorial-meta-item">
                        <Clock className="h-4 w-4" />
                        {t("pages.post.readTime", { minutes: post.read_time })}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="editorial-icon-button ml-auto"
                      title={t("pages.post.share")}
                      aria-label={t("pages.post.share")}
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>

                  <h1 className="editorial-headline">{post.title}</h1>
                  <p className="editorial-dek">{post.excerpt}</p>

                  <div className="editorial-author">
                    <Image
                      src={post.author.avatar || "/placeholder.svg?height=64&width=64"}
                      alt={post.author.name}
                      width={64}
                      height={64}
                      className="rounded-full border border-slate-800 object-cover"
                    />
                    <div>
                      <div className="editorial-author-name">{post.author.name}</div>
                      <div className="editorial-author-role">{post.author.role}</div>
                    </div>
                  </div>

                  <div
                    className="editorial-content"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                  />

                  {post.tags.length > 0 && (
                    <div className="editorial-tag-list">
                      {post.tags.map((tag) => (
                        <span key={tag.id} className="editorial-tag">
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          <div className="container max-w-5xl py-12">
            <CommentsSection postId={post.id} postSlug={post.slug} />
          </div>
        </section>

        {filteredRelated.length > 0 && (
          <section className="py-16">
            <div className="container max-w-5xl">
              <h2 className="mb-6 text-2xl font-bold">{t("pages.post.related")}</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {filteredRelated.map((relatedPost) => (
                  <ArticleCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* JSON-LD Schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
    </>
  )
}

export default function PostPage({ params }: PageProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <Suspense fallback={<PostPageSkeleton />}>
        <PostPageContent slug={params.slug} />
      </Suspense>
      <Footer />
    </div>
  )
}
