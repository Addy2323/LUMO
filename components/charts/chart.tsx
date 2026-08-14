'use client'

import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
  DatasetComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  DatasetComponent,
  CanvasRenderer,
])

export type ChartTokens = {
  primary: string
  info: string
  success: string
  warning: string
  danger: string
  text: string
  muted: string
  border: string
  surface: string
}

function readTokens(): ChartTokens {
  const styles = getComputedStyle(document.documentElement)
  const get = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback

  return {
    primary: get('--primary-400', '#1D9E75'),
    info: get('--info-400', '#378ADD'),
    success: get('--success-400', '#639922'),
    warning: get('--warning-400', '#EF9F27'),
    danger: get('--danger-400', '#E24B4A'),
    text: get('--text-primary', '#2C2C2A'),
    muted: get('--text-muted', '#888780'),
    border: get('--border', '#D3D1C7'),
    surface: get('--surface-1', '#FFFFFF'),
  }
}

/**
 * Thin ECharts wrapper. The option is built from live design tokens so charts
 * follow the light/dark theme without any hardcoded colours.
 */
export function Chart({
  buildOption,
  height = 280,
  className,
  ariaLabel,
}: {
  buildOption: (tokens: ChartTokens) => echarts.EChartsCoreOption
  height?: number
  className?: string
  ariaLabel: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)
  const { resolvedTheme } = useTheme()
  const build = useRef(buildOption)
  build.current = buildOption

  const themeKey = useMemo(() => resolvedTheme ?? 'light', [resolvedTheme])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const instance = echarts.init(container, undefined, { renderer: 'canvas' })
    chartRef.current = instance

    const tokens = readTokens()
    const base: echarts.EChartsCoreOption = {
      animationDuration: 450,
      textStyle: { fontFamily: 'inherit', color: tokens.text },
      grid: { top: 24, right: 16, bottom: 24, left: 48, containLabel: true },
      tooltip: {
        backgroundColor: tokens.surface,
        borderColor: tokens.border,
        textStyle: { color: tokens.text, fontSize: 12 },
      },
    }

    instance.setOption({ ...base, ...build.current(tokens) }, true)

    const observer = new ResizeObserver(() => instance.resize())
    observer.observe(container)

    return () => {
      observer.disconnect()
      instance.dispose()
      chartRef.current = null
    }
  }, [themeKey])

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      style={{ height }}
      className={cn('w-full', className)}
    />
  )
}
