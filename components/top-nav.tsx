"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { localeNames, locales } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTheme } from "@/lib/theme-provider"
import type { LucideIcon } from "lucide-react"
import { Globe, Menu, Moon, Sun } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"

export function TopNav() {
  const { theme, setTheme } = useTheme()
  const { t, locale, changeLocale } = useTranslations("common")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  type NavLink = {
    href: string
    label: string
    icon?: LucideIcon
  }

  const navLinks: NavLink[] = [
    { href: "/", label: t("nav.home") },
    { href: "/explore", label: t("nav.explore") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Vo!ces"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              priority
            />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title={t("language.select")}>
                <Globe className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {locales.map((loc) => (
                <DropdownMenuItem
                  key={loc}
                  onClick={() => changeLocale(loc)}
                  className={locale === loc ? "bg-accent" : ""}
                >
                  {localeNames[loc]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title={t("theme.toggle")}>
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>{t("theme.light")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>{t("theme.dark")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>{t("theme.system")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
