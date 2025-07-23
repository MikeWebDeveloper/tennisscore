'use client'

export default function RootPage() {
  // Emergency fix: use client-side navigation to avoid server-side redirect loops
  if (typeof window !== 'undefined') {
    window.location.href = '/dashboard'
  }
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div>Redirecting to dashboard...</div>
    </div>
  )
} 