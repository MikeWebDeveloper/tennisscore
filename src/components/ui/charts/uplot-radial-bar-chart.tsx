'use client'

import { useEffect, useRef, useState } from 'react'

interface RadialBarDataItem {
  name: string
  value: number
  fill?: string
}

interface UPlotRadialBarChartProps {
  data: RadialBarDataItem[]
  width?: number
  height?: number
  className?: string
  colors?: string[]
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  cornerRadius?: number
}

export function UPlotRadialBarChart({ 
  data, 
  width = 200, 
  height = 200, 
  className = '',
  colors = ['#39FF14', '#3b82f6', '#ef4444', '#22c55e', '#8b5cf6'],
  innerRadius = 40,
  outerRadius = 80,
  startAngle = 0,
  endAngle = 360,
  cornerRadius = 4
}: UPlotRadialBarChartProps) {
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
    if (!canvasRef.current || !data.length) return

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
    const maxRadius = Math.min(centerX, centerY) - 20

    // Scale radii to fit canvas
    const scaledInnerRadius = (innerRadius / 100) * maxRadius
    const scaledOuterRadius = (outerRadius / 100) * maxRadius

    // Find max value for normalization
    const maxValue = Math.max(...data.map(item => item.value))
    
    // Convert angles to radians
    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180
    const totalAngle = endAngleRad - startAngleRad
    
    // Calculate bar width
    const barCount = data.length
    const barAngle = totalAngle / barCount
    const barSpacing = barAngle * 0.1 // 10% spacing between bars

    data.forEach((item, index) => {
      const color = item.fill || colors[index % colors.length]
      const normalizedValue = item.value / maxValue
      
      // Calculate bar position
      const barStartAngle = startAngleRad + (index * barAngle) + (barSpacing / 2)
      const barEndAngle = barStartAngle + barAngle - barSpacing
      
      // Calculate bar radius based on value
      const barRadius = scaledInnerRadius + (scaledOuterRadius - scaledInnerRadius) * normalizedValue
      
      // Draw background track
      ctx.beginPath()
      ctx.arc(centerX, centerY, scaledOuterRadius, barStartAngle, barEndAngle)
      ctx.arc(centerX, centerY, scaledInnerRadius, barEndAngle, barStartAngle, true)
      ctx.closePath()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
      ctx.fill()
      
      // Draw the bar
      ctx.beginPath()
      ctx.arc(centerX, centerY, barRadius, barStartAngle, barEndAngle)
      ctx.arc(centerX, centerY, scaledInnerRadius, barEndAngle, barStartAngle, true)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
      
      // Add subtle border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      ctx.stroke()
    })

    // Draw center value if single data point
    if (data.length === 1) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = 'bold 16px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${data[0].value}`, centerX, centerY - 5)
      
      ctx.font = '12px sans-serif'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.fillText(data[0].name, centerX, centerY + 15)
    }

  }, [data, size, colors, innerRadius, outerRadius, startAngle, endAngle, cornerRadius])

  return (
    <div ref={containerRef} className={`radial-bar-chart-container ${className}`} style={{ width: '100%', height: '100%' }}>
      <canvas 
        ref={canvasRef}
        style={{ 
          width: '100%', 
          height: '100%',
          maxWidth: size.width,
          maxHeight: size.height
        }}
      />
      {/* Legend - only show for multiple items */}
      {data.length > 1 && (
        <div className="radial-bar-legend" style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          justifyContent: 'center', 
          marginTop: '8px',
          gap: '8px',
          fontSize: '12px'
        }}>
          {data.map((item, index) => (
            <div key={item.name} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <div 
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  backgroundColor: item.fill || colors[index % colors.length],
                  borderRadius: '2px'
                }} 
              />
              <span>{item.name}: {item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}