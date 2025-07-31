'use client'

import { useEffect, useRef, useState } from 'react'
import UplotReact from 'uplot-react'
import 'uplot/dist/uPlot.min.css'

interface UPlotAreaChartProps {
  data: Array<{ [key: string]: any }>
  dataKeys: string[]
  nameKey: string
  colors?: string[]
  width?: number
  height?: number
  className?: string
  stacked?: boolean
  margin?: { top: number; right: number; left: number; bottom: number }
}

export function UPlotAreaChart({ 
  data, 
  dataKeys, 
  nameKey, 
  colors = ['#39FF14', '#3b82f6', '#ef4444', '#22c55e', '#8b5cf6'],
  width = 400, 
  height = 200, 
  className = '',
  stacked = false,
  margin = { top: 10, right: 10, left: 50, bottom: 30 }
}: UPlotAreaChartProps) {
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

  // Convert data to uPlot format
  const uplotData: Array<Array<string | number>> = [
    data.map((_, i) => i), // X axis indices
    ...dataKeys.map(key => data.map(d => d[key] || 0)) // Y axis values for each data key
  ]

  // Calculate stacked data if needed
  const processedData = stacked ? [
    uplotData[0], // X axis stays the same
    ...dataKeys.map((_, keyIndex) => {
      return data.map((_, i) => {
        let stackedValue = 0
        for (let j = 0; j <= keyIndex; j++) {
          stackedValue += data[i][dataKeys[j]] || 0
        }
        return stackedValue
      })
    })
  ] : uplotData

  const series = [
    {},
    ...dataKeys.map((key, index) => ({
      label: key,
      stroke: colors[index % colors.length],
      fill: colors[index % colors.length] + '40', // Semi-transparent fill
      width: 2,
      points: {
        show: false
      },
      // Use fill gradient for area effect
      paths: (u: any, seriesIdx: number) => {
        const { ctx } = u
        const stroke = new Path2D()
        const fill = new Path2D()
        
        let firstPoint = true
        
        for (let i = 0; i < data.length; i++) {
          const x = u.valToPos(i, 'x', true)
          const y = u.valToPos(processedData[seriesIdx][i], 'y', true)
          
          if (firstPoint) {
            stroke.moveTo(x, y)
            fill.moveTo(x, y)
            firstPoint = false
          } else {
            stroke.lineTo(x, y)
            fill.lineTo(x, y)
          }
        }
        
        // Complete the fill path
        if (stacked && index > 0) {
          // Fill to previous series
          for (let i = data.length - 1; i >= 0; i--) {
            const x = u.valToPos(i, 'x', true)
            const y = u.valToPos(processedData[seriesIdx - 1][i], 'y', true)
            fill.lineTo(x, y)
          }
        } else {
          // Fill to zero line
          const zeroY = u.valToPos(0, 'y', true)
          fill.lineTo(u.valToPos(data.length - 1, 'x', true), zeroY)
          fill.lineTo(u.valToPos(0, 'x', true), zeroY)
        }
        
        fill.closePath()
        
        return { stroke, fill }
      }
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
        time: false
      }
    },
    cursor: {
      points: {
        show: true,
        size: 6,
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
      <UplotReact options={options} data={processedData as any} />
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