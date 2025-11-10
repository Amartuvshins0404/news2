"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

import { UserForm } from "@/components/admin/user-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { useTranslations } from "@/lib/i18n/use-translations"
import type { Author } from "@/lib/types"
import { Edit, Plus, Trash2 } from "lucide-react"

export default function UsersPage() {
  const { t } = useTranslations("admin")
  const { t: tCommon } = useTranslations("common")
  const { toast } = useToast()
  const [users, setUsers] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Author | undefined>()

  useEffect(() => {
    apiClient.getUsers().then((data) => {
      setUsers(data)
      setLoading(false)
    })
  }, [])

  type UserPayload = {
    name: string
    slug: string
    role: Author["role"]
    bio?: string | null
    avatar?: string | null
    password?: string
  }

  const handleSave = async (data: UserPayload) => {
    try {
      if (!editingUser && (!data.password || data.password.length < 6)) {
        throw new Error(t("users.errors.passwordTooShort"))
      }

      if (editingUser) {
        const { password, ...rest } = data
        const updated = await apiClient.updateUser(editingUser.id, {
          ...rest,
          ...(password ? { password } : {}),
        })
        setUsers((prev) => prev.map((user) => (user.id === updated.id ? updated : user)))
        toast({
          title: t("users.notifications.updated.title"),
          description: t("users.notifications.updated.description"),
        })
      } else {
        if (!data.password) {
          throw new Error(t("users.errors.passwordRequired"))
        }

        const created = await apiClient.createUser({
          name: data.name,
          slug: data.slug,
          role: data.role,
          bio: data.bio ?? null,
          avatar: data.avatar ?? null,
          password: data.password,
        })
        setUsers((prev) => [...prev, created])
        toast({
          title: t("users.notifications.created.title"),
          description: t("users.notifications.created.description"),
        })
      }
      setEditingUser(undefined)
    } catch (error) {
      throw (error instanceof Error ? error : new Error(t("users.notifications.saveFailed.description")))
    }
  }

  const handleEdit = (user: Author) => {
    setEditingUser(user)
    setFormOpen(true)
  }

  const handleCreate = () => {
    setEditingUser(undefined)
    setFormOpen(true)
  }

  const handleDelete = async (user: Author) => {
    const confirmed = window.confirm(
      t("users.confirmDeletePrompt", { name: user.name }),
    )
    if (!confirmed) return

    try {
      await apiClient.deleteUser(user.id)
      setUsers((prev) => prev.filter((item) => item.id !== user.id))
      toast({
        title: t("users.notifications.deleted.title"),
        description: t("users.notifications.deleted.description"),
      })
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: t("users.notifications.deleteFailed"),
        variant: "destructive",
      })
    }
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      admin: "default",
      editor: "secondary",
      contributor: "outline",
    }
    return <Badge variant={variants[role] || "outline"}>{t(`users.roles.${role}`)}</Badge>
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{t("users.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("users.subtitle")}</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("users.createNew")}
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("users.table.user")}</TableHead>
              <TableHead>{t("users.table.email")}</TableHead>
              <TableHead>{t("users.table.role")}</TableHead>
              <TableHead>{t("users.table.bio")}</TableHead>
              <TableHead className="w-[140px]">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Image
                      src={user.avatar || "/placeholder.svg?height=40&width=40"}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <span className="font-medium">{user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{user.slug}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell className="max-w-xs">
                  <p className="text-sm text-muted-foreground truncate">
                    {user.bio || t("users.table.noBio")}
                  </p>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UserForm user={editingUser} open={formOpen} onOpenChange={setFormOpen} onSave={handleSave} />
    </div>
  )
}
