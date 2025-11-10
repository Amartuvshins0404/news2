import { NextResponse } from "next/server"
import type { NextResponse as NextResponseType } from "next/server"
import { createClient } from "@/lib/supabase/server"

type GuardResult =
  | {
      response: NextResponseType
      user?: undefined
    }
  | {
      response?: undefined
      user: {
        id: string
        email?: string
        role: string
      }
    }

export async function requireAdminUser(): Promise<GuardResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const role =
    (user.app_metadata?.role as string | undefined) ?? (user.user_metadata?.role as string | undefined) ?? "editor"

  if (role !== "admin") {
    return { response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? undefined,
      role,
    },
  }
}
