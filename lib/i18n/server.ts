import { defaultLocale, type Locale } from "./config"
import { getTranslations } from "./translations"

type TranslationParams = Record<string, string | number>

function resolveKey(tree: Record<string, any>, key: string) {
  return key.split(".").reduce<any>((value, segment) => {
    if (value && typeof value === "object" && segment in value) {
      return value[segment]
    }
    return undefined
  }, tree)
}

export function getServerTranslator(namespace: string, locale?: Locale) {
  const selectedLocale = locale ?? defaultLocale
  const dictionary = getTranslations(selectedLocale, namespace)

  return (key: string, params?: TranslationParams): string => {
    const raw = resolveKey(dictionary, key)

    if (typeof raw !== "string") {
      return key
    }

    if (!params) {
      return raw
    }

    return Object.entries(params).reduce(
      (result, [paramKey, paramValue]) =>
        result.replace(new RegExp(`{{${paramKey}}}`, "g"), String(paramValue)),
      raw,
    )
  }
}
