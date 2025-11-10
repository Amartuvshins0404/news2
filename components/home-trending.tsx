"use client"

import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/lib/i18n/use-translations"
import { TrendingUp } from "lucide-react"
import Link from "next/link"
import type { Post } from "@/lib/types"

interface HomeTrendingProps {
  posts: Post[]
}

export function HomeTrending({ posts }: HomeTrendingProps) {
  const { t } = useTranslations("common")

  if (posts.length === 0) return null

  return (
    <section className="py-12 border-b bg-accent/20">
      <div className="container">
        <div className="flex items-center gap-2 mb-8">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">{t("trendingNow")}</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post, idx) => (
            <Link key={post.id} href={`/post/${post.slug}`} className="group">
              <div className="flex gap-4 items-start">
                <div className="text-4xl font-bold text-muted-foreground/30 leading-none">
                  {(idx + 1).toString().padStart(2, "0")}
                </div>
                <div className="flex-1 space-y-2">
                  <Badge variant="outline" className="text-xs">
                    {post.category.name}
                  </Badge>
                  <h3 className="font-semibold leading-tight text-balance group-hover:text-primary transition-colors line-clamp-3">
                    {post.title}
                  </h3>
                  <div className="text-xs text-muted-foreground">{post.views.toLocaleString()} views</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
