import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { createErrorResponse } from "@/lib/api/error-response"
import { getPost, trackPageView } from "@/lib/supabase-api"

interface RouteContext {
  params: Promise<{ slug: string }>
}

const VIEW_COOKIE = "aurora.views"
const MAX_TRACKED_SLUGS = 32
const ONE_DAY_SECONDS = 60 * 60 * 24

export async function POST(_: Request, context: RouteContext) {
  try {
    const { slug } = await context.params
    const cookieStore = cookies()
    const viewedValue = cookieStore.get(VIEW_COOKIE)?.value ?? ""
    const viewedSlugs = viewedValue.length > 0 ? viewedValue.split(",") : []

    if (viewedSlugs.includes(slug)) {
      return NextResponse.json({ success: true, alreadyViewed: true }, { status: 200 })
    }

    const post = await getPost(slug)

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    await trackPageView(post.id)

    const updatedSlugs = [slug, ...viewedSlugs.filter((item) => item !== slug)].slice(
      0,
      MAX_TRACKED_SLUGS,
    )

    const response = NextResponse.json({ success: true }, { status: 202 })
    response.cookies.set({
      name: VIEW_COOKIE,
      value: updatedSlugs.join(","),
      httpOnly: true,
      sameSite: "lax",
      maxAge: ONE_DAY_SECONDS,
      path: "/",
    })

    return response
  } catch (error) {
    return createErrorResponse("[api/v1/posts/slug/[slug]/view]", error)
  }
}
