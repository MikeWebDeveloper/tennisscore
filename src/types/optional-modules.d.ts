/**
 * TypeScript declarations for optional modules
 * These modules may or may not be installed, so we provide fallback types
 */

// Optional chart libraries (migrated to uPlot)
declare module 'recharts' {
  export interface ChartProps {
    data?: any[]
    width?: number
    height?: number
    children?: React.ReactNode
  }
  
  export const BarChart: React.ComponentType<ChartProps>
  export const LineChart: React.ComponentType<ChartProps>
  export const RadarChart: React.ComponentType<ChartProps>
  export const PieChart: React.ComponentType<ChartProps>
}

// Optional utility libraries
declare module 'lodash' {
  const lodash: {
    [key: string]: any
    get: (object: any, path: string, defaultValue?: any) => any
    set: (object: any, path: string, value: any) => any
    debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => T
    throttle: <T extends (...args: any[]) => any>(func: T, wait: number) => T
    cloneDeep: <T>(value: T) => T
    merge: (target: any, ...sources: any[]) => any
  }
  export = lodash
}

// Optional animation libraries
declare module 'gsap' {
  export interface GSAPTimeline {
    to: (target: any, duration: number, vars?: any) => GSAPTimeline
    from: (target: any, duration: number, vars?: any) => GSAPTimeline
    set: (target: any, vars?: any) => GSAPTimeline
    play: () => GSAPTimeline
    pause: () => GSAPTimeline
    reverse: () => GSAPTimeline
  }
  
  export interface GSAP {
    to: (target: any, duration: number, vars?: any) => GSAPTimeline
    from: (target: any, duration: number, vars?: any) => GSAPTimeline
    set: (target: any, vars?: any) => GSAPTimeline
    timeline: () => GSAPTimeline
    registerPlugin: (...plugins: any[]) => void
  }
  
  const gsap: GSAP
  export default gsap
}

declare module 'gsap/CSSPlugin' {
  const CSSPlugin: any
  export default CSSPlugin
}

// Optional performance monitoring
declare module 'web-vitals' {
  export interface Metric {
    name: string
    value: number
    id: string
    entries: any[]
  }
  
  export type ReportHandler = (metric: Metric) => void
  
  export function getCLS(onReport: ReportHandler): void
  export function getFID(onReport: ReportHandler): void
  export function getFCP(onReport: ReportHandler): void
  export function getLCP(onReport: ReportHandler): void
  export function getTTFB(onReport: ReportHandler): void
}

// Module availability helpers
declare global {
  interface Window {
    __BUNDLE_OPTIMIZATION_CACHE__?: Map<string, boolean>
  }
}

export {}