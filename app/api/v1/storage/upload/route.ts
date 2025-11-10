import { NextResponse } from "next/server"
import { uploadImage, deleteImage } from "@/lib/supabase/storage"
import { createErrorResponse } from "@/lib/api/error-response"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const folder = formData.get("folder")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    const url = await uploadImage(
      file,
      typeof folder === "string" && folder.trim().length > 0 ? folder : undefined,
    )

    return NextResponse.json({ url })
  } catch (error) {
    return createErrorResponse("[api/v1/storage/upload]", error)
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const path = body?.path

    if (typeof path !== "string" || path.trim().length === 0) {
      return NextResponse.json({ error: "Path is required" }, { status: 400 })
    }

    await deleteImage(path)

    return NextResponse.json({ success: true })
  } catch (error) {
    return createErrorResponse("[api/v1/storage/upload]", error)
  }
}
