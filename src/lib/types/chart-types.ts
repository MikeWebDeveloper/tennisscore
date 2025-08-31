import type { Options, Series, AlignedData } from 'uplot'

// Base chart data types
export interface ChartDataPoint {
  x: number
  y: number
  label?: string
  color?: string
}

export interface ChartSeries extends Partial<Series> {
  label: string
  stroke?: string
  fill?: string
  width?: number
}

// Core uPlot chart props interface
export interface UPlotChartProps {
  data: AlignedData
  width?: number
  height?: number
  options?: Partial<Options>
  series?: ChartSeries[]
  className?: string
}

// Enhanced chart options with theme support
export interface ChartOptions extends Partial<Options> {
  theme?: 'light' | 'dark'
  animated?: boolean
  responsive?: boolean
}

// Specific chart type props
export interface LineChartProps extends UPlotChartProps {
  smooth?: boolean
  area?: boolean
}

export interface BarChartProps extends UPlotChartProps {
  stacked?: boolean
  horizontal?: boolean
}

export interface AreaChartProps extends UPlotChartProps {
  stacked?: boolean
  gradient?: boolean
}

export interface PieChartProps {
  data: Array<{ label: string; value: number; color?: string }>
  width?: number
  height?: number
  donut?: boolean
  innerRadius?: number
  outerRadius?: number
}

export interface RadarChartProps {
  data: Array<{ label: string; value: number; max?: number }>
  width?: number
  height?: number
  levels?: number
}

export interface RadialBarChartProps {
  data: Array<{ label: string; value: number; max?: number; color?: string }>
  width?: number
  height?: number
  innerRadius?: number
  outerRadius?: number
}

// Tennis-specific chart data types
export interface TennisChartData {
  momentum: Array<{ time: number; player1: number; player2: number }>
  pressure: Array<{ point: number; level: number; type: string }>
  serve: Array<{ game: number; firstServe: number; secondServe: number; aces: number }>
  rally: Array<{ length: number; winner: 'player1' | 'player2'; type: string }>
  performance: Array<{ metric: string; player1: number; player2: number }>
}

// Chart configuration for different tennis metrics
export interface TennisChartConfig {
  momentum: {
    colors: [string, string] // Player 1, Player 2 colors
    yAxisRange: [-100, 100]
    smoothing: boolean
  }
  pressure: {
    colorScale: string[] // Colors for different pressure levels
    barWidth: number
    showLabels: boolean
  }
  serve: {
    colors: {
      firstServe: string
      secondServe: string
      aces: string
    }
    stackedBars: boolean
  }
  performance: {
    radarLevels: number
    maxValue: number
    gridColor: string
  }
}

// Chart event handlers
export interface ChartEventHandlers {
  onPointHover?: (dataIndex: number, seriesIndex: number) => void
  onPointClick?: (dataIndex: number, seriesIndex: number) => void
  onLegendClick?: (seriesIndex: number) => void
  onZoom?: (range: [number, number]) => void
  onResize?: (width: number, height: number) => void
}

// Chart loading and error states
export interface ChartState {
  loading: boolean
  error: string | null
  data: AlignedData | null
}

// Responsive chart configuration
export interface ResponsiveChartConfig {
  breakpoints: {
    mobile: number
    tablet: number
    desktop: number
  }
  dimensions: {
    mobile: { width: number; height: number }
    tablet: { width: number; height: number }
    desktop: { width: number; height: number }
  }
  options: {
    mobile: Partial<Options>
    tablet: Partial<Options>
    desktop: Partial<Options>
  }
}

// Chart theme configuration
export interface ChartTheme {
  background: string
  gridColor: string
  textColor: string
  axisColor: string
  colors: {
    primary: string[]
    secondary: string[]
    accent: string[]
  }
  fonts: {
    family: string
    size: {
      title: number
      axis: number
      legend: number
      tooltip: number
    }
  }
}

// Utility type for chart data transformation
export type ChartDataTransformer<T> = (data: T[]) => AlignedData

// Type for chart component ref
export interface ChartRef {
  redraw: () => void
  destroy: () => void
  setSize: (width: number, height: number) => void
  setData: (data: AlignedData) => void
}

// Enhanced chart props with all features
export interface EnhancedChartProps extends UPlotChartProps {
  theme?: ChartTheme
  responsive?: ResponsiveChartConfig
  events?: ChartEventHandlers
  loading?: boolean
  error?: string
  onReady?: (chart: ChartRef) => void
}

// Export utility functions types
export type ChartUtilityFunctions = {
  formatData: ChartDataTransformer<any>
  calculateDimensions: (containerWidth: number, containerHeight: number) => { width: number; height: number }
  generateColors: (count: number, theme: ChartTheme) => string[]
  createTooltip: (dataPoint: ChartDataPoint, series: ChartSeries) => string
}