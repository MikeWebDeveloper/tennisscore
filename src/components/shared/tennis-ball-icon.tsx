interface TennisBallIconProps {
  className?: string
}

export function TennisBallIcon({ className }: TennisBallIconProps) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className={className}
    >
      <circle cx="12" cy="12" r="10" className="text-primary" />
      <path 
        d="M2,12a10,5 0,0,0 20,0a10,5 0,0,0-20,0"
        fill="none" 
        stroke="rgba(255, 255, 255, 0.7)" 
        strokeWidth="1.5"
      />
    </svg>
  )
} 