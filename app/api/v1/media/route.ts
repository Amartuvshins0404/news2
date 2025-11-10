import { NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server"
import { createErrorResponse } from "@/lib/api/error-response"
import { deleteImage, listMediaAssets, uploadMediaAsset } from "@/lib/supabase/storage"

export async function GET(request: Request) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get("folder") ?? undefined

    const files = await listMediaAssets(folder)
    return NextResponse.json(files)
  } catch (error) {
    return createErrorResponse("[api/v1/media]", error)
  }
}

export async function POST(request: Request) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const formData = await request.formData()
    const file = formData.get("file")
    const folder = formData.get("folder")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const uploaded = await uploadMediaAsset(
      file,
      typeof folder === "string" && folder.trim().length > 0 ? folder : undefined,
    )

    return NextResponse.json(uploaded, { status: 201 })
  } catch (error) {
    return createErrorResponse("[api/v1/media]", error)
  }
}

export async function DELETE(request: Request) {
  try {
    const guard = await requireAdminUser()
    if (guard.response) return guard.response

    const body = await request.json().catch(() => null)
    const path = (body?.id ?? body?.path) as string | undefined

    if (typeof path !== "string" || path.trim().length === 0) {
      return NextResponse.json({ error: "Media path is required" }, { status: 400 })
    }

    await deleteImage(path)

    return NextResponse.json({ success: true })
  } catch (error) {
    return createErrorResponse("[api/v1/media]", error)
  }
}
