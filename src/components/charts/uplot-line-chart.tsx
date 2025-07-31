'use client'

import { useEffect, useRef, useState } from 'react'
import UplotReact from 'uplot-react'
import 'uplot/dist/uPlot.min.css'

interface UPlotLineChartProps {
  data: Array<{ match: number; winRate: number; date: string }>
  width?: number
  height?: number
  className?: string
}

export function UPlotLineChart({ data, width = 400, height = 200, className = '' }: UPlotLineChartProps) {
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
    data.map((_, i) => i + 1), // X axis (match numbers)
    data.map(d => d.winRate)   // Y axis (win rates)
  ] as any

  const options: any = {
    width: size.width,
    height: size.height,
    series: [
      {},
      {
        label: "Win Rate %",
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
        values: (u: any, vals: number[]) => vals.map(v => v + "%")
      }
    ],
    scales: {
      x: {
        time: false
      },
      y: {
        range: () => [0, 100] as [number, number]
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