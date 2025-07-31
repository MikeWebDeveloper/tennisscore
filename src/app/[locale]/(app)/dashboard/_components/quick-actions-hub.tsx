"use client"

import { motion } from '@/lib/framer-motion-config'
import { Play, UserPlus, BarChart3, Users, Settings, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useTranslations } from "@/i18n"
import { useRouter } from "next/navigation"

interface QuickAction {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
  bgColor: string
  featured?: boolean
}

export function QuickActionsHub() {
  const t = useTranslations('dashboard')
  const commonT = useTranslations('common')
  const router = useRouter()

  const quickActions: QuickAction[] = [
    {
      id: 'add-player',
      title: t('addPlayer'),
      description: t('createYourFirstPlayer'),
      icon: UserPlus,
      href: '/players',
      color: 'text-blue-600',
      bgColor: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20'
    },
    {
      id: 'view-stats',
      title: t('viewMoreStats'),
      description: t('advancedAnalytics'),
      icon: BarChart3,
      href: '/statistics',
      color: 'text-purple-600',
      bgColor: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20'
    },
    {
      id: 'manage-players',
      title: t('yourPlayers'),
      description: 'Manage player profiles and preferences',
      icon: Users,
      href: '/players',
      color: 'text-orange-600',
      bgColor: 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20'
    },
    {
      id: 'settings',
      title: commonT('settings'),
      description: 'Configure app preferences and options',
      icon: Settings,
      href: '/settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-500/10 hover:bg-gray-500/20 border-gray-500/20'
    }
  ]

  const handleActionClick = (href: string) => {
    router.push(href)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
    >
      {/* Actions Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * (index + 1) }}
            >
              <Card 
                className={`group cursor-pointer transition-all duration-200 hover:shadow-sm border hover:border-primary/20 ${action.bgColor} h-[120px] sm:h-[130px] md:h-[140px]`}
                onClick={() => handleActionClick(action.href)}
              >
                <CardContent className="p-2 sm:p-3 md:p-4 text-center h-full flex flex-col justify-between">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`p-1.5 sm:p-2 rounded-lg w-fit mx-auto mb-1.5 sm:mb-2 md:mb-3 ${action.bgColor} border ${action.color}`}>
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${action.color}`} />
                    </div>
                    <div className="w-full">
                      <h4 className={`font-medium text-xs sm:text-sm ${action.color} group-hover:opacity-80 transition-opacity mb-1 text-center leading-tight break-words overflow-hidden`}
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical' as const,
                            wordWrap: 'break-word',
                            maxHeight: '2.5rem'
                          }}>
                        {action.title}
                      </h4>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center flex-1 min-h-0">
                    <div className="w-full px-1">
                      <p className="text-xs text-muted-foreground leading-tight text-center break-words overflow-hidden"
                         style={{
                           display: '-webkit-box',
                           WebkitLineClamp: 2,
                           WebkitBoxOrient: 'vertical' as const,
                           wordWrap: 'break-word',
                           maxHeight: '2rem'
                         }}>
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}