import { NextResponse } from "next/server"
import { deletePost, getPostById, updatePost } from "@/lib/supabase-api"
import { requireAdminUser } from "@/lib/auth/server"
import { createErrorResponse } from "@/lib/api/error-response"

type ParamsContext = { params: { id: string } | Promise<{ id: string }> }

export async function GET(_: Request, { params }: ParamsContext) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const { id } = await params

    const post = await getPostById(id)
    if (!post) {
      return createErrorResponse("[api/v1/posts/[id]]", new Error("Post not found"), 404)
    }

    return NextResponse.json(post)
  } catch (error) {
    return createErrorResponse("[api/v1/posts/[id]]", error)
  }
}

export async function PATCH(request: Request, { params }: ParamsContext) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const { id } = await params
    const body = await request.json()

    // Security: Prevent author_id from being changed to prevent impersonation
    // Remove author_id if present in request body (author_id cannot be changed after post creation)
    const { author_id, ...safeBody } = body

    const post = await updatePost(id, safeBody)
    return NextResponse.json(post)
  } catch (error) {
    return createErrorResponse("[api/v1/posts/[id]]", error)
  }
}

export async function DELETE(_: Request, { params }: ParamsContext) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const { id } = await params

    await deletePost(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return createErrorResponse("[api/v1/posts/[id]]", error)
  }
}
