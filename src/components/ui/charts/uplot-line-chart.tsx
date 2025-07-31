'use client'

import { useEffect, useRef, useState } from 'react'
import UplotReact from 'uplot-react'
import 'uplot/dist/uPlot.min.css'

interface UPlotLineChartProps {
  data: Array<{ [key: string]: any }>
  width?: number
  height?: number
  className?: string
  xKey?: string
  yKey?: string
}

export function UPlotLineChart({ data, width = 400, height = 200, className = '', xKey, yKey }: UPlotLineChartProps) {
  const [size, setSize] = useState({ width, height })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setSize({ width: rect.width || width, height })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [width, height])

  // Convert data to uPlot format [x-values, y-values]
  const uplotData: Array<Array<number>> = [
    data.map((_, i) => i), // X axis (indices)
    data.map(d => {
      if (yKey) return d[yKey]
      // Try common keys for backwards compatibility
      return d.winRate ?? d.pressure ?? d.pointsWon ?? d.firstServe ?? Object.values(d).find(v => typeof v === 'number') ?? 0
    })
  ] as any

  const options: any = {
    width: size.width,
    height: size.height,
    series: [
      {},
      {
        label: yKey || "Value",
        stroke: "#39FF14",
        fill: "rgba(57, 255, 20, 0.1)",
        width: 2,
        points: {
          show: true,
          size: 6,
          stroke: "#39FF14",
          fill: "#39FF14"
        }
      }
    ],
    axes: [
      {
        stroke: "rgba(255,255,255,0.2)",
        grid: {
          stroke: "rgba(255,255,255,0.05)",
          width: 1
        },
        ticks: {
          stroke: "rgba(255,255,255,0.2)",
          width: 1
        }
      },
      {
        stroke: "rgba(255,255,255,0.2)",
        grid: {
          stroke: "rgba(255,255,255,0.05)",
          width: 1
        },
        ticks: {
          stroke: "rgba(255,255,255,0.2)",
          width: 1
        },
        values: (u: any, vals: number[]) => vals.map(v => yKey === 'winRate' || yKey === 'percentage' ? v + "%" : v.toString())
      }
    ],
    scales: {
      x: {
        time: false
      },
      y: {
        range: () => {
          if (yKey === 'winRate' || yKey === 'percentage') {
            return [0, 100] as [number, number]
          }
          // Auto-scale for other data types
          const values = data.map(d => {
            if (yKey) return d[yKey]
            return d.winRate ?? d.pressure ?? d.pointsWon ?? d.firstServe ?? Object.values(d).find(v => typeof v === 'number') ?? 0
          }).filter(v => typeof v === 'number')
          
          const min = Math.min(...values)
          const max = Math.max(...values)
          const padding = (max - min) * 0.1
          return [Math.max(0, min - padding), max + padding] as [number, number]
        }
      }
    },
    cursor: {
      points: {
        show: true,
        size: 8,
        stroke: "#39FF14",
        fill: "#39FF14"
      }
    },
    focus: {
      alpha: 0.3
    }
  }

  return (
    <div ref={containerRef} className={`uplot-container ${className}`}>
      <UplotReact options={options} data={uplotData as any} />
      <style jsx global>{`
        .uplot-container .u-legend {
          display: none;
        }
        .uplot-container .u-select {
          background: rgba(57, 255, 20, 0.1);
        }
        .uplot-container {
          font-family: inherit;
        }
        .uplot-container .u-axis {
          color: rgba(255, 255, 255, 0.5);
          font-size: 12px;
        }
      `}</style>
    </div>
  )
}