'use client'

import React, { useState } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  Share, 
  Mail, 
  MessageCircle, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Clock,
  Trophy,
  Target,
  Activity
} from 'lucide-react'
import { Match } from '@/stores/matchStore'
import { 
  exportMatchToPDF, 
  downloadPDF, 
  shareMatchReport, 
  shareToWhatsApp, 
  shareToEmail,
  ExportOptions 
} from '@/lib/utils/match-export'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useTranslations } from '@/i18n'

interface MatchExportDialogProps {
  match: Match
  playerNames: [string, string]
  trigger: React.ReactNode
  exportType: 'live_set' | 'full_match'
  setNumber?: number
  disabled?: boolean
}

export function MatchExportDialog({ 
  match, 
  playerNames, 
  trigger, 
  exportType, 
  setNumber,
  disabled = false 
}: MatchExportDialogProps) {
  const t = useTranslations('common')
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includePointByPoint: true,
    includeAdvancedStats: true,
    includeCharts: false,
    includeTrends: false,
    template: 'professional',
    exportType,
    setNumber
  })

  const handleExportOption = (key: keyof ExportOptions, value: boolean | string) => {
    setExportOptions(prev => ({ ...prev, [key]: value }))
  }

  const generateMatchTitle = () => {
    const dateStr = format(new Date(match.matchDate), 'yyyy-MM-dd')
    const players = `${playerNames[0]} vs ${playerNames[1]}`
    return exportType === 'live_set' 
      ? `${players} - Set ${setNumber} - ${dateStr}`
      : `${players} - ${dateStr}`
  }

  const handleExport = async (action: 'download' | 'share' | 'whatsapp' | 'email') => {
    setIsExporting(true)
    
    try {
      const blob = await exportMatchToPDF(match, playerNames, exportOptions)
      const title = generateMatchTitle()
      
      switch (action) {
        case 'download':
          downloadPDF(blob, title)
          toast.success(t('matchReportDownloadedSuccessfully'))
          break
        case 'share':
          await shareMatchReport(blob, title)
          toast.success(t('matchReportSharedSuccessfully'))
          break
        case 'whatsapp':
          shareToWhatsApp(blob, title)
          toast.success(t('openingWhatsAppToShare'))
          break
        case 'email':
          shareToEmail(blob, title)
          toast.success(t('openingEmailToShare'))
          break
      }
      
      setIsOpen(false)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error(t('failedToExportMatchReport'))
    } finally {
      setIsExporting(false)
    }
  }

  const getExportPreview = () => {
    const pointCount = match.pointLog?.length || 0
    const completedSets = match.score.sets.length
    
    return {
      points: exportType === 'live_set' && setNumber 
        ? match.pointLog?.filter(p => p.setNumber === setNumber).length || 0
        : pointCount,
      sets: exportType === 'live_set' ? (setNumber ? 1 : 0) : completedSets,
      statistics: true,
      advanced: exportOptions.includeAdvancedStats,
      pointByPoint: exportOptions.includePointByPoint,
      template: exportOptions.template,
      sections: exportOptions.template === 'detailed' 
        ? [t('matchOverview'), t('coreStatistics'), t('advancedStatistics'), t('tacticalAnalysis'), t('pressurePoints'), t('setAnalysis'), t('pointByPoint')]
        : exportOptions.template === 'professional'
        ? [t('matchOverview'), t('coreStatistics'), t('advancedStatistics'), t('setAnalysis'), t('pointByPoint')]
        : [t('matchOverview'), t('coreStatistics'), t('setAnalysis')]
    }
  }

  const preview = getExportPreview()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild disabled={disabled}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {exportType === 'live_set' ? t('exportSetReport', { setNumber: setNumber || 0 }) : t('exportMatchReport')}
          </DialogTitle>
          <DialogDescription>
            {t('generateProfessionalTennisReport')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Match Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('matchInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('players')}:</span>
                <span className="text-sm font-medium">{playerNames[0]} vs {playerNames[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('date')}:</span>
                <span className="text-sm font-medium">{format(new Date(match.matchDate), 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('format')}:</span>
                <span className="text-sm font-medium">{t('bestOf')} {match.matchFormat.sets}</span>
              </div>
              {match.status === 'Completed' && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('winner')}:</span>
                  <span className="text-sm font-medium">
                    {match.winnerId === match.playerOneId ? playerNames[0] : playerNames[1]}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('exportOptions')}</CardTitle>
              <CardDescription>{t('chooseWhatToInclude')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Template Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('reportTemplate')}</Label>
                <RadioGroup
                  value={exportOptions.template}
                  onValueChange={(value: 'professional' | 'basic' | 'detailed') => 
                    handleExportOption('template', value)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="professional" id="professional" />
                    <Label htmlFor="professional" className="text-sm">{t('professional')}</Label>
                    <span className="text-xs text-muted-foreground ml-2">
                      {t('professionalDescription')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="detailed" id="detailed" />
                    <Label htmlFor="detailed" className="text-sm">{t('detailed')}</Label>
                    <span className="text-xs text-muted-foreground ml-2">
                      {t('detailedDescription')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="basic" id="basic" />
                    <Label htmlFor="basic" className="text-sm">{t('basic')}</Label>
                    <span className="text-xs text-muted-foreground ml-2">
                      {t('basicDescription')}
                    </span>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Content Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">{t('includeContent')}</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pointByPoint"
                      checked={exportOptions.includePointByPoint}
                      onCheckedChange={(checked) => 
                        handleExportOption('includePointByPoint', checked as boolean)
                      }
                    />
                    <Label htmlFor="pointByPoint" className="text-sm">{t('pointByPointLog')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="advancedStats"
                      checked={exportOptions.includeAdvancedStats}
                      onCheckedChange={(checked) => 
                        handleExportOption('includeAdvancedStats', checked as boolean)
                      }
                    />
                    <Label htmlFor="advancedStats" className="text-sm">{t('advancedStatistics')}</Label>
                  </div>
                  <div className="flex items-center space-x-2 opacity-50">
                    <Checkbox
                      id="charts"
                      checked={exportOptions.includeCharts}
                      onCheckedChange={(checked) => 
                        handleExportOption('includeCharts', checked as boolean)
                      }
                      disabled
                    />
                    <Label htmlFor="charts" className="text-sm">{t('chartsAndVisualizations')}</Label>
                    <span className="text-xs text-muted-foreground">({t('comingSoon')})</span>
                  </div>
                  <div className="flex items-center space-x-2 opacity-50">
                    <Checkbox
                      id="trends"
                      checked={exportOptions.includeTrends}
                      onCheckedChange={(checked) => 
                        handleExportOption('includeTrends', checked as boolean)
                      }
                      disabled
                    />
                    <Label htmlFor="trends" className="text-sm">{t('momentumTrends')}</Label>
                    <span className="text-xs text-muted-foreground">({t('comingSoon')})</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t('exportPreview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{t('points')}: {preview.points}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">{t('sets')}: {preview.sets}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{t('statistics')}: ✓</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">
                      {t('advanced')}: {preview.advanced ? '✓' : '✗'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Template Preview */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <div className="flex items-center gap-2 text-gray-700 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('templateSections', { template: preview.template.charAt(0).toUpperCase() + preview.template.slice(1) })}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {preview.sections.map((section, index) => (
                    <span key={index} className="text-xs bg-white px-2 py-1 rounded border text-gray-600">
                      {section}
                    </span>
                  ))}
                </div>
              </div>
              
              {exportType === 'live_set' && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">{t('liveSetExport')}</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {t('liveSetExportDescription', { setNumber: setNumber || 0 })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            {/* Primary actions */}
            <div className="flex gap-2 flex-1">
              <Button
                onClick={() => handleExport('download')}
                disabled={isExporting}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('downloadPDF')}
              </Button>
              <Button
                onClick={() => handleExport('share')}
                disabled={isExporting}
                variant="outline"
                className="flex-1"
              >
                <Share className="h-4 w-4 mr-2" />
                {t('share')}
              </Button>
            </div>
            
            {/* Secondary actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleExport('whatsapp')}
                disabled={isExporting}
                variant="outline"
                size="sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('whatsApp')}
              </Button>
              <Button
                onClick={() => handleExport('email')}
                disabled={isExporting}
                variant="outline"
                size="sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                {t('email')}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Quick export button components for different contexts
export function LiveSetExportButton({ 
  match, 
  playerNames, 
  setNumber, 
  className = '' 
}: { 
  match: Match
  playerNames: [string, string]
  setNumber: number
  className?: string
}) {
  const t = useTranslations('common')
  const canExport = match.score.sets.length >= setNumber

  return (
    <MatchExportDialog
      match={match}
      playerNames={playerNames}
      exportType="live_set"
      setNumber={setNumber}
      disabled={!canExport}
      trigger={
        <Button
          variant="outline"
          size="sm"
          disabled={!canExport}
          className={className}
        >
          <FileText className="h-4 w-4 mr-2" />
          {t('exportSet', { setNumber: setNumber || 0 })}
        </Button>
      }
    />
  )
}

export function FullMatchExportButton({ 
  match, 
  playerNames, 
  variant = 'default',
  size = 'default',
  className = '' 
}: { 
  match: Match
  playerNames: [string, string]
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}) {
  const t = useTranslations('common')
  const canExport = (match.pointLog && match.pointLog.length > 0) || (match.score && match.score.sets && match.score.sets.length > 0)

  return (
    <MatchExportDialog
      match={match}
      playerNames={playerNames}
      exportType="full_match"
      disabled={!canExport}
      trigger={
        <Button
          variant={variant}
          size={size}
          disabled={!canExport}
          className={className}
        >
          <FileText className="h-4 w-4 mr-2" />
          {t('exportMatchReport')}
        </Button>
      }
    />
  )
}