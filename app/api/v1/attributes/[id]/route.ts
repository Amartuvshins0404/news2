import { NextResponse } from "next/server"
import { deleteAttribute, updateAttribute } from "@/lib/supabase-api"
import { requireAdminUser } from "@/lib/auth/server"
import { createErrorResponse } from "@/lib/api/error-response"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const body = await request.json()
    const attribute = await updateAttribute(params.id, body)
    return NextResponse.json(attribute)
  } catch (error) {
    return createErrorResponse("[api/v1/attributes/[id]]", error)
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    await deleteAttribute(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return createErrorResponse("[api/v1/attributes/[id]]", error)
  }
}
