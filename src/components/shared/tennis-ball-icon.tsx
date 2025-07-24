interface TennisBallIconProps {
  className?: string
  isServing?: boolean
}

export function TennisBallIcon({ className = "", isServing = false }: TennisBallIconProps) {
  // Tennis ball green color - bright and visible on both light and dark themes
  const ballColor = isServing ? "#9FED38" : "#64748B" // Bright green when serving, gray when not
  const strokeColor = isServing ? "#6B7280" : "#9CA3AF" // Darker contrast for the seam
  
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
      style={{ filter: isServing ? 'drop-shadow(0 0 4px rgba(159, 237, 56, 0.4))' : 'none' }}
    >
      {/* Tennis ball circle */}
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        fill={ballColor}
        stroke={strokeColor}
        strokeWidth="0.5"
      />
      {/* Characteristic tennis ball seam curve */}
      <path 
        d="M2,12a10,5 0,0,0 20,0a10,5 0,0,0-20,0"
        fill="none" 
        stroke={strokeColor}
        strokeWidth="1.2"
        opacity="0.8"
      />
      {/* Additional seam detail for more realistic look */}
      <path 
        d="M22,12a10,5 0,0,0-20,0a10,5 0,0,0 20,0"
        fill="none" 
        stroke={strokeColor}
        strokeWidth="1.2"
        opacity="0.8"
      />
    </svg>
  )
} 