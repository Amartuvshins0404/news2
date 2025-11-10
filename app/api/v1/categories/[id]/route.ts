import { NextResponse } from "next/server"

import { createErrorResponse } from "@/lib/api/error-response"
import { requireAdminUser } from "@/lib/auth/server"
import { deleteCategory, updateCategory } from "@/lib/supabase-api"

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const body = await request.json()
    const category = await updateCategory(context.params.id, body)
    return NextResponse.json(category)
  } catch (error) {
    return createErrorResponse("[api/v1/categories/[id]]", error)
  }
}

export async function DELETE(_: Request, context: { params: { id: string } }) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    await deleteCategory(context.params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return createErrorResponse("[api/v1/categories/[id]]", error)
  }
}
