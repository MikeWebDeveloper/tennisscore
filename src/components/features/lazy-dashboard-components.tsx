import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { 
  Calendar, 
  TrendingUp, 
  Users, 
  Trophy, 
  Clock, 
  Zap,
  Download,
  Loader2,
  Bell,
  Smartphone
} from 'lucide-react'

// Recent Matches Overview skeleton
const RecentMatchesOverviewSkeleton = () => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-3 border rounded-lg">
            <div className="flex-shrink-0">
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
            <div className="text-right space-y-1">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>
        ))}
        <div className="text-center">
          <Skeleton className="h-9 w-28 mx-auto" />
        </div>
      </div>
    </CardContent>
  </Card>
)

// Stats Cards skeleton
const StatsCardsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

// Quick Actions Hub skeleton
const QuickActionsHubSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Zap className="h-5 w-5" />
        <Skeleton className="h-6 w-28" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-4 w-20 mx-auto" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

// What's New Panel skeleton
const WhatsNewPanelSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Bell className="h-5 w-5" />
        <Skeleton className="h-6 w-24" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
)

// PWA Installation Banner skeleton
const PWAInstallationBannerSkeleton = () => (
  <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
    <CardContent className="p-4">
      <div className="flex items-center space-x-4">
        <Smartphone className="h-8 w-8 text-primary" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
    </CardContent>
  </Card>
)

// Create New Match Button skeleton
const CreateNewMatchButtonSkeleton = () => (
  <Button disabled size="lg" className="w-full md:w-auto">
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    Create Match
  </Button>
)

// Main Player Setup Prompt skeleton
const MainPlayerSetupPromptSkeleton = () => (
  <Card className="border-2 border-dashed border-muted-foreground/25">
    <CardContent className="p-8 text-center">
      <div className="space-y-4">
        <Users className="h-12 w-12 mx-auto text-muted-foreground" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <Skeleton className="h-10 w-32 mx-auto" />
      </div>
    </CardContent>
  </Card>
)

// Lazy load dashboard components
export const LazyRecentMatchesOverview = dynamic(
  () => import('../app/[locale]/(app)/dashboard/_components/recent-matches-overview').then(mod => ({ default: mod.RecentMatchesOverview })),
  {
    loading: () => <RecentMatchesOverviewSkeleton />,
    ssr: false
  }
)

export const LazyStatsCards = dynamic(
  () => import('../app/[locale]/(app)/dashboard/_components/stats-cards').then(mod => ({ default: mod.StatsCards })),
  {
    loading: () => <StatsCardsSkeleton />,
    ssr: false
  }
)

export const LazyStreamlinedStatsCards = dynamic(
  () => import('../app/[locale]/(app)/dashboard/_components/streamlined-stats-cards').then(mod => ({ default: mod.StreamlinedStatsCards })),
  {
    loading: () => <StatsCardsSkeleton />,
    ssr: false
  }
)

export const LazyQuickActionsHub = dynamic(
  () => import('../app/[locale]/(app)/dashboard/_components/quick-actions-hub').then(mod => ({ default: mod.QuickActionsHub })),
  {
    loading: () => <QuickActionsHubSkeleton />,
    ssr: false
  }
)

export const LazyWhatsNewPanel = dynamic(
  () => import('../app/[locale]/(app)/dashboard/_components/whats-new-panel').then(mod => ({ default: mod.WhatsNewPanel })),
  {
    loading: () => <WhatsNewPanelSkeleton />,
    ssr: false
  }
)

export const LazyPWAInstallationBanner = dynamic(
  () => import('../app/[locale]/(app)/dashboard/_components/pwa-installation-banner').then(mod => ({ default: mod.PWAInstallationBanner })),
  {
    loading: () => <PWAInstallationBannerSkeleton />,
    ssr: false
  }
)

export const LazyCreateNewMatchButton = dynamic(
  () => import('../app/[locale]/(app)/dashboard/_components/create-new-match-button').then(mod => ({ default: mod.CreateNewMatchButton })),
  {
    loading: () => <CreateNewMatchButtonSkeleton />,
    ssr: false
  }
)

export const LazyMainPlayerSetupPrompt = dynamic(
  () => import('../app/[locale]/(app)/dashboard/_components/main-player-setup-prompt').then(mod => ({ default: mod.MainPlayerSetupPrompt })),
  {
    loading: () => <MainPlayerSetupPromptSkeleton />,
    ssr: false
  }
)

// Export skeletons for reuse
export {
  RecentMatchesOverviewSkeleton,
  StatsCardsSkeleton,
  QuickActionsHubSkeleton,
  WhatsNewPanelSkeleton,
  PWAInstallationBannerSkeleton,
  CreateNewMatchButtonSkeleton,
  MainPlayerSetupPromptSkeleton
}