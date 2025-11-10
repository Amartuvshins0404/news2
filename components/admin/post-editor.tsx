"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { useTranslations } from "@/lib/i18n/use-translations"
import { sanitizeHtml } from "@/lib/sanitize"
import type { Category, Post, Tag } from "@/lib/types"
import { Eye, Save, Send, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ImageUpload } from "./image-upload"
import { RichTextEditorField } from "./rich-text-editor"

interface PostEditorProps {
  post?: Post
  onSave?: (post: Post) => void
}

export function PostEditor({ post, onSave }: PostEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useTranslations("admin")
  const { t: tCommon } = useTranslations("common")

  const [title, setTitle] = useState(post?.title || "")
  const [slug, setSlug] = useState(post?.slug || "")
  const [excerpt, setExcerpt] = useState(post?.excerpt || "")
  const [bodyHtml, setBodyHtml] = useState(post?.body_html || "")
  const [featuredImage, setFeaturedImage] = useState(post?.featured_image || "")
  const [categoryId, setCategoryId] = useState(post?.category.id || "")
  const [selectedTags, setSelectedTags] = useState<string[]>(post?.tags.map((t) => t.id) || [])
  const [status, setStatus] = useState<"draft" | "scheduled" | "published">(post?.status || "draft")
  const [isFeatured, setIsFeatured] = useState(post?.is_featured || false)
  const [scheduledAt, setScheduledAt] = useState(post?.scheduled_at || "")

  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    Promise.all([apiClient.getCategories(), apiClient.getTags()]).then(([cats, tgs]) => {
      setCategories(cats)
      setTags(tgs)
      if (!post && cats.length > 0) {
        setCategoryId(cats[0].id)
      }
    })
  }, [post])

  useEffect(() => {
    if (title && !post) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
      setSlug(generatedSlug)
    }
  }, [title, post])

  const handleSave = async (newStatus: "draft" | "scheduled" | "published") => {
    if (!title || !excerpt || !bodyHtml || !categoryId) {
      toast({
        title: tCommon("error"),
        description: t("postEditor.errors.missingFields"),
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const category = categories.find((c) => c.id === categoryId)!
      const postTags = tags.filter((t) => selectedTags.includes(t.id))
      const sanitizedSlug = slug.trim().toLowerCase()
      if (sanitizedSlug !== slug) {
        setSlug(sanitizedSlug)
      }

      const postData: Partial<Post> = {
        title,
        slug: sanitizedSlug,
        excerpt,
        body_html: bodyHtml,
        featured_image: featuredImage || undefined,
        category,
        tags: postTags,
        status: newStatus,
        is_featured: isFeatured,
        scheduled_at: newStatus === "scheduled" ? scheduledAt : undefined,
        published_at: newStatus === "published" ? new Date().toISOString() : undefined,
      }

      let savedPost: Post
      if (post?.id) {
        savedPost = await apiClient.updatePost(post.id, postData)
        toast({
          title: t("postEditor.notifications.updated.title"),
          description: t("postEditor.notifications.updated.description"),
        })
      } else {
        savedPost = await apiClient.createPost(postData)
        toast({
          title: t("postEditor.notifications.created.title"),
          description: t("postEditor.notifications.created.description"),
        })
      }

      if (onSave) {
        onSave(savedPost)
      } else {
        router.push("/admin/posts")
      }
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: error instanceof Error ? error.message : t("postEditor.notifications.saveFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  if (showPreview) {
    const categoryName = categories.find((c) => c.id === categoryId)?.name
    const activeTags = tags.filter((t) => selectedTags.includes(t.id))
    const plainText = bodyHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    const wordCount = plainText ? plainText.split(" ").length : 0
    const estimatedReadTime = Math.max(1, Math.round(wordCount / 200 || 1))
    const statusLabel = t(`posts.status.${status}`)
    const scheduledLabel = status === "scheduled" && scheduledAt ? new Date(scheduledAt).toLocaleString() : undefined
    const displayTitle = title.trim() ? title : t("postEditor.form.titlePlaceholder")
    const displayExcerpt = excerpt.trim() ? excerpt : t("postEditor.form.excerptPlaceholder")

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("postEditor.preview.title")}</h2>
          <Button variant="outline" onClick={() => setShowPreview(false)}>
            <X className="mr-2 h-4 w-4" />
            {t("postEditor.preview.close")}
          </Button>
        </div>

        <div className="relative">
          <div className="editorial-surface relative">
            {featuredImage && (
              <div className="editorial-hero">
                <img
                  src={featuredImage}
                  alt={t("postEditor.preview.featuredAlt", { title: displayTitle })}
                  loading="lazy"
                />
              </div>
            )}
            <div className="editorial-body">
              {categoryName && <span className="editorial-kicker">{categoryName}</span>}
              <div className="editorial-meta">
                <span className="editorial-meta-item">{statusLabel}</span>
                {scheduledLabel && <span className="editorial-meta-item">{scheduledLabel}</span>}
                <span className="editorial-meta-item">≈ {estimatedReadTime} min read</span>
              </div>
              <h1 className="editorial-headline">{displayTitle}</h1>
              {displayExcerpt && <p className="editorial-dek">{displayExcerpt}</p>}
              <div
                className="editorial-content"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(bodyHtml) }}
              />
              {activeTags.length > 0 && (
                <div className="editorial-tag-list">
                  {activeTags.map((tag) => (
                    <span key={tag.id} className="editorial-tag">
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("postEditor.sections.content")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("postEditor.form.titleLabel")}</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("postEditor.form.titlePlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">{t("postEditor.form.slugLabel")}</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder={t("postEditor.form.slugPlaceholder")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">{t("postEditor.form.excerptLabel")}</Label>
                <Textarea
                  id="excerpt"
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder={t("postEditor.form.excerptPlaceholder")}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">{t("postEditor.form.bodyLabel")}</Label>
                <RichTextEditorField value={bodyHtml} onChange={setBodyHtml} placeholder={t("postEditor.form.bodyPlaceholder")} />
              </div>

              <ImageUpload
                value={featuredImage}
                onChange={setFeaturedImage}
                label={t("postEditor.form.featuredImage")}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("postEditor.sections.actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full gap-2" onClick={() => handleSave("draft")} disabled={loading} variant="outline">
                <Save className="h-4 w-4" />
                {t("postEditor.actions.saveDraft")}
              </Button>

              <Button className="w-full gap-2" onClick={() => handleSave("published")} disabled={loading}>
                <Send className="h-4 w-4" />
                {t("postEditor.actions.publish")}
              </Button>

              <Button className="w-full gap-2" variant="secondary" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4" />
                {t("postEditor.actions.preview")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("postEditor.sections.category")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("postEditor.form.categoryPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("postEditor.sections.tags")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("postEditor.sections.settings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="featured">{t("postEditor.form.featuredToggle")}</Label>
                <Switch id="featured" checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">{t("postEditor.form.statusLabel")}</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">{t("posts.status.draft")}</SelectItem>
                    <SelectItem value="scheduled">{t("posts.status.scheduled")}</SelectItem>
                    <SelectItem value="published">{t("posts.status.published")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {status === "scheduled" && (
                <div className="space-y-2">
                  <Label htmlFor="scheduled-at">{t("postEditor.form.scheduledAtLabel")}</Label>
                  <Input
                    id="scheduled-at"
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
