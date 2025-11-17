"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { TopNav } from "@/components/top-nav"
import { Footer } from "@/components/footer"
import { ArticleCard } from "@/components/article-card"
import { PageHero } from "@/components/page-hero"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { useTranslations } from "@/lib/i18n/use-translations"
import { Search, Loader2 } from "lucide-react"
import type { Post, Category, Tag } from "@/lib/types"

function FacesPageContent() {
  const { t } = useTranslations("common")
  const searchParams = useSearchParams()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [posts, setPosts] = useState<Post[]>([])
  const [featuredPost, setFeaturedPost] = useState<Post | undefined>(undefined)
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [contentType, setContentType] = useState<"read" | "watch" | "listen">("watch")

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all")
  const [selectedTags, setSelectedTags] = useState<string[]>(searchParams.getAll("tags"))
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "")
  const [dateTo, setDateTo] = useState(searchParams.get("to") || "")
  const [sortBy, setSortBy] = useState<"date" | "views" | "title">((searchParams.get("sort") as any) || "date")

  // Load categories and tags
  useEffect(() => {
    async function loadFilters() {
      const [categoriesData, tagsData] = await Promise.all([apiClient.getCategories(), apiClient.getTags()])
      setCategories(categoriesData)
      setTags(tagsData)
    }
    loadFilters()
  }, [])

  // Load featured post (first post)
  useEffect(() => {
    async function loadFeaturedPost() {
      try {
        const { data } = await apiClient.getPosts({
          published: true,
          pageType: "faces",
          limit: 1,
        })
        if (data.length > 0) {
          setFeaturedPost(data[0])
        }
      } catch (error) {
        console.error("Error loading featured post:", error)
      }
    }
    loadFeaturedPost()
  }, [])

  // Search function
  const performSearch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await apiClient.getPosts({
        published: true,
        search: searchQuery,
        categorySlug: selectedCategory === "all" ? undefined : selectedCategory,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        limit: 50,
        pageType: "faces",
      })
      // Skip the first post if it's the featured one
      const filteredPosts = featuredPost ? data.filter((p) => p.id !== featuredPost.id) : data
      setPosts(filteredPosts)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory, selectedTags, dateFrom, dateTo, sortBy, featuredPost])

  // Update URL with search params
  const updateURL = useCallback(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (selectedCategory !== "all") params.set("category", selectedCategory)
    selectedTags.forEach((tag) => params.append("tags", tag))
    if (dateFrom) params.set("from", dateFrom)
    if (dateTo) params.set("to", dateTo)
    if (sortBy !== "date") params.set("sort", sortBy)
    router.push(`/faces?${params.toString()}`, { scroll: false })
  }, [searchQuery, selectedCategory, selectedTags, dateFrom, dateTo, sortBy, router])

  // Perform search on mount and when filters change
  useEffect(() => {
    performSearch()
  }, [performSearch])

  const handleSearch = () => {
    updateURL()
    performSearch()
  }

  const handleClearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedTags([])
    setDateFrom("")
    setDateTo("")
    setSortBy("date")
    router.push("/faces")
  }

  const hasActiveFilters =
    searchQuery || selectedCategory !== "all" || selectedTags.length > 0 || dateFrom || dateTo || sortBy !== "date"

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />

      <main className="flex-1">
        {/* Hero Section */}
        <PageHero
          featuredPost={featuredPost}
          contentType={contentType}
          onContentTypeChange={setContentType}
        />

        {/* Results Section */}
        <section className="py-8 bg-muted/30">
          <div className="container max-w-7xl mx-auto px-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-muted-foreground font-medium">{t("faces.searching")}</span>
              </div>
            ) : posts.length > 0 ? (
              <>
                <div className="mb-8">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                    {t(
                      posts.length === 1 ? "faces.resultsFound" : "faces.resultsFound_other",
                      { count: posts.length },
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <ArticleCard key={post.id} post={post} />
                  ))}
                </div>
              </>
            ) : (
              <Card className="border-dashed border-2 border-border/50 bg-muted/30">
                <CardHeader className="text-center">
                  <CardTitle className="flex flex-col items-center justify-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Search className="h-6 w-6 text-primary" />
                    </div>
                    <span>{t("faces.noResults")}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground mb-6">{t("faces.noResultsDesc")}</p>
                  <Button onClick={handleClearFilters} variant="outline">
                    {t("faces.clearFilters")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default function FacesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <FacesPageContent />
    </Suspense>
  )
}
