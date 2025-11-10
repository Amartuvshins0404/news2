"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { PostEditor } from "@/components/admin/post-editor"
import { useTranslations } from "@/lib/i18n/use-translations"
import { apiClient } from "@/lib/api-client"
import type { Post } from "@/lib/types"

export default function EditPostPage() {
  const { t } = useTranslations("admin")
  const params = useParams()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = params.id as string
    apiClient.getAdminPosts().then((posts) => {
      const found = posts.find((p) => p.id === id)
      setPost(found || null)
      setLoading(false)
    })
  }, [params.id])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold">{t("posts.notFound")}</h1>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("posts.edit")}</h1>
        <p className="text-muted-foreground mt-1">{t("posts.editDescription")}</p>
      </div>

      <PostEditor post={post} />
    </div>
  )
}
