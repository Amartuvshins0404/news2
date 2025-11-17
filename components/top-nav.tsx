"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { localeNames, locales } from "@/lib/i18n/config"
import { useTranslations } from "@/lib/i18n/use-translations"
import { useTheme } from "@/lib/theme-provider"
import type { LucideIcon } from "lucide-react"
import { Globe, Menu, Moon, Search, Sun } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export function TopNav() {
  const { theme, setTheme } = useTheme()
  const { t, locale, changeLocale } = useTranslations("common")
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  type NavLink = {
    href: string
    label: string
    icon?: LucideIcon
  }

  const leftNavLinks: NavLink[] = [
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ]

  const navLinks: NavLink[] = [
    { href: "/explore", label: "Voices" },
    { href: "/faces", label: "Faces" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <nav className="container flex h-16 items-center justify-between">
        {/* Left Navigation Links */}
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6">
            {leftNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Centered Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link href="/explore" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Vo!ces"
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              priority
            />
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Search Icon */}
          <Button variant="ghost" size="icon" title="Search" asChild>
            <Link href="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>

          {/* Theme Toggle - Sun Icon */}
          <Button
            variant="ghost"
            size="icon"
            title={t("theme.toggle")}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Newsletter Button */}
          <Button
            className="bg-[#EC4899] hover:bg-[#EC4899]/90 text-white hidden md:flex"
            size="sm"
            asChild
          >
            <Link href="/contact">
              + Newsletter
            </Link>
          </Button>

          {/* Language Switcher - Hidden on desktop, shown on mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title={t("language.select")} className="md:hidden">
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
            {leftNavLinks.map((link) => (
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
