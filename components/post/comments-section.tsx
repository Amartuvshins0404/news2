"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import type { Comment } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Trash2 } from "lucide-react"

interface CommentsSectionProps {
  postId: string
  postSlug: string
}

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value))
  } catch {
    return value
  }
}

function countRepliesRecursive(comment: Comment): number {
  return comment.replies.reduce(
    (total, reply) => total + 1 + countRepliesRecursive(reply),
    0,
  )
}

function insertReply(tree: Comment[], parentId: string, reply: Comment): Comment[] {
  return tree.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        replies: sortByCreated([...node.replies, reply]),
      }
    }
    if (node.replies.length > 0) {
      return {
        ...node,
        replies: insertReply(node.replies, parentId, reply),
      }
    }
    return node
  })
}

function sortByCreated(comments: Comment[]): Comment[] {
  return [...comments].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
}

function createMentionHandle(name: string): string {
  return name.trim().replace(/\s+/g, "")
}

function renderCommentBody(text: string) {
  const mentionPattern = /(@[A-Za-z0-9._-]+)/g
  const parts = text.split(mentionPattern)
  return parts.map((part, idx) => {
    const isMention = /^@[A-Za-z0-9._-]+$/.test(part)
    if (isMention) {
      return (
        <span key={`mention-${idx}`} className="comment-mention">
          {part}
        </span>
      )
    }
    return (
      <span key={`text-${idx}`} className="comment-text-fragment">
        {part}
      </span>
    )
  })
}

export function CommentsSection({ postId, postSlug }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, startSubmit] = useTransition()
  const [formName, setFormName] = useState("")
  const [formBody, setFormBody] = useState("")
  const [replyTarget, setReplyTarget] = useState<{ id: string; author: string } | null>(
    null,
  )
  const [isAdmin, setIsAdmin] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    let isMounted = true

    const loadComments = async () => {
      try {
        const data = await apiClient.getPostComments(postSlug)
        if (isMounted) {
          setComments(data)
          setLoading(false)
        }
      } catch (error) {
        console.error(error)
        if (isMounted) {
          toast({
            variant: "destructive",
            title: "Could not load comments",
            description: error instanceof Error ? error.message : "Please try again shortly.",
          })
          setLoading(false)
        }
      }

      try {
        const adminComments = await apiClient.getAdminCommentsForPost(postId)
        if (isMounted) {
          setIsAdmin(true)
          setComments(adminComments)
        }
      } catch (error) {
        if (isMounted) {
          setIsAdmin(false)
        }
      }
    }

    void loadComments()

    return () => {
      isMounted = false
    }
  }, [postId, postSlug, toast])

  const totalReplies = useMemo(
    () =>
      comments.reduce(
        (acc, comment) => acc + countRepliesRecursive(comment),
        0,
      ),
    [comments],
  )

  useEffect(() => {
    if (replyTarget) {
      const handle = createMentionHandle(replyTarget.author)
      setFormBody((prev) => {
        if (prev.trim().length === 0) {
          return `@${handle} `
        }
        return prev
      })
      requestAnimationFrame(() => textareaRef.current?.focus())
    }
  }, [replyTarget])

  const beginReply = (id: string, author: string) => {
    setReplyTarget({ id, author })
  }

  const cancelReply = () => {
    setReplyTarget(null)
    setFormBody("")
  }

  const handleSubmit = () => {
    if (formBody.trim().length < 3) {
      toast({
        variant: "destructive",
        title: "Comment is too short",
        description: "Please share a little more context so others can follow along.",
      })
      return
    }

    startSubmit(async () => {
      try {
        const created = await apiClient.addComment(postSlug, {
          name: formName.trim().slice(0, 80),
          body: formBody.trim(),
          parentId: replyTarget?.id,
        })
        setComments((prev) =>
          replyTarget?.id ? insertReply(prev, replyTarget.id, created) : [created, ...prev],
        )
        setReplyTarget(null)
        setFormBody("")
        toast({
          title: "Thanks for contributing!",
          description: "Your comment is live.",
        })
      } catch (error) {
        console.error(error)
        toast({
          variant: "destructive",
          title: "Failed to post comment",
          description: error instanceof Error ? error.message : "Please try again in a moment.",
        })
      }
    })
  }

  const handleDelete = (commentId: string) => {
    if (!isAdmin) return
    setDeletingId(commentId)
    void apiClient
      .deleteComment(commentId)
      .then((response) => {
        if (response?.comments) {
          setComments(response.comments)
        } else {
          setComments((prev) => removeComment(prev, commentId))
        }
        toast({
          title: "Comment deleted",
          description: "The conversation has been updated.",
        })
      })
      .catch((error) => {
        console.error(error)
        toast({
          variant: "destructive",
          title: "Failed to delete comment",
          description: error instanceof Error ? error.message : "Please try again in a moment.",
        })
      })
      .finally(() => setDeletingId(null))
  }

  return (
    <section className="comment-section" aria-labelledby="comments-title">
      <div className="comment-section__header">
        <div>
          <h2 id="comments-title" className="comment-section__title">
            Conversation
          </h2>
          <p className="comment-section__subtitle">
            Join the discussion. Share your perspective and keep it respectful.
          </p>
        </div>
        <div className="comment-section__metrics" aria-hidden>
          <span>{comments.length} comments</span>
          <span>{totalReplies} replies</span>
        </div>
      </div>

      <div className="comment-form">
        {replyTarget && (
          <div className="comment-reply-banner">
            <span>
              Replying to{" "}
              <span className="comment-reply-banner__target">@{createMentionHandle(replyTarget.author)}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="comment-reply-banner__cancel"
              onClick={cancelReply}
            >
              Cancel
            </Button>
          </div>
        )}
        <div className="comment-form__row">
          <Input
            value={formName}
            onChange={(event) => setFormName(event.target.value)}
            placeholder="Your name (optional)"
            autoComplete="name"
            maxLength={80}
          />
        </div>
        <Textarea
          ref={textareaRef}
          value={formBody}
          onChange={(event) => setFormBody(event.target.value)}
          placeholder="Add to the conversation..."
          minLength={3}
          maxLength={1500}
          rows={4}
        />
        <div className="comment-form__actions">
          <Button
            onClick={handleSubmit}
            disabled={submitting || formBody.trim().length < 3}
            className="comment-form__submit"
          >
            {submitting ? "Sending…" : "Post Comment"}
          </Button>
        </div>
      </div>

      <div className="comment-thread">
        {loading ? (
          <div className="comment-skeleton-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="comment-skeleton">
                <div className="comment-skeleton__header" />
                <div className="comment-skeleton__body" />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="comment-empty">Be the first to share your thoughts.</p>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className={cn("comment-card", comment.is_admin && "comment-card--admin")}
            >
              <header className="comment-card__header">
                <div className="comment-card__author">
                  <span className="comment-card__name">{comment.author_name}</span>
                  {comment.is_admin && <span className="comment-card__badge">Editor</span>}
                </div>
                <div className="comment-card__meta">
                  <time className="comment-card__time" dateTime={comment.created_at}>
                    {formatTimestamp(comment.created_at)}
                  </time>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="comment-card__delete"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      aria-label="Delete comment"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </header>
              <p className="comment-card__body">{renderCommentBody(comment.body)}</p>

              <CommentReplies
                comment={comment}
                onReply={beginReply}
                onDelete={handleDelete}
                isAdmin={isAdmin}
                deletingId={deletingId}
              />
              <div className="comment-card__actions">
                <Button
                  variant="ghost"
                  size="sm"
                  className="comment-card__reply-button"
                  onClick={() => beginReply(comment.id, comment.author_name)}
                >
                  Reply
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  )
}

interface ReplyListProps {
  comment: Comment
  onReply: (id: string, author: string) => void
}

interface ReplyListProps {
  comment: Comment
  onReply: (id: string, author: string) => void
  onDelete: (id: string) => void
  isAdmin: boolean
  deletingId: string | null
}

function CommentReplies({ comment, onReply, onDelete, isAdmin, deletingId }: ReplyListProps) {
  if (comment.replies.length === 0) return null

  return (
    <div className="comment-card__replies">
      {comment.replies.map((reply) => (
        <div
          key={reply.id}
          className={cn("comment-reply", reply.is_admin && "comment-reply--admin")}
        >
          <div className="comment-reply__meta">
            <span className="comment-reply__name">{reply.author_name}</span>
            {reply.is_admin && <span className="comment-reply__badge">Editor</span>}
            <time className="comment-reply__time" dateTime={reply.created_at}>
              {formatTimestamp(reply.created_at)}
            </time>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="comment-reply__delete"
                onClick={() => onDelete(reply.id)}
                disabled={deletingId === reply.id}
                aria-label="Delete reply"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          <p className="comment-reply__body">{renderCommentBody(reply.body)}</p>
          <div className="comment-reply__actions">
            <Button
              variant="ghost"
              size="sm"
              className="comment-reply__reply-button"
              onClick={() => onReply(reply.id, reply.author_name)}
            >
              Reply
            </Button>
          </div>
          {reply.replies.length > 0 && (
            <div className="comment-reply__children">
              <CommentReplies
                comment={reply}
                onReply={onReply}
                onDelete={onDelete}
                isAdmin={isAdmin}
                deletingId={deletingId}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function removeComment(tree: Comment[], id: string): Comment[] {
  const result: Comment[] = []
  for (const node of tree) {
    if (node.id === id) continue
    const updatedReplies =
      node.replies.length > 0 ? removeComment(node.replies, id) : []
    result.push({
      ...node,
      replies: updatedReplies,
    })
  }
  return result
}
