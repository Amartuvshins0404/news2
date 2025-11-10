"use client"

import { useEffect, useState } from "react"
import type { Locale } from "./config"
import { getTranslations } from "./translations"

type TranslationObject = Record<string, any>

export function useTranslations(namespace = "common") {
  const [locale, setLocale] = useState<Locale>("en")
  const [t, setT] = useState<TranslationObject>({})

  useEffect(() => {
    const storedLocale = (localStorage.getItem("locale") as Locale) || "en"
    setLocale(storedLocale)
    setT(getTranslations(storedLocale, namespace))
  }, [namespace])

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem("locale", newLocale)
    setT(getTranslations(newLocale, namespace))
  }

  const translate = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".")
    let value: any = t

    for (const k of keys) {
      if (value && typeof value === "object") {
        value = value[k]
      } else {
        return key
      }
    }

    if (typeof value !== "string") return key

    if (params) {
      return Object.entries(params).reduce(
        (str, [param, val]) => str.replace(new RegExp(`{{${param}}}`, "g"), String(val)),
        value,
      )
    }

    return value
  }

  return { t: translate, locale, changeLocale }
}
