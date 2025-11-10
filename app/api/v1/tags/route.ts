import { NextResponse } from "next/server"
import { getTags } from "@/lib/supabase-api"
import { createErrorResponse } from "@/lib/api/error-response"

export async function GET() {
  try {
    const tags = await getTags()
    return NextResponse.json(tags)
  } catch (error) {
    return createErrorResponse("[api/v1/tags]", error)
  }
}
