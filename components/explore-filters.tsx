"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useTranslations } from "@/lib/i18n/use-translations"
import type { Category, Tag } from "@/lib/types"

interface ExploreFiltersProps {
  categories: Category[]
  tags: Tag[]
  selectedCategory: string
  selectedTags: string[]
  dateFrom: string
  dateTo: string
  sortBy: "date" | "views" | "title"
  onCategoryChange: (category: string) => void
  onTagsChange: (tags: string[]) => void
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  onSortChange: (sort: "date" | "views" | "title") => void
  onApply: () => void
  onReset: () => void
}

export function ExploreFilters({
  categories,
  tags,
  selectedCategory,
  selectedTags,
  dateFrom,
  dateTo,
  sortBy,
  onCategoryChange,
  onTagsChange,
  onDateFromChange,
  onDateToChange,
  onSortChange,
  onApply,
  onReset,
}: ExploreFiltersProps) {
  const { t } = useTranslations("common")
  const [expanded, setExpanded] = useState(true)

  const toggleTag = (tagSlug: string) => {
    onTagsChange(
      selectedTags.includes(tagSlug) ? selectedTags.filter((t) => t !== tagSlug) : [...selectedTags, tagSlug],
    )
  }

  const hasActiveFilters =
    selectedCategory !== "all" || selectedTags.length > 0 || dateFrom || dateTo || sortBy !== "date"

  return (
    <div className="w-full">
      {/* Filter Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 bg-secondary/50 hover:bg-secondary/70 transition-colors border-b border-border/50"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground">{t("explore.refineResults")}</h3>
            {hasActiveFilters && <p className="text-xs text-muted-foreground">{t("explore.filtersApplied")}</p>}
          </div>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {/* Filter Content */}
      {expanded && (
        <div className="bg-background border-b border-border/50">
          <div className="container max-w-5xl mx-auto px-4 py-6">
            <div className="space-y-6">
              {/* Primary Filters Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div className="space-y-2.5">
                  <Label htmlFor="category-select" className="text-sm font-semibold block">
                    {t("explore.category")}
                  </Label>
                  <Select value={selectedCategory} onValueChange={onCategoryChange}>
                    <SelectTrigger
                      id="category-select"
                      className="h-10 border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <SelectValue placeholder={t("explore.allCategories")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("explore.allCategories")}</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.slug}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort By */}
                <div className="space-y-2.5">
                  <Label htmlFor="sort-select" className="text-sm font-semibold block">
                    {t("explore.sortBy")}
                  </Label>
                  <Select value={sortBy} onValueChange={(v) => onSortChange(v as any)}>
                    <SelectTrigger
                      id="sort-select"
                      className="h-10 border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">{t("explore.sortDate")}</SelectItem>
                      <SelectItem value="views">{t("explore.sortViews")}</SelectItem>
                      <SelectItem value="title">{t("explore.sortTitle")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date From */}
                <div className="space-y-2.5">
                  <Label htmlFor="date-from" className="text-sm font-semibold block">
                    {t("explore.from")}
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => onDateFromChange(e.target.value)}
                    className="h-10 border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                  />
                </div>

                {/* Date To */}
                <div className="space-y-2.5">
                  <Label htmlFor="date-to" className="text-sm font-semibold block">
                    {t("explore.to")}
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => onDateToChange(e.target.value)}
                    className="h-10 border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
                  />
                </div>
              </div>

              {/* Tags Filter - Beautiful Grid */}
              {tags.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <Label className="text-sm font-semibold block">{t("explore.tags")}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {tags.map((tag) => (
                      <div
                        key={tag.id}
                        className="flex items-center gap-2.5 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
                        onClick={() => toggleTag(tag.slug)}
                      >
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={selectedTags.includes(tag.slug)}
                          onCheckedChange={() => toggleTag(tag.slug)}
                          className="h-4 w-4"
                        />
                        <label
                          htmlFor={`tag-${tag.id}`}
                          className="text-sm font-medium cursor-pointer flex-1 group-hover:text-primary transition-colors"
                        >
                          {tag.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border/50">
                <Button
                  onClick={onApply}
                  className="flex-1 h-10 font-semibold bg-primary hover:bg-primary/90 transition-colors"
                >
                  {t("explore.apply")}
                </Button>
                <Button
                  onClick={onReset}
                  variant="outline"
                  className="flex-1 h-10 font-semibold border-border/50 hover:bg-muted/50 transition-colors bg-transparent"
                >
                  {t("explore.reset")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
