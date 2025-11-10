"use client"

import { Button } from "@/components/ui/button"
import { useTranslations } from "@/lib/i18n/use-translations"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { ArticleCard } from "@/components/article-card"
import type { Post } from "@/lib/types"

interface HomeLatestProps {
  posts: Post[]
}

export function HomeLatest({ posts }: HomeLatestProps) {
  const { t } = useTranslations("common")

  return (
    <section className="py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl md:text-4xl font-bold">{t("latestArticles")}</h2>
          <Button variant="outline" asChild className="gap-2 bg-transparent">
            <Link href="/explore">
              {t("browseAll")} <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {posts.map((post) => (
            <ArticleCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}
