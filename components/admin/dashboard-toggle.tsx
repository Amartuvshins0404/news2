"use client"

import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardToggleProps {
  onToggle: (isVisible: boolean) => void
}

export function DashboardToggle({ onToggle }: DashboardToggleProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("dashboardVisible")
    if (saved !== null) {
      const visibility = JSON.parse(saved)
      setIsVisible(visibility)
      onToggle(visibility)
    }
  }, [onToggle])

  const handleToggle = () => {
    const newVisibility = !isVisible
    setIsVisible(newVisibility)
    localStorage.setItem("dashboardVisible", JSON.stringify(newVisibility))
    onToggle(newVisibility)
  }

  if (!mounted) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="gap-2 bg-transparent"
      title={isVisible ? "Hide dashboard" : "Show dashboard"}
    >
      {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      <span>{isVisible ? "Hide" : "Show"}</span>
    </Button>
  )
}
