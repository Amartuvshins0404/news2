import { NextResponse } from "next/server"

function extractErrorMessage(error: unknown): string {
  if (!error) return "Unknown error"

  if (error instanceof Error) {
    return error.message || "Unknown error"
  }

  if (typeof error === "object" && "message" in (error as Record<string, unknown>)) {
    const message = (error as Record<string, unknown>).message
    if (typeof message === "string" && message.trim().length > 0) {
      return message
    }
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return "Unknown error"
  }
}

export function createErrorResponse(context: string, error: unknown, status = 500) {
  console.error(context, error)
  const resolvedStatus =
    typeof (error as { status?: number })?.status === "number"
      ? Number((error as { status?: number }).status)
      : status
  return NextResponse.json({ error: extractErrorMessage(error) }, { status: resolvedStatus })
}
