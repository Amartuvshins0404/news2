"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { AdminNav } from "@/components/admin/admin-nav"

export default function AuthenticatedAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isDashboardVisible, setIsDashboardVisible] = useState(true)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/admin/login")
      } else if (user.role !== "admin") {
        router.push("/")
      }
    }
  }, [user, loading, router])

  useEffect(() => {
    const saved = localStorage.getItem("dashboardVisible")
    if (saved !== null) {
      setIsDashboardVisible(JSON.parse(saved))
    }
  }, [])

  const handleDashboardToggle = (isVisible: boolean) => {
    setIsDashboardVisible(isVisible)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="flex">
      <AdminNav onDashboardToggle={handleDashboardToggle} />
      <main className="flex-1 overflow-auto">{isDashboardVisible ? children : null}</main>
    </div>
  )
}
