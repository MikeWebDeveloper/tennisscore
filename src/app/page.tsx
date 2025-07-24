export default async function RootPage() {
  // TEMPORARY: Show a simple page to test if the site loads
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Tennis Score App - Test Page</h1>
      <p>If you can see this, the redirect loop has been bypassed.</p>
      <p>This is a temporary page for debugging.</p>
      <div style={{ marginTop: '20px' }}>
        <a href="/login" style={{ marginRight: '10px' }}>Go to Login</a>
        <a href="/dashboard">Go to Dashboard (requires auth)</a>
      </div>
    </div>
  )
} 