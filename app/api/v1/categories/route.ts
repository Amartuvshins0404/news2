import { NextResponse } from "next/server"
import { createCategory, getCategories } from "@/lib/supabase-api"
import { requireAdminUser } from "@/lib/auth/server"
import { createErrorResponse } from "@/lib/api/error-response"

export async function GET() {
  try {
    const categories = await getCategories()
    return NextResponse.json(categories)
  } catch (error) {
    return createErrorResponse("[api/v1/categories]", error)
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const body = await request.json()
    const category = await createCategory(body)
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    return createErrorResponse("[api/v1/categories]", error)
  }
}
