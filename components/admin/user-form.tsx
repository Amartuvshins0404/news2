"use client"

import Image from "next/image"
import type React from "react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "@/lib/i18n/use-translations"
import { uploadImage } from "@/lib/supabase/storage"
import type { Author } from "@/lib/types"

interface UserFormProps {
  user?: Author
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (user: {
    name: string
    slug: string
    role: Author["role"]
    bio?: string | null
    avatar?: string | null
    password?: string
  }) => Promise<void>
}

export function UserForm({ user, open, onOpenChange, onSave }: UserFormProps) {
  const { t } = useTranslations("admin")
  const { t: tCommon } = useTranslations("common")
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "editor" | "contributor">("contributor")
  const [bio, setBio] = useState("")
  const [avatarPreview, setAvatarPreviewState] = useState("")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const updateAvatarPreview = (value: string) => {
    if (previewUrlRef.current && previewUrlRef.current.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    previewUrlRef.current = value || null
    setAvatarPreviewState(value)
  }

  useEffect(() => {
    if (open) {
      setName(user?.name || "")
      setEmail(user?.slug || "")
      setRole((user?.role as "admin" | "editor" | "contributor") || "contributor")
      setBio(user?.bio || "")
      setAvatarFile(null)
      updateAvatarPreview(user?.avatar || "")
      setPassword("")
      setConfirmPassword("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current && previewUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast({
        title: t("users.form.errors.invalidImageTitle"),
        description: t("users.form.errors.invalidImageDescription"),
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("users.form.errors.imageTooLargeTitle"),
        description: t("users.form.errors.imageTooLargeDescription"),
        variant: "destructive",
      })
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setAvatarFile(file)
    updateAvatarPreview(objectUrl)
  }

  const handleAvatarRemove = () => {
    setAvatarFile(null)
    updateAvatarPreview("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!name.trim() || !email.trim()) {
      toast({
        title: t("users.form.errors.missingInfoTitle"),
        description: t("users.form.errors.missingInfoDescription"),
        variant: "destructive",
      })
      return
    }

    const trimmedPassword = password.trim()
    const trimmedConfirm = confirmPassword.trim()

    if (!user && trimmedPassword.length < 6) {
      toast({
        title: t("users.form.errors.invalidPasswordTitle"),
        description: t("users.form.errors.passwordTooShort"),
        variant: "destructive",
      })
      return
    }

    if ((trimmedPassword || trimmedConfirm) && trimmedPassword !== trimmedConfirm) {
      toast({
        title: t("users.form.errors.passwordMismatchTitle"),
        description: t("users.form.errors.passwordMismatchDescription"),
        variant: "destructive",
      })
      return
    }

    if (trimmedPassword && trimmedPassword.length < 6) {
      toast({
        title: t("users.form.errors.invalidPasswordTitle"),
        description: t("users.form.errors.passwordTooShort"),
        variant: "destructive",
      })
      return
    }

    try {
      setSubmitting(true)
      let avatarUrl = avatarPreview

      if (avatarFile) {
        avatarUrl = await uploadImage(avatarFile, "avatars")
      }

      const payload: {
        name: string
        slug: string
        role: Author["role"]
        bio?: string | null
        avatar?: string | null
        password?: string
      } = {
        name: name.trim(),
        slug: email.trim().toLowerCase(),
        role,
        bio: bio.trim() ? bio.trim() : null,
        avatar: avatarUrl ? avatarUrl : null,
      }

      if (!user || trimmedPassword) {
        payload.password = trimmedPassword
      }

      await onSave(payload)

      setAvatarFile(null)
      updateAvatarPreview(avatarUrl ?? "")
      setPassword("")
      setConfirmPassword("")
      onOpenChange(false)
    } catch (error) {
      toast({
        title: t("users.notifications.saveFailed.title"),
        description: error instanceof Error ? error.message : t("users.notifications.saveFailed.description"),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{user ? t("users.edit") : t("users.createNew")}</DialogTitle>
            <DialogDescription>
              {user ? t("users.form.editDescription") : t("users.form.createDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("users.form.name")} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("users.form.namePlaceholder")}
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("users.form.email")} *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("users.form.emailPlaceholder")}
                required
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">{t("users.form.role")} *</Label>
              <Select
                value={role}
                onValueChange={(value) =>
                  setRole(value as "admin" | "editor" | "contributor")
                }
              >
                <SelectTrigger disabled={submitting}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t("users.roles.admin")}</SelectItem>
                  <SelectItem value="editor">{t("users.roles.editor")}</SelectItem>
                  <SelectItem value="contributor">{t("users.roles.contributor")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">{t("users.form.bio")}</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("users.form.bioPlaceholder")}
                rows={3}
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {user ? t("users.form.passwordOptional") : t("users.form.passwordRequired")}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  user ? t("users.form.passwordPlaceholderExisting") : t("users.form.passwordPlaceholder")
                }
                disabled={submitting}
                required={!user}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {user
                  ? t("users.form.confirmPasswordOptional")
                  : t("users.form.confirmPasswordRequired")}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={
                  user
                    ? t("users.form.confirmPasswordPlaceholderExisting")
                    : t("users.form.confirmPasswordPlaceholder")
                }
                disabled={submitting}
                required={!user}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("users.form.avatar")}</Label>
              <div className="border rounded-lg p-4">
                {avatarPreview ? (
                  <div className="flex items-start gap-4">
                    <Image
                      src={avatarPreview}
                      alt={t("users.form.avatarPreviewAlt")}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={submitting}
                      >
                        {t("users.form.changeAvatar")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAvatarRemove}
                        disabled={submitting}
                      >
                        {tCommon("remove")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="text-sm text-muted-foreground text-center">
                      {t("users.form.avatarPrompt")}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={submitting}
                    >
                      {t("users.form.chooseImage")}
                    </Button>
                    <p className="text-xs text-muted-foreground">{t("users.form.avatarHelpText")}</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                  disabled={submitting}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              {tCommon("cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? t("users.form.status.saving") : tCommon("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
