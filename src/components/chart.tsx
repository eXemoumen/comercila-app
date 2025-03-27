import type * as React from "react"

interface ChartContainerProps {
  data: any[]
  xAxisKey: string
  categories: string[]
  colors: string[]
  yAxisWidth?: number
  showXAxis?: boolean
  showYAxis?: boolean
  children: React.ReactNode
}

const ChartContainer = ({
  data,
  xAxisKey,
  categories,
  colors,
  yAxisWidth = 40,
  showXAxis = true,
  showYAxis = true,
  children,
}: ChartContainerProps) => {
  return <div className="relative">{children}</div>
}

type ChartTooltipProps = {}

const ChartTooltip = (props: ChartTooltipProps) => {
  return (
    <div className="absolute z-10 rounded-md border bg-popover px-2 py-1.5 text-sm font-semibold text-popover-foreground shadow-sm opacity-0 transition-opacity data-[state=open]:opacity-100">
      Tooltip
    </div>
  )
}

type ChartBarProps = {}

const ChartBar = (props: ChartBarProps) => {
  return <rect width="10" height="10" fill="red" />
}

type ChartBarsProps = {}

const ChartBars = (props: ChartBarsProps) => {
  return <g>ChartBars</g>
}

export { ChartContainer, ChartTooltip, ChartBar, ChartBars }

