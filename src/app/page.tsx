'use client'

import { useEffect, useState } from 'react'

export default function RootPage() {
  const [redirected, setRedirected] = useState(false)

  useEffect(() => {
    // Only redirect once to prevent loops
    if (!redirected) {
      setRedirected(true)
      
      // Add delay to ensure page is mounted properly
      const timer = setTimeout(() => {
        // Use replace to avoid adding to history stack
        window.location.replace('/dashboard')
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [redirected])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #39FF14',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <div>Loading tennis dashboard...</div>
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
} 