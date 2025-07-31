'use client'

import { useEffect, useRef, useState } from 'react'
import UplotReact from 'uplot-react'
import 'uplot/dist/uPlot.min.css'

interface UPlotBarChartProps {
  data: Array<{ [key: string]: any }>
  dataKeys: string[]
  nameKey: string
  colors?: string[]
  width?: number
  height?: number
  className?: string
  layout?: 'vertical' | 'horizontal'
  margin?: { top: number; right: number; left: number; bottom: number }
}

export function UPlotBarChart({ 
  data, 
  dataKeys, 
  nameKey, 
  colors = ['#39FF14', '#3b82f6', '#ef4444', '#22c55e', '#8b5cf6'],
  width = 400, 
  height = 200, 
  className = '',
  layout = 'vertical',
  margin = { top: 10, right: 10, left: 50, bottom: 30 }
}: UPlotBarChartProps) {
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

  // Convert data to uPlot format - using time series approach for bars
  const uplotData: Array<Array<string | number>> = [
    data.map((_, i) => i), // X axis indices
    ...dataKeys.map(key => data.map(d => d[key] || 0)) // Y axis values for each data key
  ]

  // Custom bar drawing function
  function drawBars(u: any, seriesIdx: number, idx0: number, idx1: number) {
    const { ctx } = u
    const fillStyle = colors[(seriesIdx - 1) % colors.length]
    
    ctx.fillStyle = fillStyle
    
    for (let i = idx0; i <= idx1; i++) {
      const xVal = u.data[0][i]
      const yVal = u.data[seriesIdx][i]
      
      if (yVal != null) {
        const x = u.valToPos(xVal, 'x', true)
        const y = u.valToPos(yVal, 'y', true)
        const y0 = u.valToPos(0, 'y', true)
        
        const barWidth = Math.max(8, Math.floor(u.bbox.width / data.length * 0.6))
        const barOffset = dataKeys.length > 1 ? 
          (barWidth + 2) * (seriesIdx - 1) - ((dataKeys.length - 1) * (barWidth + 2)) / 2 : 0
        
        ctx.fillRect(
          x - barWidth / 2 + barOffset, 
          Math.min(y, y0), 
          barWidth, 
          Math.abs(y - y0)
        )
      }
    }
  }

  const series = [
    {},
    ...dataKeys.map((key, index) => ({
      label: key,
      stroke: colors[index % colors.length],
      fill: colors[index % colors.length] + '80',
      width: 0, // No line stroke for bars
      points: { show: false },
      paths: drawBars
    }))
  ]

  const options: any = {
    width: size.width,
    height: size.height,
    series,
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
        },
        values: (u: any, vals: number[]) => vals.map(v => {
          const idx = Math.round(v)
          return data[idx] ? data[idx][nameKey] : ''
        })
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
        }
      }
    ],
    scales: {
      x: {
        time: false,
        range: () => [-0.5, data.length - 0.5] as [number, number]
      }
    },
    cursor: {
      points: { show: false },
      drag: { x: false, y: false }
    }
  }

  return (
    <div ref={containerRef} className={`uplot-container ${className}`}>
      <UplotReact options={options} data={uplotData as any} />
      <style jsx global>{`
        .uplot-container .u-legend {
          display: none;
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