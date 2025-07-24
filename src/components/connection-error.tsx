import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ConnectionErrorProps {
  title?: string
  description?: string
  onRetry?: () => void
}

export function ConnectionError({ 
  title = "Connection Issue",
  description = "Unable to connect to the server. Please check your internet connection and try again.",
  onRetry
}: ConnectionErrorProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {onRetry && (
        <CardContent className="text-center">
          <Button onClick={onRetry} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      )}
    </Card>
  )
}

export function ConnectionErrorBoundary({ 
  fallback 
}: { 
  fallback?: React.ReactNode
}) {
  return (
    <div className="min-h-[200px] flex items-center justify-center p-4">
      {fallback || <ConnectionError />}
    </div>
  )
} 