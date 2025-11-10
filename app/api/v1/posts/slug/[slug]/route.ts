import { NextResponse } from "next/server"

import { getPost } from "@/lib/supabase-api"

function errorResponse(error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : "Unknown error"
  console.error("[api/v1/posts/slug]", error)
  return NextResponse.json({ error: message }, { status })
}

export async function GET(_: Request, context: { params: { slug: string } }) {
  try {
    const post = await getPost(context.params.slug)
    if (!post) {
      return errorResponse(new Error("Post not found"), 404)
    }

    return NextResponse.json(post)
  } catch (error) {
    return errorResponse(error)
  }
}
