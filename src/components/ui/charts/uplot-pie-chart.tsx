'use client'

import { useEffect, useRef, useState } from 'react'

interface PieDataItem {
  name: string
  value: number
  fill?: string
}

interface UPlotPieChartProps {
  data: PieDataItem[]
  width?: number
  height?: number
  className?: string
  colors?: string[]
  innerRadius?: number
  outerRadius?: number
  showLabels?: boolean
}

export function UPlotPieChart({ 
  data, 
  width = 200, 
  height = 200, 
  className = '',
  colors = ['#39FF14', '#3b82f6', '#ef4444', '#22c55e', '#8b5cf6', '#f59e0b', '#10b981', '#f97316'],
  innerRadius = 0,
  outerRadius = 80,
  showLabels = true
}: UPlotPieChartProps) {
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
    const radius = Math.min(centerX, centerY) - 20

    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + item.value, 0)
    
    let currentAngle = -Math.PI / 2 // Start at top

    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI
      const color = item.fill || colors[index % colors.length]
      
      // Draw slice
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      if (innerRadius > 0) {
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true)
      } else {
        ctx.lineTo(centerX, centerY)
      }
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
      
      // Add stroke
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Draw labels if enabled
      if (showLabels && item.value > 0) {
        const labelAngle = currentAngle + sliceAngle / 2
        const labelRadius = radius * 0.7
        const labelX = centerX + Math.cos(labelAngle) * labelRadius
        const labelY = centerY + Math.sin(labelAngle) * labelRadius
        
        const percentage = ((item.value / total) * 100).toFixed(1)
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        // Only show label if slice is large enough
        if (sliceAngle > 0.2) {
          ctx.fillText(`${percentage}%`, labelX, labelY)
        }
      }

      currentAngle += sliceAngle
    })
  }, [data, size, colors, innerRadius, outerRadius, showLabels])

  return (
    <div ref={containerRef} className={`pie-chart-container ${className}`} style={{ width: '100%', height: '100%' }}>
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
      <div className="pie-legend" style={{ 
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
            <span>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}