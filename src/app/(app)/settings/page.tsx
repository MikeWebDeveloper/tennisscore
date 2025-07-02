import { CacheManager } from "@/components/features/cache-manager"
import { SoundSettings } from "@/components/ui/sound-settings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Database, Volume2 } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8 text-primary" />
          <h1 className="text-3xl md:text-4xl font-bold text-slate-100">
            Settings
          </h1>
        </div>
        <p className="text-lg text-slate-400">
          Manage your app preferences and cache settings
        </p>
      </div>

      {/* Cache Management Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-slate-200">
            Cache & Updates
          </h2>
        </div>
        
        <div className="max-w-4xl">
          <CacheManager />
        </div>
      </div>

      {/* Sound Settings Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Volume2 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-slate-200">
            Sound Effects
          </h2>
        </div>
        
        <div className="max-w-4xl">
          <SoundSettings />
        </div>
      </div>

      {/* Information Card */}
      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle>About Cache Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Why use cache management?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Fixes issues with outdated app versions</li>
              <li>Resolves problems with stale data</li>
              <li>Improves app performance and reliability</li>
              <li>Forces fresh data from servers when needed</li>
            </ul>
            
            <p className="mt-4">
              <strong>When to use these features:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Clear Cache:</strong> When experiencing data inconsistencies or old information</li>
              <li><strong>Force Reload:</strong> When the app seems stuck or not updating properly</li>
              <li><strong>Check Updates:</strong> To manually check for new app versions</li>
              <li><strong>Install App:</strong> For better performance and offline access</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 