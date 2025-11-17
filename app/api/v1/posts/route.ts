import { NextResponse } from "next/server"
import { createPost, getPosts } from "@/lib/supabase-api"
import { requireAdminUser } from "@/lib/auth/server"
import { createErrorResponse } from "@/lib/api/error-response"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const publishedParam = searchParams.get("published")
    const limitParam = searchParams.get("limit")
    const categoryId = searchParams.get("categoryId") ?? searchParams.get("category_id") ?? undefined
    const categorySlug = searchParams.get("categorySlug") ?? searchParams.get("category_slug") ?? undefined
    const tagsParam = searchParams.get("tags")
    const sortBy = (searchParams.get("sortBy") ?? undefined) as "date" | "views" | "title" | undefined
    const statusParam = searchParams.get("status") as ("draft" | "scheduled" | "published") | null
    const pageType = searchParams.get("pageType") as "explore" | "faces" | null

    const posts = await getPosts({
      published: publishedParam ? publishedParam === "true" : undefined,
      limit: limitParam ? Number(limitParam) : undefined,
      categoryId: categoryId || undefined,
      categorySlug: categorySlug || undefined,
      search: searchParams.get("search") ?? undefined,
      tags: tagsParam ? tagsParam.split(",").filter(Boolean) : undefined,
      dateFrom: searchParams.get("dateFrom") ?? undefined,
      dateTo: searchParams.get("dateTo") ?? undefined,
      sortBy,
      status: statusParam ?? undefined,
      pageType: pageType ?? undefined,
    })

    return NextResponse.json({ data: posts, pagination: null })
  } catch (error) {
    return createErrorResponse("[api/v1/posts]", error)
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const body = await request.json()

    // Security: Always use the authenticated user's author ID to prevent impersonation
    // Ignore any author_id provided in the request body
    const secureBody = {
      ...body,
      author_id: guard.user.id, // Use authenticated user's ID, not from request body
    }

    const post = await createPost(secureBody)
    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    return createErrorResponse("[api/v1/posts]", error)
  }
}
