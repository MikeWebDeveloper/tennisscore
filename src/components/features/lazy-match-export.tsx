import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Loader2 } from "lucide-react"

// Loading component for export buttons
const ExportButtonLoading = ({ variant = "outline", children = "Export" }: { variant?: "outline" | "default", children?: React.ReactNode }) => (
  <Button variant={variant} disabled>
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
    {children}
  </Button>
)

// Lazy load the export dialog components separately
export const LazyFullMatchExportButton = dynamic(
  () => import('./match-export-dialog').then(mod => mod.FullMatchExportButton),
  {
    // Icon-sized so the compact phone header keeps its single row while the dialog code loads
    loading: () => (
      <Button variant="outline" size="icon" disabled className="h-11 w-11" aria-hidden="true">
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    ),
    ssr: false
  }
)

export const LazyLiveSetExportButton = dynamic(
  () => import('./match-export-dialog').then(mod => mod.LiveSetExportButton),
  {
    loading: () => <ExportButtonLoading variant="default">Export</ExportButtonLoading>,
    ssr: false
  }
)