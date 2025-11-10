"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import type { Category, Attribute } from "@/lib/types"

export default function AttributesPage() {
  const { t } = useTranslations("admin")
  const { t: tCommon } = useTranslations("common")
  const [categories, setCategories] = useState<Category[]>([])
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", slug: "", description: "", category_id: "" })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [cats, attrs] = await Promise.all([apiClient.getAdminCategories(), apiClient.getAdminAttributes()])
      setCategories(cats)
      setAttributes(attrs)
      if (cats.length > 0) {
        setSelectedCategory(cats[0].id)
      }
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAttributes = selectedCategory
    ? attributes.filter((a) => a.category_id === selectedCategory)
    : attributes

  const handleOpenDialog = (attribute?: Attribute) => {
    if (attribute) {
      setEditingId(attribute.id)
      setFormData({
        name: attribute.name,
        slug: attribute.slug,
        description: attribute.description || "",
        category_id: attribute.category_id,
      })
    } else {
      setEditingId(null)
      setFormData({ name: "", slug: "", description: "", category_id: selectedCategory || "" })
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    try {
      if (editingId) {
        await apiClient.updateAttribute(editingId, formData)
      } else {
        await apiClient.createAttribute(formData)
      }
      await loadData()
      setShowDialog(false)
    } catch (error) {
      console.error("Failed to save attribute:", error)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await apiClient.deleteAttribute(deleteId)
      await loadData()
      setDeleteId(null)
    } catch (error) {
      console.error("Failed to delete attribute:", error)
    }
  }

  const attributeCountLabel =
    filteredAttributes.length === 1
      ? t("attributes.countSingular")
      : t("attributes.countPlural", { count: filteredAttributes.length })

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("attributes.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("attributes.subtitle")}</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("attributes.createNew")}
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("attributes.filterByCategory")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
              <CardHeader>
                <CardTitle>{t("attributes.title")}</CardTitle>
              <CardDescription>{attributeCountLabel}</CardDescription>
              </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("attributes.form.name")}</TableHead>
                      <TableHead>{t("attributes.form.slug")}</TableHead>
                      <TableHead>{t("attributes.form.category")}</TableHead>
                      <TableHead>{t("attributes.form.description")}</TableHead>
                      <TableHead className="text-right">{tCommon("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttributes.map((attribute) => (
                      <TableRow key={attribute.id}>
                        <TableCell className="font-medium">{attribute.name}</TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">{attribute.slug}</code>
                        </TableCell>
                        <TableCell>{categories.find((c) => c.id === attribute.category_id)?.name || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{attribute.description || "-"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(attribute)}
                            className="gap-1"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(attribute.id)}
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
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t("attributes.edit") : t("attributes.createNew")}</DialogTitle>
            <DialogDescription>
              {editingId ? t("attributes.editDescription") : t("attributes.createDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">{t("attributes.form.category")}</Label>
              <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
                  <Label htmlFor="name">{t("attributes.form.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t("attributes.form.namePlaceholder")}
              />
            </div>
            <div>
                  <Label htmlFor="slug">{t("attributes.form.slug")}</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder={t("attributes.form.slugPlaceholder")}
              />
            </div>
            <div>
                  <Label htmlFor="description">{t("attributes.form.description")}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t("attributes.form.descriptionPlaceholder")}
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
          <AlertDialogTitle>{t("attributes.delete")}</AlertDialogTitle>
          <AlertDialogDescription>{t("attributes.confirmDelete")}</AlertDialogDescription>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("attributes.delete")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
