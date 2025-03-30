import type * as React from "react"

interface ChartContainerProps {
  data: Array<Record<string, unknown>>
  xAxisKey: string
  categories: string[]
  colors: string[]
  yAxisWidth?: number
  showXAxis?: boolean
  showYAxis?: boolean
  children: React.ReactNode
}

const ChartContainer = ({
 
  children,
}: ChartContainerProps) => {
  return <div className="relative">{children}</div>
}



const ChartTooltip = () => {
  return (
    <div className="absolute z-10 rounded-md border bg-popover px-2 py-1.5 text-sm font-semibold text-popover-foreground shadow-sm opacity-0 transition-opacity data-[state=open]:opacity-100">
      Tooltip
    </div>
  )
}



const ChartBar = () => {
  return <rect width="10" height="10" fill="red" />
}



const ChartBars = () => {
  return <g>ChartBars</g>
}

export { ChartContainer, ChartTooltip, ChartBar, ChartBars }

