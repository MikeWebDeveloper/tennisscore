'use client'

import { useEffect, useRef, useState } from 'react'

interface RadarDataItem {
  [key: string]: string | number
}

interface UPlotRadarChartProps {
  data: RadarDataItem[]
  dataKeys: string[]
  nameKey: string
  width?: number
  height?: number
  className?: string
  colors?: string[]
  maxValue?: number
  levels?: number
}

export function UPlotRadarChart({ 
  data, 
  dataKeys,
  nameKey,
  width = 300, 
  height = 300, 
  className = '',
  colors = ['#39FF14', '#3b82f6', '#ef4444', '#22c55e', '#8b5cf6'],
  maxValue,
  levels = 5
}: UPlotRadarChartProps) {
  const [size, setSize] = useState({ width, height })
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const newSize = Math.min(rect.width || width, rect.height || height)
        setSize({ width: newSize, height: newSize })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [width, height])

  useEffect(() => {
    if (!canvasRef.current || !data.length || !dataKeys.length) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = size.width
    canvas.height = size.height
    
    // Clear canvas
    ctx.clearRect(0, 0, size.width, size.height)

    const centerX = size.width / 2
    const centerY = size.height / 2
    const radius = Math.min(centerX, centerY) - 40

    // Find max value if not provided
    const calculatedMaxValue = maxValue || Math.max(...data.flatMap(item => 
      dataKeys.map(key => typeof item[key] === 'number' ? item[key] : 0)
    ))

    // Draw grid levels
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    
    for (let i = 1; i <= levels; i++) {
      const levelRadius = (radius * i) / levels
      ctx.beginPath()
      
      for (let j = 0; j < dataKeys.length; j++) {
        const angle = (j * 2 * Math.PI) / dataKeys.length - Math.PI / 2
        const x = centerX + Math.cos(angle) * levelRadius
        const y = centerY + Math.sin(angle) * levelRadius
        
        if (j === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      
      ctx.closePath()
      ctx.stroke()
    }

    // Draw axis lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    for (let i = 0; i < dataKeys.length; i++) {
      const angle = (i * 2 * Math.PI) / dataKeys.length - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    // Draw axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    for (let i = 0; i < dataKeys.length; i++) {
      const angle = (i * 2 * Math.PI) / dataKeys.length - Math.PI / 2
      const labelRadius = radius + 20
      const x = centerX + Math.cos(angle) * labelRadius
      const y = centerY + Math.sin(angle) * labelRadius
      
      ctx.fillText(dataKeys[i], x, y)
    }

    // Draw data series
    data.forEach((dataItem, seriesIndex) => {
      const color = colors[seriesIndex % colors.length]
      
      // Fill area
      ctx.fillStyle = color + '20' // Very transparent fill
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      
      ctx.beginPath()
      
      for (let i = 0; i < dataKeys.length; i++) {
        const value = typeof dataItem[dataKeys[i]] === 'number' ? dataItem[dataKeys[i]] as number : 0
        const normalizedValue = Math.min(value / calculatedMaxValue, 1)
        const angle = (i * 2 * Math.PI) / dataKeys.length - Math.PI / 2
        const pointRadius = radius * normalizedValue
        const x = centerX + Math.cos(angle) * pointRadius
        const y = centerY + Math.sin(angle) * pointRadius
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      
      // Draw points
      ctx.fillStyle = color
      for (let i = 0; i < dataKeys.length; i++) {
        const value = typeof dataItem[dataKeys[i]] === 'number' ? dataItem[dataKeys[i]] as number : 0
        const normalizedValue = Math.min(value / calculatedMaxValue, 1)
        const angle = (i * 2 * Math.PI) / dataKeys.length - Math.PI / 2
        const pointRadius = radius * normalizedValue
        const x = centerX + Math.cos(angle) * pointRadius
        const y = centerY + Math.sin(angle) * pointRadius
        
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, 2 * Math.PI)
        ctx.fill()
      }
    })

  }, [data, dataKeys, size, colors, maxValue, levels])

  return (
    <div ref={containerRef} className={`radar-chart-container ${className}`} style={{ width: '100%', height: '100%' }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%',
          maxWidth: size.width,
          maxHeight: size.height
        }}
      />
      {/* Legend */}
      {data.length > 1 && (
        <div className="radar-legend" style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          marginTop: '8px',
          gap: '8px',
          fontSize: '12px'
        }}>
          {data.map((item, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <div 
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: colors[index % colors.length],
                  borderRadius: '2px'
                }} 
              />
              <span>{typeof item[nameKey] === 'string' ? item[nameKey] : `Series ${index + 1}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}