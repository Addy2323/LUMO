'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CurrencyCode = 'TZS' | 'USD' | 'KES' | 'UGX' | 'EUR' | 'GBP' | 'CNY'

export interface CurrencyConfig {
  code: CurrencyCode
  name: string
  symbol: string
  /** Number of TZS equivalent to 1 unit of this currency. e.g. USD = 2,600 TZS */
  rateToTZS: number
  locale: string
  fractionDigits: number
  countryName: string
}

export const SUPPORTED_CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  TZS: {
    code: 'TZS',
    name: 'Tanzanian Shilling',
    symbol: 'TZS',
    rateToTZS: 1,
    locale: 'sw-TZ',
    fractionDigits: 0,
    countryName: 'Tanzania',
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    rateToTZS: 2600,
    locale: 'en-US',
    fractionDigits: 2,
    countryName: 'United States',
  },
  KES: {
    code: 'KES',
    name: 'Kenyan Shilling',
    symbol: 'KSh',
    rateToTZS: 20.15,
    locale: 'sw-KE',
    fractionDigits: 0,
    countryName: 'Kenya',
  },
  UGX: {
    code: 'UGX',
    name: 'Ugandan Shilling',
    symbol: 'USh',
    rateToTZS: 0.71,
    locale: 'en-UG',
    fractionDigits: 0,
    countryName: 'Uganda',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    rateToTZS: 2835,
    locale: 'de-DE',
    fractionDigits: 2,
    countryName: 'European Union',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    rateToTZS: 3310,
    locale: 'en-GB',
    fractionDigits: 2,
    countryName: 'United Kingdom',
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan',
    symbol: '¥',
    rateToTZS: 361.11,
    locale: 'zh-CN',
    fractionDigits: 2,
    countryName: 'China',
  },
}

interface CurrencyState {
  currency: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  convertFromTZS: (amountTZS: number, targetCode?: CurrencyCode) => number
  formatAmount: (amountTZS: number, targetCode?: CurrencyCode) => string
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      currency: 'TZS',
      setCurrency: (code: CurrencyCode) => {
        if (SUPPORTED_CURRENCIES[code]) {
          set({ currency: code })
        }
      },
      convertFromTZS: (amountTZS: number, targetCode?: CurrencyCode) => {
        const activeCode = targetCode || get().currency
        const config = SUPPORTED_CURRENCIES[activeCode] || SUPPORTED_CURRENCIES.TZS
        if (config.rateToTZS === 1) return amountTZS
        return amountTZS / config.rateToTZS
      },
      formatAmount: (amountTZS: number, targetCode?: CurrencyCode) => {
        const activeCode = targetCode || get().currency
        const config = SUPPORTED_CURRENCIES[activeCode] || SUPPORTED_CURRENCIES.TZS

        const converted = config.rateToTZS === 1 ? amountTZS : amountTZS / config.rateToTZS

        const formatted = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: config.fractionDigits,
          maximumFractionDigits: config.fractionDigits,
        }).format(converted)

        if (config.code === 'TZS') {
          return `TZS ${formatted}`
        }
        if (config.code === 'USD' || config.code === 'EUR' || config.code === 'GBP' || config.code === 'CNY') {
          return `${config.symbol}${formatted}`
        }
        return `${config.symbol} ${formatted}`
      },
    }),
    {
      name: 'lumo.currency.v1',
    },
  ),
)

/** Reactive React hook for formatting amounts in client components */
export function useFormatPrice() {
  const currency = useCurrencyStore((s) => s.currency)
  const formatAmount = useCurrencyStore((s) => s.formatAmount)
  return (amountTZS: number) => formatAmount(amountTZS, currency)
}
