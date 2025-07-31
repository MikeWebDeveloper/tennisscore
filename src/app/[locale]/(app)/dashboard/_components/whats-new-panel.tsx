"use client"

import { motion } from '@/lib/framer-motion-config'
import { Sparkles, ChevronRight, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "@/i18n"

interface WhatsNewItem {
  id: string
  title: string
  description: string
  type: 'feature' | 'improvement' | 'bugfix'
  date: string
  isNew?: boolean
}

export function WhatsNewPanel() {
  const t = useTranslations('dashboard')
  const commonT = useTranslations('common')

  // User-friendly updates from i18n translations
  const updates: WhatsNewItem[] = [
    {
      id: '1',
      title: t('whatsNewUpdates.enhancedTranslationSystem.title'),
      description: t('whatsNewUpdates.enhancedTranslationSystem.description'),
      type: 'feature',
      date: '2024-07-29',
      isNew: true
    },
    {
      id: '2', 
      title: t('whatsNewUpdates.advancedPointLogging.title'),
      description: t('whatsNewUpdates.advancedPointLogging.description'),
      type: 'feature',
      date: '2024-07-28',
      isNew: true
    },
    {
      id: '3',
      title: t('whatsNewUpdates.improvedMatchStatistics.title'),
      description: t('whatsNewUpdates.improvedMatchStatistics.description'),
      type: 'improvement',
      date: '2024-07-27'
    },
    {
      id: '4',
      title: t('whatsNewUpdates.componentQualityFixes.title'),
      description: t('whatsNewUpdates.componentQualityFixes.description'),
      type: 'bugfix',
      date: '2024-07-26'
    }
  ]

  const getTypeColor = (type: WhatsNewItem['type']) => {
    switch (type) {
      case 'feature':
        return 'bg-green-500/10 text-green-600 border-green-500/20'
      case 'improvement':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      case 'bugfix':
        return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const getTypeLabel = (type: WhatsNewItem['type']) => {
    switch (type) {
      case 'feature':
        return commonT('new')
      case 'improvement':
        return commonT('improved')
      case 'bugfix':
        return commonT('fixed')
      default:
        return commonT('update')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return commonT('yesterday')
    if (diffDays <= 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="bg-gradient-to-br from-background to-muted/30 border-muted">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            {t('whatsNew')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {updates.map((update, index) => (
            <motion.div
              key={update.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              className="group flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                    {update.title}
                  </h4>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {update.isNew && (
                      <Badge variant="secondary" className="text-xs px-2 py-0 bg-primary/10 text-primary border-primary/20">
                        {commonT('new')}
                      </Badge>
                    )}
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0 ${getTypeColor(update.type)}`}
                    >
                      {getTypeLabel(update.type)}
                    </Badge>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  {update.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(update.date)}
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </motion.div>
          ))}
          
          <motion.div 
            className="pt-2 border-t border-muted/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <p className="text-xs text-center text-muted-foreground">
              {t('stayTunedForMoreUpdates')}
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}