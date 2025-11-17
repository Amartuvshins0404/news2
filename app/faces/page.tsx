"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { TopNav } from "@/components/top-nav"
import { Footer } from "@/components/footer"
import { ArticleCard } from "@/components/article-card"
import { ExploreFilters } from "@/components/explore-filters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { useTranslations } from "@/lib/i18n/use-translations"
import { Search, Loader2, Zap } from "lucide-react"
import type { Post, Category, Tag } from "@/lib/types"

function FacesPageContent() {
  const { t } = useTranslations("common")
  const searchParams = useSearchParams()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)

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
      setPosts(data)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory, selectedTags, dateFrom, dateTo, sortBy])

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
        <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/5 via-background to-background overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />

          <div className="container max-w-5xl mx-auto px-4 relative z-10">
            <div className="space-y-8">
              {/* Hero Text */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 w-fit">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-semibold text-primary uppercase tracking-widest">
                    {t("faces.discover")}
                  </span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-balance leading-tight text-foreground">
                  {t("faces.premiumNews")}{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {t("faces.insights")}
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">{t("faces.description")}</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                  <Input
                    type="search"
                    placeholder={t("faces.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-12 h-12 text-base bg-background border border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  size="lg"
                  disabled={loading}
                  className="h-12 px-8 font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      {t("faces.search")}
                    </>
                  )}
                </Button>
              </div>

              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 items-center pt-4 border-t border-border/50">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                    {t("faces.filters")}:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {searchQuery && (
                      <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/15 transition-all">
                        <span>"{searchQuery}"</span>
                        <button onClick={() => setSearchQuery("")} className="hover:opacity-70 transition-opacity ml-1">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                    {selectedCategory !== "all" && (
                      <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/15 transition-all">
                        <span>{categories.find((c) => c.slug === selectedCategory)?.name}</span>
                        <button
                          onClick={() => setSelectedCategory("all")}
                          className="hover:opacity-70 transition-opacity ml-1"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                    {selectedTags.map((tagSlug) => (
                      <div
                        key={tagSlug}
                        className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium hover:bg-primary/15 transition-all"
                      >
                        <span>{tags.find((t) => t.slug === tagSlug)?.name}</span>
                        <button
                          onClick={() => setSelectedTags(selectedTags.filter((t) => t !== tagSlug))}
                          className="hover:opacity-70 transition-opacity ml-1"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs font-semibold">
                      {t("faces.clearAll")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <ExploreFilters
          categories={categories}
          tags={tags}
          selectedCategory={selectedCategory}
          selectedTags={selectedTags}
          dateFrom={dateFrom}
          dateTo={dateTo}
          sortBy={sortBy}
          onCategoryChange={setSelectedCategory}
          onTagsChange={setSelectedTags}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onSortChange={setSortBy}
          onApply={handleSearch}
          onReset={handleClearFilters}
        />

        {/* Results Section */}
        <section className="py-16">
          <div className="container max-w-5xl mx-auto px-4">
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
