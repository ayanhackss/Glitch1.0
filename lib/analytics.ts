export interface AnalyticsEvent {
  id: string
  userId?: string
  sessionId: string
  event: "code_check" | "error_detected" | "ai_query" | "code_fixed"
  language: string
  errorType?: string
  errorMessage?: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface UserSession {
  id: string
  userId?: string
  startTime: Date
  endTime?: Date
  language: string
  errorsFound: number
  errorsFixed: number
  aiQueriesCount: number
  codeChecks: number
}

export interface ErrorStats {
  language: string
  errorType: string
  count: number
  lastSeen: Date
  commonSolutions: string[]
}

export interface DashboardStats {
  totalUsers: number
  totalSessions: number
  totalErrors: number
  totalAIQueries: number
  topLanguages: Array<{ language: string; count: number }>
  topErrors: Array<{ error: string; count: number; language: string }>
  dailyActivity: Array<{ date: string; users: number; errors: number }>
  languageStats: Array<{ language: string; users: number; errors: number; fixes: number }>
}

class AnalyticsManager {
  private events: AnalyticsEvent[] = []
  private sessions: UserSession[] = []
  private currentSession: UserSession | null = null

  constructor() {
    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const savedEvents = localStorage.getItem("debugger_analytics_events")
      const savedSessions = localStorage.getItem("debugger_analytics_sessions")

      if (savedEvents) {
        this.events = JSON.parse(savedEvents).map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        }))
      }

      if (savedSessions) {
        this.sessions = JSON.parse(savedSessions).map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined,
        }))
      }
    }
  }

  startSession(language: string, userId?: string): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    this.currentSession = {
      id: sessionId,
      userId,
      startTime: new Date(),
      language,
      errorsFound: 0,
      errorsFixed: 0,
      aiQueriesCount: 0,
      codeChecks: 0,
    }

    this.sessions.push(this.currentSession)
    this.saveToStorage()
    return sessionId
  }

  endSession() {
    if (this.currentSession) {
      this.currentSession.endTime = new Date()
      this.currentSession = null
      this.saveToStorage()
    }
  }

  trackEvent(event: Omit<AnalyticsEvent, "id" | "timestamp" | "sessionId">) {
    const analyticsEvent: AnalyticsEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.currentSession?.id || "unknown",
      timestamp: new Date(),
      ...event,
    }

    this.events.push(analyticsEvent)

    // Update current session stats
    if (this.currentSession) {
      switch (event.event) {
        case "code_check":
          this.currentSession.codeChecks++
          break
        case "error_detected":
          this.currentSession.errorsFound++
          break
        case "code_fixed":
          this.currentSession.errorsFixed++
          break
        case "ai_query":
          this.currentSession.aiQueriesCount++
          break
      }
    }

    this.saveToStorage()
  }

  getDashboardStats(): DashboardStats {
    const now = new Date()
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Filter recent events
    const recentEvents = this.events.filter((e) => e.timestamp >= last30Days)
    const recentSessions = this.sessions.filter((s) => s.startTime >= last30Days)

    // Calculate top languages
    const languageCounts = new Map<string, number>()
    recentSessions.forEach((s) => {
      languageCounts.set(s.language, (languageCounts.get(s.language) || 0) + 1)
    })

    const topLanguages = Array.from(languageCounts.entries())
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Calculate top errors
    const errorCounts = new Map<string, { count: number; language: string }>()
    recentEvents
      .filter((e) => e.event === "error_detected" && e.errorMessage)
      .forEach((e) => {
        const key = `${e.errorMessage}_${e.language}`
        const existing = errorCounts.get(key)
        if (existing) {
          existing.count++
        } else {
          errorCounts.set(key, { count: 1, language: e.language })
        }
      })

    const topErrors = Array.from(errorCounts.entries())
      .map(([key, data]) => ({
        error: key.split("_")[0],
        count: data.count,
        language: data.language,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Calculate daily activity
    const dailyActivity = this.calculateDailyActivity(recentEvents, recentSessions)

    // Calculate language stats
    const languageStats = this.calculateLanguageStats(recentSessions, recentEvents)

    return {
      totalUsers: new Set(recentSessions.map((s) => s.userId || s.id)).size,
      totalSessions: recentSessions.length,
      totalErrors: recentEvents.filter((e) => e.event === "error_detected").length,
      totalAIQueries: recentEvents.filter((e) => e.event === "ai_query").length,
      topLanguages,
      topErrors,
      dailyActivity,
      languageStats,
    }
  }

  private calculateDailyActivity(events: AnalyticsEvent[], sessions: UserSession[]) {
    const dailyData = new Map<string, { users: Set<string>; errors: number }>()

    // Process sessions for user counts
    sessions.forEach((session) => {
      const dateKey = session.startTime.toISOString().split("T")[0]
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, { users: new Set(), errors: 0 })
      }
      dailyData.get(dateKey)!.users.add(session.userId || session.id)
    })

    // Process events for error counts
    events
      .filter((e) => e.event === "error_detected")
      .forEach((event) => {
        const dateKey = event.timestamp.toISOString().split("T")[0]
        if (!dailyData.has(dateKey)) {
          dailyData.set(dateKey, { users: new Set(), errors: 0 })
        }
        dailyData.get(dateKey)!.errors++
      })

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        users: data.users.size,
        errors: data.errors,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7) // Last 7 days
  }

  private calculateLanguageStats(sessions: UserSession[], events: AnalyticsEvent[]) {
    const languageData = new Map<string, { users: Set<string>; errors: number; fixes: number }>()

    sessions.forEach((session) => {
      if (!languageData.has(session.language)) {
        languageData.set(session.language, { users: new Set(), errors: 0, fixes: 0 })
      }
      const data = languageData.get(session.language)!
      data.users.add(session.userId || session.id)
      data.errors += session.errorsFound
      data.fixes += session.errorsFixed
    })

    return Array.from(languageData.entries())
      .map(([language, data]) => ({
        language,
        users: data.users.size,
        errors: data.errors,
        fixes: data.fixes,
      }))
      .sort((a, b) => b.users - a.users)
  }

  getRecentEvents(limit = 50): AnalyticsEvent[] {
    return this.events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit)
  }

  getRecentSessions(limit = 20): UserSession[] {
    return this.sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime()).slice(0, limit)
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem("debugger_analytics_events", JSON.stringify(this.events))
      localStorage.setItem("debugger_analytics_sessions", JSON.stringify(this.sessions))
    }
  }

  clearData() {
    this.events = []
    this.sessions = []
    this.currentSession = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("debugger_analytics_events")
      localStorage.removeItem("debugger_analytics_sessions")
    }
  }
}

export const analytics = new AnalyticsManager()
