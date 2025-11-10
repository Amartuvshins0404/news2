import { NextResponse } from "next/server"
import { createAttribute, getAttributes } from "@/lib/supabase-api"
import { requireAdminUser } from "@/lib/auth/server"
import { createErrorResponse } from "@/lib/api/error-response"

export async function GET(request: Request) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get("categoryId") ?? searchParams.get("category_id") ?? undefined
    const attributes = await getAttributes(categoryId || undefined)
    return NextResponse.json(attributes)
  } catch (error) {
    return createErrorResponse("[api/v1/attributes]", error)
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const body = await request.json()
    const attribute = await createAttribute(body)
    return NextResponse.json(attribute, { status: 201 })
  } catch (error) {
    return createErrorResponse("[api/v1/attributes]", error)
  }
}
