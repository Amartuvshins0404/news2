"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/lib/i18n/use-translations"
import { ArrowRight, Eye, Headphones, Menu, Play } from "lucide-react"
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
    <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={featuredPost.featured_image || "/placeholder.svg?height=700&width=1400"}
          alt={featuredPost.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Logo and Badge */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Image
                src="/logo.png"
                alt="yo."
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
                priority
              />
            </div>
            <Badge variant="secondary" className="text-xs uppercase tracking-widest bg-white/10 text-white border-white/20">
              {t("featuredStory")}
            </Badge>
          </div>

          {/* Headline */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight text-white text-balance">
              {featuredPost.title}
            </h1>

          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === 0 ? "bg-white w-8" : "bg-white/40"
                }`}
              />
            ))}
                  </div>

          {/* Action Buttons - 3 Big Buttons: Read, Watch, Listen */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-white gap-2 h-14 px-8 text-base font-semibold rounded-lg">
              <Link href={`/post/${featuredPost.slug}`}>
                <Menu className="h-5 w-5" />
                {t("read") || "Read"}
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild className="bg-white hover:bg-white/90 text-foreground border-white/20 gap-2 h-14 px-8 text-base font-semibold rounded-lg">
              <Link href={`/post/${featuredPost.slug}`}>
                <Play className="h-5 w-5" />
                {t("watch") || "Watch"}
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild className="bg-white hover:bg-white/90 text-foreground border-white/20 gap-2 h-14 px-8 text-base font-semibold rounded-lg">
              <Link href={`/post/${featuredPost.slug}`}>
                <Headphones className="h-5 w-5" />
                {t("listen") || "Listen"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
