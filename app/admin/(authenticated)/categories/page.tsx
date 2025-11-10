"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { apiClient } from "@/lib/api-client"
import { useTranslations } from "@/lib/i18n/use-translations"
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react"
import type { Category } from "@/lib/types"

export default function CategoriesPage() {
  const { t } = useTranslations("admin")
  const { t: tCommon } = useTranslations("common")
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", slug: "", description: "" })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const data = await apiClient.getAdminCategories()
      setCategories(data)
    } catch (error) {
      console.error("Failed to load categories:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditingId(category.id)
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
      })
    } else {
      setEditingId(null)
      setFormData({ name: "", slug: "", description: "" })
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    try {
      if (editingId) {
        await apiClient.updateCategory(editingId, formData)
      } else {
        await apiClient.createCategory(formData)
      }
      await loadCategories()
      setShowDialog(false)
    } catch (error) {
      console.error("Failed to save category:", error)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await apiClient.deleteCategory(deleteId)
      await loadCategories()
      setDeleteId(null)
    } catch (error) {
      console.error("Failed to delete category:", error)
    }
  }

  const categoryCountLabel =
    categories.length === 1
      ? t("categories.countSingular")
      : t("categories.countPlural", { count: categories.length })

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("categories.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("categories.subtitle")}</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("categories.createNew")}
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("categories.title")}</CardTitle>
            <CardDescription>{categoryCountLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("categories.form.name")}</TableHead>
                    <TableHead>{t("categories.form.slug")}</TableHead>
                    <TableHead>{t("categories.form.description")}</TableHead>
                    <TableHead className="text-right">{tCommon("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">{category.slug}</code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{category.description || "-"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(category)} className="gap-1">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(category.id)}
                          className="gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t("categories.edit") : t("categories.createNew")}</DialogTitle>
            <DialogDescription>
              {editingId ? t("categories.editDescription") : t("categories.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t("categories.form.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("categories.form.namePlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="slug">{t("categories.form.slug")}</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder={t("categories.form.slugPlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="description">{t("categories.form.description")}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("categories.form.descriptionPlaceholder")}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                {tCommon("cancel")}
              </Button>
              <Button onClick={handleSave}>
                {editingId ? tCommon("save") : tCommon("confirm")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>{t("categories.delete")}</AlertDialogTitle>
          <AlertDialogDescription>{t("categories.confirmDelete")}</AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("categories.delete")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
