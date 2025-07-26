/**
 * New Activity Tracker - Monitors and captures new user activities
 * Specifically designed to catch new activities and provide real-time insights
 */

export interface NewActivity {
  id: string
  timestamp: Date
  type: 'match_created' | 'player_added' | 'match_completed' | 'achievement_unlocked' | 'streak_milestone' | 'performance_improvement' | 'error_occurred' | 'feature_used'
  category: 'tennis' | 'user' | 'system' | 'achievement'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  data?: Record<string, any>
  userId?: string
  playerId?: string
  matchId?: string
  isNew: boolean
  acknowledged: boolean
  expiresAt?: Date
}

export interface ActivityTrackerConfig {
  enabled: boolean
  maxActivities: number
  autoExpireHours: number
  persistToStorage: boolean
  realTimeNotifications: boolean
  categories: string[]
}

class NewActivityTracker {
  private activities: NewActivity[] = []
  private config: ActivityTrackerConfig
  private listeners: Set<(activity: NewActivity) => void> = new Set()

  constructor(config: Partial<ActivityTrackerConfig> = {}) {
    this.config = {
      enabled: true,
      maxActivities: 100,
      autoExpireHours: 24,
      persistToStorage: true,
      realTimeNotifications: true,
      categories: ['tennis', 'user', 'system', 'achievement'],
      ...config
    }
    
    this.loadFromStorage()
    this.startAutoExpiration()
  }

  private generateId(): string {
    return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private addActivity(activity: Omit<NewActivity, 'id' | 'timestamp' | 'isNew' | 'acknowledged'>): NewActivity {
    const newActivity: NewActivity = {
      ...activity,
      id: this.generateId(),
      timestamp: new Date(),
      isNew: true,
      acknowledged: false,
      expiresAt: new Date(Date.now() + this.config.autoExpireHours * 60 * 60 * 1000)
    }

    this.activities.unshift(newActivity) // Add to beginning

    // Keep only the latest activities
    if (this.activities.length > this.config.maxActivities) {
      this.activities = this.activities.slice(0, this.config.maxActivities)
    }

    // Persist to storage
    if (this.config.persistToStorage) {
      this.saveToStorage()
    }

    // Notify listeners
    if (this.config.realTimeNotifications) {
      this.notifyListeners(newActivity)
    }

    return newActivity
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      const data = JSON.stringify({
        activities: this.activities,
        lastUpdated: new Date().toISOString()
      })
      localStorage.setItem('tennisscore_new_activities', data)
    } catch (error) {
      console.warn('Failed to save new activities to storage:', error)
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return
    
    try {
      const data = localStorage.getItem('tennisscore_new_activities')
      if (data) {
        const parsed = JSON.parse(data)
        this.activities = (parsed.activities || []).map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp),
          expiresAt: activity.expiresAt ? new Date(activity.expiresAt) : undefined
        }))
      }
    } catch (error) {
      console.warn('Failed to load new activities from storage:', error)
    }
  }

  private startAutoExpiration(): void {
    if (typeof window === 'undefined') return
    
    // Check for expired activities every 5 minutes
    setInterval(() => {
      const now = new Date()
      const beforeCount = this.activities.length
      
      this.activities = this.activities.filter(activity => {
        if (activity.expiresAt && activity.expiresAt < now) {
          return false
        }
        return true
      })

      if (this.activities.length !== beforeCount) {
        this.saveToStorage()
      }
    }, 5 * 60 * 1000)
  }

  private notifyListeners(activity: NewActivity): void {
    this.listeners.forEach(listener => {
      try {
        listener(activity)
      } catch (error) {
        console.warn('Error in activity listener:', error)
      }
    })
  }

  // Public API methods

  /**
   * Track a new match creation
   */
  trackMatchCreated(matchId: string, matchData: any, userId?: string): NewActivity {
    return this.addActivity({
      type: 'match_created',
      category: 'tennis',
      title: 'Nový zápas vytvořen',
      description: `Zápas byl úspěšně vytvořen`,
      priority: 'medium',
      data: matchData,
      userId,
      matchId
    })
  }

  /**
   * Track a new player addition
   */
  trackPlayerAdded(playerId: string, playerData: any, userId?: string): NewActivity {
    return this.addActivity({
      type: 'player_added',
      category: 'user',
      title: 'Nový hráč přidán',
      description: `Hráč ${playerData.firstName} ${playerData.lastName} byl přidán`,
      priority: 'medium',
      data: playerData,
      userId,
      playerId
    })
  }

  /**
   * Track match completion
   */
  trackMatchCompleted(matchId: string, matchData: any, userId?: string): NewActivity {
    const isWin = matchData.winnerId === userId
    return this.addActivity({
      type: 'match_completed',
      category: 'tennis',
      title: isWin ? 'Zápas vyhrán!' : 'Zápas dokončen',
      description: `Zápas byl dokončen s výsledkem ${matchData.finalScore || 'N/A'}`,
      priority: 'high',
      data: matchData,
      userId,
      matchId
    })
  }

  /**
   * Track achievement unlock
   */
  trackAchievementUnlocked(achievementId: string, achievementData: any, userId?: string): NewActivity {
    return this.addActivity({
      type: 'achievement_unlocked',
      category: 'achievement',
      title: 'Úspěch odemčen!',
      description: achievementData.description || 'Nový úspěch byl odemčen',
      priority: 'high',
      data: achievementData,
      userId
    })
  }

  /**
   * Track streak milestone
   */
  trackStreakMilestone(streakCount: number, userId?: string): NewActivity {
    return this.addActivity({
      type: 'streak_milestone',
      category: 'achievement',
      title: `${streakCount} vítězná série!`,
      description: `Dosáhli jste ${streakCount} vítězství v řadě`,
      priority: 'high',
      data: { streakCount },
      userId
    })
  }

  /**
   * Track performance improvement
   */
  trackPerformanceImprovement(improvementData: any, userId?: string): NewActivity {
    return this.addActivity({
      type: 'performance_improvement',
      category: 'achievement',
      title: 'Zlepšení výkonu!',
      description: 'Váš výkon se zlepšil oproti předchozímu období',
      priority: 'medium',
      data: improvementData,
      userId
    })
  }

  /**
   * Track error occurrence
   */
  trackErrorOccurred(error: string, errorData: any, userId?: string): NewActivity {
    return this.addActivity({
      type: 'error_occurred',
      category: 'system',
      title: 'Došlo k chybě',
      description: error,
      priority: 'critical',
      data: errorData,
      userId
    })
  }

  /**
   * Track feature usage
   */
  trackFeatureUsed(featureName: string, featureData: any, userId?: string): NewActivity {
    return this.addActivity({
      type: 'feature_used',
      category: 'user',
      title: `Funkce použita: ${featureName}`,
      description: `Použili jste funkci ${featureName}`,
      priority: 'low',
      data: featureData,
      userId
    })
  }

  /**
   * Get all activities
   */
  getActivities(): NewActivity[] {
    return [...this.activities]
  }

  /**
   * Get new (unacknowledged) activities
   */
  getNewActivities(): NewActivity[] {
    return this.activities.filter(activity => activity.isNew && !activity.acknowledged)
  }

  /**
   * Get activities by type
   */
  getActivitiesByType(type: NewActivity['type']): NewActivity[] {
    return this.activities.filter(activity => activity.type === type)
  }

  /**
   * Get activities by category
   */
  getActivitiesByCategory(category: string): NewActivity[] {
    return this.activities.filter(activity => activity.category === category)
  }

  /**
   * Get activities by priority
   */
  getActivitiesByPriority(priority: NewActivity['priority']): NewActivity[] {
    return this.activities.filter(activity => activity.priority === priority)
  }

  /**
   * Acknowledge an activity
   */
  acknowledgeActivity(activityId: string): void {
    const activity = this.activities.find(a => a.id === activityId)
    if (activity) {
      activity.acknowledged = true
      activity.isNew = false
      this.saveToStorage()
    }
  }

  /**
   * Acknowledge all activities
   */
  acknowledgeAllActivities(): void {
    this.activities.forEach(activity => {
      activity.acknowledged = true
      activity.isNew = false
    })
    this.saveToStorage()
  }

  /**
   * Remove an activity
   */
  removeActivity(activityId: string): void {
    this.activities = this.activities.filter(activity => activity.id !== activityId)
    this.saveToStorage()
  }

  /**
   * Clear all activities
   */
  clearActivities(): void {
    this.activities = []
    this.saveToStorage()
  }

  /**
   * Get activity statistics
   */
  getActivityStats(): {
    total: number
    new: number
    byType: Record<string, number>
    byCategory: Record<string, number>
    byPriority: Record<string, number>
  } {
    const byType = this.activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byCategory = this.activities.reduce((acc, activity) => {
      acc[activity.category] = (acc[activity.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byPriority = this.activities.reduce((acc, activity) => {
      acc[activity.priority] = (acc[activity.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: this.activities.length,
      new: this.getNewActivities().length,
      byType,
      byCategory,
      byPriority
    }
  }

  /**
   * Add a listener for new activities
   */
  addListener(listener: (activity: NewActivity) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Export activities as JSON
   */
  exportActivities(): string {
    return JSON.stringify({
      activities: this.activities,
      stats: this.getActivityStats(),
      exportedAt: new Date().toISOString()
    }, null, 2)
  }
}

// Create a singleton instance
export const newActivityTracker = new NewActivityTracker()

// Convenience functions for common tracking
export const trackMatchCreated = (matchId: string, matchData: any, userId?: string) => {
  return newActivityTracker.trackMatchCreated(matchId, matchData, userId)
}

export const trackPlayerAdded = (playerId: string, playerData: any, userId?: string) => {
  return newActivityTracker.trackPlayerAdded(playerId, playerData, userId)
}

export const trackMatchCompleted = (matchId: string, matchData: any, userId?: string) => {
  return newActivityTracker.trackMatchCompleted(matchId, matchData, userId)
}

export const trackAchievementUnlocked = (achievementId: string, achievementData: any, userId?: string) => {
  return newActivityTracker.trackAchievementUnlocked(achievementId, achievementData, userId)
}

export const trackStreakMilestone = (streakCount: number, userId?: string) => {
  return newActivityTracker.trackStreakMilestone(streakCount, userId)
}

export const trackPerformanceImprovement = (improvementData: any, userId?: string) => {
  return newActivityTracker.trackPerformanceImprovement(improvementData, userId)
}

export const trackErrorOccurred = (error: string, errorData: any, userId?: string) => {
  return newActivityTracker.trackErrorOccurred(error, errorData, userId)
}

export const trackFeatureUsed = (featureName: string, featureData: any, userId?: string) => {
  return newActivityTracker.trackFeatureUsed(featureName, featureData, userId)
}

export default newActivityTracker 