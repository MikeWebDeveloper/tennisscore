"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface InteractiveCourtProps {
  mode: 'serve' | 'return' | 'rally'
  onZoneSelect: (zone: string) => void
  selectedZone?: string
  className?: string
}

// Court zone definitions with coordinates
const COURT_ZONES = {
  serve: [
    { id: 'deuce-wide', x: 50, y: 200, width: 50, height: 75, label: 'Wide' },
    { id: 'deuce-body', x: 100, y: 200, width: 50, height: 75, label: 'Body' },
    { id: 'deuce-t', x: 150, y: 200, width: 50, height: 75, label: 'T' },
    { id: 'ad-wide', x: 250, y: 200, width: 50, height: 75, label: 'Wide' },
    { id: 'ad-body', x: 200, y: 200, width: 50, height: 75, label: 'Body' },
    { id: 'ad-t', x: 150, y: 200, width: 50, height: 75, label: 'T' }
  ],
  return: [
    // 9-zone return grid
    { id: 'deuce-deep', x: 50, y: 150, width: 75, height: 50, label: 'DD' },
    { id: 'center-deep', x: 125, y: 150, width: 75, height: 50, label: 'CD' },
    { id: 'ad-deep', x: 200, y: 150, width: 75, height: 50, label: 'AD' },
    { id: 'deuce-mid', x: 50, y: 200, width: 75, height: 50, label: 'DM' },
    { id: 'center-mid', x: 125, y: 200, width: 75, height: 50, label: 'CM' },
    { id: 'ad-mid', x: 200, y: 200, width: 75, height: 50, label: 'AM' },
    { id: 'deuce-short', x: 50, y: 250, width: 75, height: 50, label: 'DS' },
    { id: 'center-short', x: 125, y: 250, width: 75, height: 50, label: 'CS' },
    { id: 'ad-short', x: 200, y: 250, width: 75, height: 50, label: 'AS' }
  ],
  rally: [
    // Simplified rally zones
    { id: 'deuce-court', x: 50, y: 150, width: 100, height: 150, label: 'Deuce' },
    { id: 'ad-court', x: 150, y: 150, width: 100, height: 150, label: 'Ad' },
    { id: 'net-area', x: 75, y: 275, width: 150, height: 25, label: 'Net' }
  ]
}

export function InteractiveCourt({ 
  mode, 
  onZoneSelect, 
  selectedZone, 
  className = "" 
}: InteractiveCourtProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'court' | 'grid'>('court')

  const zones = COURT_ZONES[mode]

  const handleZoneClick = (zoneId: string) => {
    onZoneSelect(zoneId)
  }

  const getZoneColor = (zoneId: string) => {
    if (selectedZone === zoneId) {
      return mode === 'serve' ? '#22c55e' : mode === 'return' ? '#3b82f6' : '#f59e0b'
    }
    if (hoveredZone === zoneId) {
      return '#64748b'
    }
    return 'transparent'
  }

  const getZoneStroke = (zoneId: string) => {
    if (selectedZone === zoneId) {
      return mode === 'serve' ? '#15803d' : mode === 'return' ? '#1d4ed8' : '#d97706'
    }
    return '#64748b'
  }

  const GridView = () => (
    <div className="space-y-2">
      {mode === 'serve' && (
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center text-xs font-medium text-muted-foreground">Deuce</div>
          <div className="text-center text-xs font-medium text-muted-foreground">Service Box</div>
          <div className="text-center text-xs font-medium text-muted-foreground">Ad</div>
          {['deuce-wide', 'deuce-body', 'deuce-t', 'ad-t', 'ad-body', 'ad-wide'].map(zoneId => (
            <Button
              key={zoneId}
              variant={selectedZone === zoneId ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleZoneClick(zoneId)}
              className="h-12"
            >
              {zones.find(z => z.id === zoneId)?.label}
            </Button>
          ))}
        </div>
      )}
      
      {mode === 'return' && (
        <div className="grid grid-cols-3 gap-2">
          {['Deep', 'Mid', 'Short'].map((depth, depthIndex) => (
            <div key={depth} className="space-y-2">
              <div className="text-center text-xs font-medium text-muted-foreground">{depth}</div>
              {['Deuce', 'Center', 'Ad'].map((court, courtIndex) => {
                const zoneId = zones[depthIndex * 3 + courtIndex]?.id
                return (
                  <Button
                    key={zoneId}
                    variant={selectedZone === zoneId ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => zoneId && handleZoneClick(zoneId)}
                    className="w-full text-xs"
                  >
                    {court.slice(0, 1)}
                  </Button>
                )
              })}
            </div>
          ))}
        </div>
      )}
      
      {mode === 'rally' && (
        <div className="grid grid-cols-2 gap-2">
          {zones.map(zone => (
            <Button
              key={zone.id}
              variant={selectedZone === zone.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleZoneClick(zone.id)}
              className="h-12"
            >
              {zone.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  )

  const CourtView = () => (
    <div className="relative">
      <svg 
        viewBox="0 0 350 400" 
        className={`w-full max-w-[350px] border rounded-lg bg-green-50 dark:bg-green-950/10 ${className}`}
        style={{ aspectRatio: '350/400' }}
      >
        {/* Court outline */}
        <rect 
          x="25" 
          y="100" 
          width="300" 
          height="250" 
          fill="none" 
          stroke="#374151" 
          strokeWidth="3"
        />
        
        {/* Net */}
        <line 
          x1="25" 
          y1="225" 
          x2="325" 
          y2="225" 
          stroke="#374151" 
          strokeWidth="2"
        />
        
        {/* Service boxes */}
        <rect 
          x="25" 
          y="150" 
          width="150" 
          height="75" 
          fill="none" 
          stroke="#374151" 
          strokeWidth="1"
        />
        <rect 
          x="175" 
          y="150" 
          width="150" 
          height="75" 
          fill="none" 
          stroke="#374151" 
          strokeWidth="1"
        />
        
        {/* Center service line */}
        <line 
          x1="175" 
          y1="150" 
          x2="175" 
          y2="225" 
          stroke="#374151" 
          strokeWidth="1"
        />
        
        {/* Zone overlays */}
        {zones.map(zone => (
          <g key={zone.id}>
            <rect
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              fill={getZoneColor(zone.id)}
              stroke={getZoneStroke(zone.id)}
              strokeWidth="2"
              className="cursor-pointer transition-all duration-200 hover:opacity-80"
              onClick={() => handleZoneClick(zone.id)}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
            />
            {/* Zone labels */}
            <text
              x={zone.x + zone.width / 2}
              y={zone.y + zone.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-medium pointer-events-none"
              fill={selectedZone === zone.id ? 'white' : '#374151'}
            >
              {zone.label}
            </text>
          </g>
        ))}
        
        {/* Court labels */}
        <text x="100" y="140" textAnchor="middle" className="text-xs font-medium" fill="#6b7280">
          Deuce Court
        </text>
        <text x="250" y="140" textAnchor="middle" className="text-xs font-medium" fill="#6b7280">
          Ad Court
        </text>
        <text x="175" y="90" textAnchor="middle" className="text-sm font-bold" fill="#374151">
          {mode === 'serve' ? 'Serve Zones' : mode === 'return' ? 'Return Zones' : 'Rally Zones'}
        </text>
        
        {/* Legend */}
        {selectedZone && (
          <g>
            <rect x="10" y="360" width="120" height="30" fill="white" stroke="#d1d5db" strokeWidth="1" rx="4" />
            <text x="70" y="375" textAnchor="middle" className="text-xs font-medium" fill="#374151">
              Selected: {zones.find(z => z.id === selectedZone)?.label}
            </text>
          </g>
        )}
      </svg>
      
      <div className="text-xs text-center text-muted-foreground mt-2">
        Tap a zone to select {mode} placement
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* View mode toggle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg border p-1">
          <Button
            variant={viewMode === 'court' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('court')}
            className="text-xs"
          >
            Court View
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="text-xs"
          >
            Grid View
          </Button>
        </div>
      </div>

      {/* Current selection */}
      {selectedZone && (
        <div className="text-center">
          <Badge variant="secondary" className="text-xs">
            {mode === 'serve' ? 'Serve to' : mode === 'return' ? 'Return to' : 'Rally at'}: {' '}
            {zones.find(z => z.id === selectedZone)?.label}
          </Badge>
        </div>
      )}

      {/* Render selected view */}
      {viewMode === 'court' ? <CourtView /> : <GridView />}
      
      {/* Quick selection buttons for common zones */}
      {mode === 'serve' && (
        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoneClick('deuce-wide')}
            className="text-xs"
          >
            Wide Deuce
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoneClick('deuce-t')}
            className="text-xs"
          >
            T (Deuce)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoneClick('ad-t')}
            className="text-xs"
          >
            T (Ad)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoneClick('ad-wide')}
            className="text-xs"
          >
            Wide Ad
          </Button>
        </div>
      )}
    </div>
  )
} 