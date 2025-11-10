"use client"

import { PostEditor } from "@/components/admin/post-editor"
import { useTranslations } from "@/lib/i18n/use-translations"

export default function NewPostPage() {
  const { t } = useTranslations("admin")

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("posts.createNew")}</h1>
        <p className="text-muted-foreground mt-1">{t("posts.createDescription")}</p>
      </div>

      <PostEditor />
    </div>
  )
}
