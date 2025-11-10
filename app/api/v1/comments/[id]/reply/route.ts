import { NextResponse } from "next/server"

import { createErrorResponse } from "@/lib/api/error-response"
import { requireAdminUser } from "@/lib/auth/server"
import { createComment, getAuthorById, getCommentById } from "@/lib/supabase-api"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const payload = await request.json().catch(() => null)
    const body =
      typeof payload?.body === "string" ? payload.body.trim().slice(0, 2000) : ""

    if (body.length < 2) {
      return NextResponse.json(
        { error: "Reply text must include at least 2 characters." },
        { status: 400 },
      )
    }

    const { id } = await context.params
    const comment = await getCommentById(id)
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    const adminAuthor = await getAuthorById(guard.user.id)
    const adminName =
      adminAuthor?.name ??
      guard.user.email ??
      guard.user.id.substring(0, 8).toUpperCase()

    const reply = await createComment({
      postId: comment.post_id,
      parentId: comment.id,
      authorName: adminName,
      body,
      adminId: guard.user.id,
      isAdmin: true,
    })

    return NextResponse.json(reply, { status: 201 })
  } catch (error) {
    return createErrorResponse("[api/v1/comments/[id]/reply]", error)
  }
}
