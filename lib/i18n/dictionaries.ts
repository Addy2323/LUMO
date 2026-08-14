import enMessages from '@/messages/en.json'
import swMessages from '@/messages/sw.json'

export const LOCALES = ['en', 'sw'] as const
export type Locale = (typeof LOCALES)[number]

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  sw: 'Kiswahili',
}

const dictionaries: Record<Locale, any> = {
  en: enMessages,
  sw: swMessages,
}

export async function getDictionary(locale: Locale = 'en') {
  return dictionaries[locale] || dictionaries.en
}

/** Get nested property from object by dot path e.g. "navigation.marketplace" */
function getNestedValue(obj: any, path: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined
  const parts = path.split('.')
  let current = obj
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      return undefined
    }
  }
  return typeof current === 'string' ? current : undefined
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const currentDict = dictionaries[locale] || dictionaries.en
  let message = getNestedValue(currentDict, key)

  // Fallback to English if missing in target locale
  if (message === undefined && locale !== 'en') {
    message = getNestedValue(dictionaries.en, key)
  }

  // Fallback to key itself if missing everywhere
  if (message === undefined) {
    return key
  }

  // Interpolate params e.g. {count}
  if (params) {
    Object.entries(params).forEach(([paramKey, value]) => {
      message = message!.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value))
    })
  }

  return message
}

export type MessageKey = string
