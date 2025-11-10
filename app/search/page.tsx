"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { TopNav } from "@/components/top-nav"
import { Footer } from "@/components/footer"
import { ArticleCard } from "@/components/article-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { useTranslations } from "@/lib/i18n/use-translations"
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react"
import type { Post, Category, Tag } from "@/lib/types"

function ExplorePageContent() {
  const { t } = useTranslations("common")
  const searchParams = useSearchParams()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

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
    router.push(`/explore?${params.toString()}`, { scroll: false })
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
    router.push("/explore")
  }

  const toggleTag = (tagSlug: string) => {
    setSelectedTags((prev) => (prev.includes(tagSlug) ? prev.filter((t) => t !== tagSlug) : [...prev, tagSlug]))
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />

      <main className="flex-1">
        {/* Explore Header */}
        <section className="bg-gradient-to-b from-muted/50 to-background py-12 border-b">
          <div className="container max-w-4xl">
            <h1 className="text-4xl font-bold mb-6 text-center">Explore</h1>

            {/* Search Input */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button onClick={handleSearch} size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </Button>
              <Button variant="outline" size="lg" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || selectedCategory !== "all" || selectedTags.length > 0 || dateFrom || dateTo) && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-sm text-muted-foreground">Filters:</span>
                {searchQuery && (
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    <span>"{searchQuery}"</span>
                    <button onClick={() => setSearchQuery("")} className="hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {selectedCategory !== "all" && (
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                    <span>{categories.find((c) => c.slug === selectedCategory)?.name}</span>
                    <button onClick={() => setSelectedCategory("all")} className="hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {selectedTags.map((tagSlug) => (
                  <div
                    key={tagSlug}
                    className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    <span>{tags.find((t) => t.slug === tagSlug)?.name}</span>
                    <button onClick={() => toggleTag(tagSlug)} className="hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Filters Panel */}
        {showFilters && (
          <section className="border-b bg-muted/30">
            <div className="container py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Latest</SelectItem>
                      <SelectItem value="views">Most Viewed</SelectItem>
                      <SelectItem value="title">Title (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From */}
                <div className="space-y-2">
                  <Label>From</Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>

                {/* Date To */}
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>

              {/* Tags Filter */}
              {tags.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-3">
                    {tags.map((tag) => (
                      <div key={tag.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={selectedTags.includes(tag.slug)}
                          onCheckedChange={() => toggleTag(tag.slug)}
                        />
                        <label htmlFor={`tag-${tag.id}`} className="text-sm cursor-pointer">
                          {tag.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button onClick={handleSearch}>Apply</Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Results Section */}
        <section className="py-12">
          <div className="container">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Loading...</span>
              </div>
            ) : posts.length > 0 ? (
              <>
                <div className="mb-6">
                  <p className="text-muted-foreground">
                    Found {posts.length} {posts.length === 1 ? "article" : "articles"}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <ArticleCard key={post.id} post={post} />
                  ))}
                </div>
              </>
            ) : (
              <Card className="max-w-md mx-auto text-center py-12">
                <CardHeader>
                  <CardTitle className="flex items-center justify-center gap-2">
                    <Search className="h-6 w-6 text-muted-foreground" />
                    No Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">We couldn't find any articles matching your criteria.</p>
                  <Button onClick={handleClearFilters}>Clear Filters</Button>
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

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <ExplorePageContent />
    </Suspense>
  )
}
