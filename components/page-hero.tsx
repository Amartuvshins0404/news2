"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/lib/i18n/use-translations"
import { FileText, Headphones, Play } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Post } from "@/lib/types"
import { useState } from "react"

interface PageHeroProps {
  featuredPost: Post | undefined
  contentType?: "read" | "watch" | "listen"
  onContentTypeChange?: (type: "read" | "watch" | "listen") => void
}

export function PageHero({ featuredPost, contentType = "watch", onContentTypeChange }: PageHeroProps) {
  const { t } = useTranslations("common")

  if (!featuredPost) return null

  return (
    <section className="relative min-h-[500px] md:min-h-[600px] flex items-end justify-center overflow-hidden">
      {/* Background Image with Blur and Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={featuredPost.featured_image || "/placeholder.svg?height=600&width=1400"}
          alt={featuredPost.title}
          fill
          className="object-cover blur-sm scale-110"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/90" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Featured Badge */}
          <div className="flex items-center justify-start">
            <Badge variant="secondary" className="text-xs uppercase tracking-widest bg-white/10 text-white border-white/20">
              {t("featuredStory")}
            </Badge>
          </div>

          {/* Headline */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight text-white text-balance">
            {featuredPost.title}
          </h1>

          {/* Logo with Play Icon in Center */}
          <div className="flex items-center justify-center py-4">
            <div className="relative w-[60px] h-[60px]">
              <Image
                src="/logo.png"
                alt="yo."
                width={60}
                height={60}
                className="w-full h-full object-contain filter brightness-0 invert"
                priority
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="h-6 w-6 text-white fill-white" />
              </div>
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="flex items-center justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-all ${
                  i === 0 ? "bg-white w-6" : "bg-white/40"
                }`}
              />
            ))}
          </div>

          {/* Content Type Buttons - 3 Large Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              asChild
              variant={contentType === "read" ? "default" : "secondary"}
              className={`${
                contentType === "read"
                  ? "bg-[#EC4899] hover:bg-[#EC4899]/90 text-white"
                  : "bg-white hover:bg-white/90 text-foreground"
              } gap-2 h-14 px-8 text-base font-semibold rounded-lg`}
            >
              <Link href={`/post/${featuredPost.slug}`} onClick={() => onContentTypeChange?.("read")}>
                <FileText className="h-5 w-5" />
                {t("read") || "Read"}
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              variant={contentType === "watch" ? "default" : "secondary"}
              className={`${
                contentType === "watch"
                  ? "bg-[#EC4899] hover:bg-[#EC4899]/90 text-white"
                  : "bg-white hover:bg-white/90 text-foreground"
              } gap-2 h-14 px-8 text-base font-semibold rounded-lg`}
            >
              <Link href={`/post/${featuredPost.slug}`} onClick={() => onContentTypeChange?.("watch")}>
                <Play className="h-5 w-5" />
                {t("watch") || "Watch"}
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              variant={contentType === "listen" ? "default" : "secondary"}
              className={`${
                contentType === "listen"
                  ? "bg-[#EC4899] hover:bg-[#EC4899]/90 text-white"
                  : "bg-white hover:bg-white/90 text-foreground"
              } gap-2 h-14 px-8 text-base font-semibold rounded-lg`}
            >
              <Link href={`/post/${featuredPost.slug}`} onClick={() => onContentTypeChange?.("listen")}>
                <Headphones className="h-5 w-5" />
                {t("listen") || "Listen"}
              </Link>
            </Button>
          </div>

          {/* Secondary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-black/20 hover:bg-black/30 text-white border-white/20"
            >
              Explained in two minutes
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-black/20 hover:bg-black/30 text-white border-white/20"
            >
              Verified
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
