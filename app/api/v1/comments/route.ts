import { NextResponse } from "next/server"

import { createErrorResponse } from "@/lib/api/error-response"
import { requireAdminUser } from "@/lib/auth/server"
import { getCommentsForPost, getRecentComments } from "@/lib/supabase-api"

export async function GET(request: Request) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const postId = searchParams.get("postId")
    const limit = Math.max(
      1,
      Math.min(50, limitParam ? Number.parseInt(limitParam, 10) || 10 : 10),
    )

    const comments = postId
      ? await getCommentsForPost(postId)
      : await getRecentComments(limit)
    return NextResponse.json(comments)
  } catch (error) {
    return createErrorResponse("[api/v1/comments]", error)
  }
}
