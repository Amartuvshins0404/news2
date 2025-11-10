import { NextResponse } from "next/server"

import { createErrorResponse } from "@/lib/api/error-response"
import { requireAdminUser } from "@/lib/auth/server"
import { deleteComment, getCommentById, getCommentsForPost } from "@/lib/supabase-api"

export async function DELETE(_: Request, context: { params: { id: string } }) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const comment = await getCommentById(context.params.id)
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 })
    }

    await deleteComment(context.params.id)
    const updated = await getCommentsForPost(comment.post_id)

    return NextResponse.json(
      {
        success: true,
        comments: updated,
      },
      { status: 200 },
    )
  } catch (error) {
    return createErrorResponse("[api/v1/comments/[id]]", error)
  }
}
