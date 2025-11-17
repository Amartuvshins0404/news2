"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  ImageIcon,
  Users,
  LogOut,
  ExternalLink,
  Layers,
  Grid3x3,
  Moon,
  Sun,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTheme } from "@/lib/theme-provider"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface AdminNavProps {
  onDashboardToggle?: (isVisible: boolean) => void
}

export function AdminNav({ onDashboardToggle }: AdminNavProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { t } = useTranslations("admin")
  const { t: tCommon } = useTranslations("common")
  const { setTheme, resolvedTheme } = useTheme()
  const [isDashboardVisible, setIsDashboardVisible] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("dashboardVisible")
    if (saved !== null) {
      const visibility = JSON.parse(saved)
      setIsDashboardVisible(visibility)
    }
  }, [])

  const handleDashboardToggle = () => {
    const newVisibility = !isDashboardVisible
    setIsDashboardVisible(newVisibility)
    localStorage.setItem("dashboardVisible", JSON.stringify(newVisibility))
    onDashboardToggle?.(newVisibility)
  }

  const handleThemeToggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const navItems = [
    { href: "/admin/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/admin/posts", label: t("nav.posts"), icon: FileText },
    { href: "/admin/categories", label: t("nav.categories"), icon: Grid3x3 },
    { href: "/admin/attributes", label: t("nav.attributes"), icon: Layers },
    { href: "/admin/media", label: t("nav.media"), icon: ImageIcon },
    { href: "/admin/users", label: t("nav.users"), icon: Users },
  ]

  if (!mounted) return null

  return (
    <aside className="w-64 border-r bg-muted/40 min-h-screen flex flex-col">
      <div className="p-6 border-b">
        <Link href="/admin/dashboard" className="flex items-center">
          <Image
            src="/logo.png"
            alt={tCommon("brand.name")}
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
            priority
          />
        </Link>
        <p className="text-sm text-muted-foreground mt-1">{t("nav.tagline")}</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="mt-6 pt-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={handleThemeToggle}
            title={
              resolvedTheme === "dark"
                ? t("nav.themeToggle.switchToLight")
                : t("nav.themeToggle.switchToDark")
            }
          >
            {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span>
              {resolvedTheme === "dark" ? t("nav.themeToggle.light") : t("nav.themeToggle.dark")}
            </span>
          </Button>
        </div>
      </nav>

      <div className="p-4 border-t space-y-2">
        <Button variant="ghost" className="w-full justify-start gap-3" asChild>
          <Link href="/">
            <ExternalLink className="h-5 w-5" />
            {t("nav.viewSite")}
          </Link>
        </Button>

        {user && (
          <div className="px-3 py-2 text-sm">
            <div className="font-medium">{user.name}</div>
            <div className="text-muted-foreground text-xs">{t(`users.roles.${user.role}`)}</div>
          </div>
        )}

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          {t("nav.logout")}
        </Button>
      </div>
    </aside>
  )
}
