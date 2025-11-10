import { NextResponse } from "next/server"
import { getAuthorBySlug } from "@/lib/supabase-api"
import { createErrorResponse } from "@/lib/api/error-response"

export async function GET(_: Request, context: { params: { slug: string } }) {
  try {
    const author = await getAuthorBySlug(context.params.slug)
    if (!author) {
      return createErrorResponse("[api/v1/authors/[slug]]", new Error("Author not found"), 404)
    }

    return NextResponse.json(author)
  } catch (error) {
    return createErrorResponse("[api/v1/authors/[slug]]", error)
  }
}
