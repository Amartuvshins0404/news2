"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostTable } from "@/components/admin/post-table"
import { apiClient } from "@/lib/api-client"
import { useTranslations } from "@/lib/i18n/use-translations"
import type { Post } from "@/lib/types"
import { Plus } from "lucide-react"

export default function PostsPage() {
  const { t } = useTranslations("admin")
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  const loadPosts = async () => {
    setLoading(true)
    try {
      const data = await apiClient.getAdminPosts()
      setPosts(data)
      applyFilter(data, filter)
    } finally {
      setLoading(false)
    }
  }

  const applyFilter = (allPosts: Post[], currentFilter: string) => {
    if (currentFilter === "all") {
      setFilteredPosts(allPosts)
    } else {
      setFilteredPosts(allPosts.filter((p) => p.status === currentFilter))
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    applyFilter(posts, filter)
  }, [filter, posts])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t("posts.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("posts.subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new" className="gap-2">
            <Plus className="h-4 w-4" />
            {t("posts.createNew")}
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="all">{t("posts.filterAll")}</TabsTrigger>
            <TabsTrigger value="published">{t("posts.filterPublished")}</TabsTrigger>
            <TabsTrigger value="draft">{t("posts.filterDrafts")}</TabsTrigger>
            <TabsTrigger value="scheduled">{t("posts.filterScheduled")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="border rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("posts.loading")}</p>
        </div>
      ) : (
        <PostTable posts={filteredPosts} onPostsChange={loadPosts} />
      )}
    </div>
  )
}
