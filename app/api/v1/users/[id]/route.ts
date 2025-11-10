import { NextResponse } from "next/server"
import { deleteAuthor, updateAuthor } from "@/lib/supabase-api"
import { requireAdminUser } from "@/lib/auth/server"
import { createErrorResponse } from "@/lib/api/error-response"
import type { Author } from "@/lib/types"

type UserUpdatePayload = {
  name?: string
  slug?: string
  role?: Author["role"]
  bio?: string | null
  avatar?: string | null
  password?: string
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const { id } = await context.params

    const body = await request.json()
    const updates: UserUpdatePayload = {}

    if (body.name !== undefined) updates.name = String(body.name).trim()
    if (body.slug !== undefined) updates.slug = String(body.slug).trim().toLowerCase()
    if (body.role !== undefined) updates.role = body.role
    if (body.bio !== undefined) updates.bio = body.bio ?? null
    if (body.avatar !== undefined) updates.avatar = body.avatar ?? null

    if (body.password !== undefined) {
      const password = String(body.password).trim()
      if (password.length > 0 && password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters long" },
          { status: 400 },
        )
      }
      if (password.length > 0) {
        updates.password = password
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    const author = await updateAuthor(id, updates)
    return NextResponse.json(author)
  } catch (error) {
    return createErrorResponse("[api/v1/users/[id]]", error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const { id } = await context.params

    await deleteAuthor(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return createErrorResponse("[api/v1/users/[id]]", error)
  }
}
