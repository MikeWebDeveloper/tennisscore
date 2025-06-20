interface TennisBallIconProps {
  className?: string
}

export function TennisBallIcon({ className = "" }: TennisBallIconProps) {
  // Check if this should be outlined (stroke-current) or filled (fill-current)
  const isOutlined = className.includes('stroke-current') && className.includes('fill-transparent')
  
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className}
    >
      <circle 
        cx="12" 
        cy="12" 
        r="10" 
        fill={isOutlined ? "none" : "currentColor"}
        stroke={isOutlined ? "currentColor" : "none"}
        strokeWidth={isOutlined ? "1.5" : "0"}
      />
      <path 
        d="M2,12a10,5 0,0,0 20,0a10,5 0,0,0-20,0"
        fill="none" 
        stroke={isOutlined ? "currentColor" : "rgba(255, 255, 255, 0.7)"} 
        strokeWidth="1"
        opacity={isOutlined ? "0.8" : "1"}
      />
    </svg>
  )
} 