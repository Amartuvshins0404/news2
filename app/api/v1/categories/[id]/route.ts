import { NextResponse } from "next/server"
import { deleteCategory, updateCategory } from "@/lib/supabase-api"
import { requireAdminUser } from "@/lib/auth/server"
import { createErrorResponse } from "@/lib/api/error-response"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const body = await request.json()
    const category = await updateCategory(params.id, body)
    return NextResponse.json(category)
  } catch (error) {
    return createErrorResponse("[api/v1/categories/[id]]", error)
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    await deleteCategory(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return createErrorResponse("[api/v1/categories/[id]]", error)
  }
}
