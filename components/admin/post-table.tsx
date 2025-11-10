"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import type { Post } from "@/lib/types"
import { MoreVertical, Edit, Trash2, Eye } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface PostTableProps {
  posts: Post[]
  onPostsChange: () => void
}

export function PostTable({ posts, onPostsChange }: PostTableProps) {
  const { t } = useTranslations("admin")
  const { t: tCommon } = useTranslations("common")
  const { toast } = useToast()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      await apiClient.deletePost(deleteId)
      toast({
        title: t("posts.success.deleted"),
        description: t("posts.success.deletedDescription"),
      })
      onPostsChange()
    } catch (error) {
      toast({
        title: tCommon("error"),
        description: t("posts.notifications.deleteFailed"),
        variant: "destructive",
      })
    } finally {
      setDeleteId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      published: "default",
      draft: "secondary",
      scheduled: "outline",
    }
    return (
      <Badge variant={variants[status] || "secondary"}>
        {t(`posts.status.${status}`)}
      </Badge>
    )
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("posts.table.title")}</TableHead>
              <TableHead>{t("posts.table.category")}</TableHead>
              <TableHead>{t("posts.table.status")}</TableHead>
              <TableHead>{t("posts.table.author")}</TableHead>
              <TableHead>{t("posts.table.views")}</TableHead>
              <TableHead>{t("posts.table.date")}</TableHead>
              <TableHead className="w-[70px]">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t("posts.emptyState")}
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <div>
                      <Link href={`/admin/posts/${post.id}`} className="font-medium hover:text-primary">
                        {post.title}
                      </Link>
                      {post.is_featured && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {t("posts.featured")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{post.category.name}</TableCell>
                  <TableCell>{getStatusBadge(post.status)}</TableCell>
                  <TableCell>{post.author.name}</TableCell>
                  <TableCell>{post.views}</TableCell>
                  <TableCell>{new Date(post.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/posts/${post.id}`} className="cursor-pointer">
                            <Edit className="mr-2 h-4 w-4" />
                            {t("posts.edit")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/post/${post.slug}`} target="_blank" className="cursor-pointer">
                            <Eye className="mr-2 h-4 w-4" />
                            {t("posts.viewPublic")}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive cursor-pointer"
                          onClick={() => setDeleteId(post.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("posts.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("posts.delete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("posts.confirmDelete")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t("posts.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
