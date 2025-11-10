import { NextResponse } from "next/server"

import { createErrorResponse } from "@/lib/api/error-response"
import { createComment, getCommentById, getCommentsForPost, getPost } from "@/lib/supabase-api"

interface RouteContext {
  params: Promise<{ slug: string }>
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const post = await getPost(slug)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const comments = await getCommentsForPost(post.id)
    return NextResponse.json(comments)
  } catch (error) {
    return createErrorResponse("[api/v1/posts/slug/[slug]/comments]", error)
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const post = await getPost(slug)
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    const payload = await request.json().catch(() => null)
    const body = typeof payload?.body === "string" ? payload.body.trim() : ""
    const name =
      typeof payload?.name === "string" && payload.name.trim().length > 0
        ? payload.name.trim().slice(0, 80)
        : "Anonymous"
    const parentId =
      typeof payload?.parentId === "string" && payload.parentId.length > 0
        ? payload.parentId
        : undefined

    if (body.length < 3 || body.length > 1500) {
      return NextResponse.json(
        {
          error:
            "Comment text must be between 3 and 1500 characters to keep discussions constructive.",
        },
        { status: 400 },
      )
    }

    if (parentId) {
      const parentComment = await getCommentById(parentId)
      if (!parentComment || parentComment.post_id !== post.id) {
        return NextResponse.json(
          { error: "Invalid parent comment" },
          { status: 400 },
        )
      }
    }

    const created = await createComment({
      postId: post.id,
      authorName: name,
      body,
      parentId,
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return createErrorResponse("[api/v1/posts/slug/[slug]/comments]", error)
  }
}
