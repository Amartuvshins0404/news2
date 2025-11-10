"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/lib/i18n/use-translations"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Post } from "@/lib/types"

interface HomeHeroProps {
  featuredPost: Post | undefined
}

export function HomeHero({ featuredPost }: HomeHeroProps) {
  const { t } = useTranslations("common")

  if (!featuredPost) return null

  return (
    <section className="relative bg-gradient-to-b from-muted/30 to-background border-b">
      <div className="container py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="text-xs uppercase tracking-wider">
              {t("featuredStory")}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-balance">
              {featuredPost.title}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed">
              {featuredPost.excerpt}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Image
                  src={featuredPost.author.avatar || "/placeholder.svg?height=40&width=40"}
                  alt={featuredPost.author.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <div className="font-medium">{featuredPost.author.name}</div>
                  <div className="text-muted-foreground">
                    {new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>
            <Button size="lg" asChild className="mt-4">
              <Link href={`/post/${featuredPost.slug}`} className="gap-2">
                {t("readFullStory")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <Link href={`/post/${featuredPost.slug}`} className="group">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <Image
                src={featuredPost.featured_image || "/placeholder.svg?height=600&width=800"}
                alt={featuredPost.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                priority
              />
            </div>
          </Link>
        </div>
      </div>
    </section>
  )
}
