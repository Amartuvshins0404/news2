"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api-client"
import type { Category } from "@/lib/types"

export function CategoryNav() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.getCategories().then((data) => {
      setCategories(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="border-b bg-muted/20">
        <div className="container py-3">
          <div className="flex gap-2 overflow-x-auto">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 w-24 bg-muted animate-pulse rounded-md" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-b bg-muted/20">
      <div className="container py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <Button key={category.id} variant="ghost" size="sm" asChild>
              <Link href={`/category/${category.slug}`}>{category.name}</Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
