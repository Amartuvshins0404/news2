import { NextResponse } from "next/server"
import { getDashboardStats } from "@/lib/supabase-api"
import { requireAdminUser } from "@/lib/auth/server"
import { createErrorResponse } from "@/lib/api/error-response"

export async function GET() {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const stats = await getDashboardStats()
    return NextResponse.json(stats)
  } catch (error) {
    return createErrorResponse("[api/v1/dashboard]", error)
  }
}
