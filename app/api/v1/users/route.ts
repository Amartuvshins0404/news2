import { NextResponse } from "next/server"
import { createAuthor, getAuthors } from "@/lib/supabase-api"
import { requireAdminUser } from "@/lib/auth/server"
import { createErrorResponse } from "@/lib/api/error-response"

export async function GET() {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const authors = await getAuthors()
    return NextResponse.json(authors)
  } catch (error) {
    return createErrorResponse("[api/v1/users]", error)
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const body = await request.json()
    if (!body?.name || !body?.slug || !body?.role) {
      return NextResponse.json(
        { error: "Name, email, and role are required" },
        { status: 400 },
      )
    }

    const password =
      typeof body.password === "string" ? body.password.trim() : ""

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 },
      )
    }

    const author = await createAuthor({
      name: String(body.name).trim(),
      slug: String(body.slug).trim().toLowerCase(),
      role: body.role,
      bio: body.bio ?? null,
      avatar: body.avatar ?? null,
      password,
    })

    return NextResponse.json(author, { status: 201 })
  } catch (error) {
    return createErrorResponse("[api/v1/users]", error)
  }
}
