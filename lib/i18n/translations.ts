import commonEn from "./locales/en/common.json"
import adminEn from "./locales/en/admin.json"
import commonMn from "./locales/mn/common.json"
import adminMn from "./locales/mn/admin.json"
import type { Locale } from "./config"

type TranslationObject = Record<string, any>

export const translations: Record<Locale, Record<string, TranslationObject>> = {
  en: {
    common: commonEn,
    admin: adminEn,
  },
  mn: {
    common: commonMn,
    admin: adminMn,
  },
}

export function getTranslations(locale: Locale, namespace: string): TranslationObject {
  return translations[locale]?.[namespace] || {}
}
