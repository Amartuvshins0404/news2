"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { FileText, Eye, Users, Clock, MessageSquare, Trash2 } from "lucide-react"
import { StatCard } from "@/components/admin/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import type { Comment, DashboardStats, Post } from "@/lib/types"
import Link from "next/link"
import { useTranslations } from "@/lib/i18n/use-translations"

export default function DashboardPage() {
  const { user } = useAuth()
  const { t } = useTranslations("admin")
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [recentComments, setRecentComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [isReplying, startReply] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([
      apiClient.getDashboardStats(),
      apiClient.getAdminPosts(),
      apiClient.getRecentComments(8),
    ]).then(([statsData, postsData, commentsData]) => {
      setStats(statsData)
      setRecentPosts(postsData.slice(0, 5))
      setRecentComments(commentsData)
      setLoading(false)
    })
  }, [])

  const formattedComments = useMemo(
    () =>
      recentComments.map((comment) => ({
        ...comment,
        createdLabel: new Intl.DateTimeFormat(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(comment.created_at)),
        replies: comment.replies.map((reply) => ({
          ...reply,
          createdLabel: new Intl.DateTimeFormat(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(reply.created_at)),
        })),
      })),
    [recentComments],
  )

  const handleReplyChange = (commentId: string, value: string) => {
    setReplyDrafts((prev) => ({ ...prev, [commentId]: value }))
  }

  const handleReplySubmit = (commentId: string) => {
    const body = replyDrafts[commentId]?.trim()
    if (!body) return

    startReply(async () => {
      try {
        const reply = await apiClient.replyToComment(commentId, body)
        setRecentComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  replies: [...comment.replies, reply].sort((a, b) =>
                    a.created_at.localeCompare(b.created_at),
                  ),
                }
              : comment,
          ),
        )
        setReplyDrafts((prev) => ({ ...prev, [commentId]: "" }))
        toast({
          title: "Reply sent",
          description: "Readers will see your update immediately.",
        })
      } catch (error) {
        console.error(error)
        toast({
          variant: "destructive",
          title: "Could not send reply",
          description: error instanceof Error ? error.message : "Please try again shortly.",
        })
      }
    })
  }

  const refreshComments = async () => {
    const refreshed = await apiClient.getRecentComments(8)
    setRecentComments(refreshed)
  }

  const handleDelete = (commentId: string) => {
    setDeletingId(commentId)
    void apiClient
      .deleteComment(commentId)
      .then(async () => {
        await refreshComments()
        toast({
          title: "Comment deleted",
          description: "The conversation has been updated.",
        })
      })
      .catch((error) => {
        console.error(error)
        toast({
          variant: "destructive",
          title: "Could not delete comment",
          description: error instanceof Error ? error.message : "Please try again shortly.",
        })
      })
      .finally(() => {
        setDeletingId(null)
      })
  }

  const isPostingReply = isReplying

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("dashboard.title")}</h1>
        <p className="text-muted-foreground">
          {t("dashboard.welcome", { name: user?.name ?? t("dashboard.guest") })}
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title={t("dashboard.stats.totalPosts")} value={stats.total_posts} icon={FileText} />
          <StatCard title={t("dashboard.stats.published")} value={stats.published_posts} icon={FileText} />
          <StatCard title={t("dashboard.stats.drafts")} value={stats.draft_posts} icon={Clock} />
          <StatCard
            title={t("dashboard.stats.totalViews")}
            value={stats.total_views.toLocaleString()}
            icon={Eye}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("dashboard.recentPosts.title")}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/posts">{t("dashboard.recentPosts.viewAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-start justify-between gap-4 pb-4 border-b last:border-0">
                  <div className="flex-1">
                    <Link href={`/admin/posts/${post.id}`} className="font-medium hover:text-primary">
                      {post.title}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t(`posts.status.${post.status}`)} • {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    <span>{post.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.quickActions.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link href="/admin/posts/new">
                <FileText className="mr-2 h-4 w-4" />
                {t("dashboard.quickActions.createPost")}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/admin/media">
                <Users className="mr-2 h-4 w-4" />
                {t("dashboard.quickActions.mediaLibrary")}
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start bg-transparent" asChild>
              <Link href="/">{t("dashboard.quickActions.viewSite")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Latest comments</CardTitle>
            <p className="text-sm text-muted-foreground">
              Reply as needed to keep conversations on track.
            </p>
          </div>
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-6">
          {formattedComments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No comments yet. Check back soon.
            </p>
          ) : (
            formattedComments.map((comment) => (
              <div key={comment.id} className="rounded-xl border border-border/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {comment.author_name}
                      {comment.post?.title && (
                        <span className="ml-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                          {comment.post.title}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap max-w-xl">
                      {comment.body}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{comment.createdLabel}</span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{t("dashboard.comments.postId", { defaultValue: "Post ID:" })}</span>
                  <Link
                    href={`/admin/posts/${comment.post_id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {comment.post?.title ?? comment.post_id}
                  </Link>
                  {comment.post?.slug && (
                    <Link
                      href={`/post/${comment.post.slug}`}
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("dashboard.comments.viewLive", { defaultValue: "View live" })}
                    </Link>
                  )}
                </div>

                {comment.replies.length > 0 && (
                  <div className="mt-4 space-y-3 rounded-lg border border-border/40 bg-muted/40 p-3">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{reply.author_name}</span>
                          <span>{reply.createdLabel}</span>
                        </div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {reply.body}
                        </p>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(reply.id)}
                            disabled={deletingId === reply.id}
                          >
                            <Trash2 className="mr-1 h-3 w-3" />
                            {deletingId === reply.id ? "Deleting…" : "Delete"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <Textarea
                    placeholder="Write a short reply…"
                    value={replyDrafts[comment.id] ?? ""}
                    onChange={(event) => handleReplyChange(comment.id, event.target.value)}
                    maxLength={1500}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReplyChange(comment.id, "")}
                      disabled={isPostingReply}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleReplySubmit(comment.id)}
                      disabled={
                        isPostingReply || !(replyDrafts[comment.id] && replyDrafts[comment.id].trim().length > 1)
                      }
                    >
                      {isPostingReply ? "Replying…" : "Reply"}
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      {deletingId === comment.id ? "Deleting…" : "Delete comment"}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
