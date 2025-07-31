import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { List, Users, Trophy, Filter } from 'lucide-react'

// Generic table skeleton
const DataTableSkeleton = ({ 
  title, 
  icon: Icon, 
  rows = 5, 
  columns = 4 
}: { 
  title?: string; 
  icon?: any; 
  rows?: number; 
  columns?: number; 
}) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5" />}
        <Skeleton className="h-6 w-32" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Filters/search */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-24" />
        </div>
        
        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                {Array.from({ length: columns }).map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: rows }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: columns }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

// Matches List skeleton
const MatchesListSkeleton = () => (
  <div className="space-y-4">
    {/* Header with filters */}
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Match cards/rows */}
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

// Player List skeleton
const PlayerListSkeleton = () => (
  <div className="space-y-4">
    {/* Search and actions */}
    <div className="flex justify-between items-center">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-32" />
    </div>
    
    {/* Player grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16" />
                <div className="flex space-x-2">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="h-6 w-8" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

// Virtual Matches List skeleton (for statistics)
const VirtualMatchesListSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <List className="h-5 w-5" />
        <Skeleton className="h-6 w-32" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Virtual scroll container */}
        <div className="h-[400px] border rounded-lg p-2">
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Load more indicator */}
        <div className="text-center">
          <Skeleton className="h-4 w-40 mx-auto" />
        </div>
      </div>
    </CardContent>
  </Card>
)

// Statistics Filters skeleton
const StatisticsFiltersSkeleton = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Filter className="h-5 w-5" />
        <Skeleton className="h-6 w-20" />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Filter sections */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
        
        {/* Apply button */}
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
)

// Lazy load data table components
export const LazyMatchesList = dynamic(
  () => import('../app/[locale]/(app)/matches/_components/matches-list').then(mod => ({ default: mod.MatchesList })),
  {
    loading: () => <MatchesListSkeleton />,
    ssr: false
  }
)

export const LazyPlayerList = dynamic(
  () => import('../app/[locale]/(app)/players/_components/player-list').then(mod => ({ default: mod.PlayerList })),
  {
    loading: () => <PlayerListSkeleton />,
    ssr: false
  }
)

export const LazyVirtualMatchesList = dynamic(
  () => import('../app/[locale]/(app)/statistics/_components/virtual-matches-list').then(mod => ({ default: mod.VirtualMatchesList })),
  {
    loading: () => <VirtualMatchesListSkeleton />,
    ssr: false
  }
)

export const LazyStatisticsFilters = dynamic(
  () => import('../app/[locale]/(app)/statistics/_components/statistics-filters').then(mod => ({ default: mod.StatisticsFilters })),
  {
    loading: () => <StatisticsFiltersSkeleton />,
    ssr: false
  }
)

// Generic lazy data table for reuse
export const LazyDataTable = dynamic(
  () => import('../components/ui/data-table').then(mod => ({ default: mod.DataTable })),
  {
    loading: () => <DataTableSkeleton />,
    ssr: false
  }
)

// Export skeletons for reuse
export {
  DataTableSkeleton,
  MatchesListSkeleton,
  PlayerListSkeleton,
  VirtualMatchesListSkeleton,
  StatisticsFiltersSkeleton
}