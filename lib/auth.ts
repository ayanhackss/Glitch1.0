export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  createdAt: Date
  lastLogin?: Date
}

export interface AuthSession {
  user: User
  token: string
  expiresAt: Date
}

class AuthManager {
  private sessions: Map<string, AuthSession> = new Map()
  private users: User[] = []

  constructor() {
    // Initialize with default admin user
    this.users = [
      {
        id: "admin-1",
        email: "admin@codedebugger.com",
        name: "Admin User",
        role: "admin",
        createdAt: new Date(),
      },
      {
        id: "ayan-1",
        email: "ayan@codedebugger.com",
        name: "Ayan",
        role: "admin",
        createdAt: new Date(),
      },
      {
        id: "abhishek-1",
        email: "abhishek@codedebugger.com",
        name: "Abhishek",
        role: "admin",
        createdAt: new Date(),
      },
    ]

    // Load from localStorage if available
    if (typeof window !== "undefined") {
      const savedUsers = localStorage.getItem("debugger_users")
      const savedSessions = localStorage.getItem("debugger_sessions")

      if (savedUsers) {
        this.users = JSON.parse(savedUsers).map((u: any) => ({
          ...u,
          createdAt: new Date(u.createdAt),
          lastLogin: u.lastLogin ? new Date(u.lastLogin) : undefined,
        }))
      }

      if (savedSessions) {
        const sessions = JSON.parse(savedSessions)
        Object.entries(sessions).forEach(([token, session]: [string, any]) => {
          this.sessions.set(token, {
            ...session,
            user: {
              ...session.user,
              createdAt: new Date(session.user.createdAt),
              lastLogin: session.user.lastLogin ? new Date(session.user.lastLogin) : undefined,
            },
            expiresAt: new Date(session.expiresAt),
          })
        })
      }
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    // Simple password check (in production, use proper hashing)
    const validCredentials = [
      { email: "admin@codedebugger.com", password: "admin123" },
      { email: "ayan@codedebugger.com", password: "ayan123" },
      { email: "abhishek@codedebugger.com", password: "abhishek123" },
    ]

    const credential = validCredentials.find((c) => c.email === email && c.password === password)
    if (!credential) {
      return { success: false, error: "Invalid email or password" }
    }

    const user = this.users.find((u) => u.email === email)
    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Update last login
    user.lastLogin = new Date()

    // Create session
    const token = this.generateToken()
    const session: AuthSession = {
      user,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }

    this.sessions.set(token, session)
    this.saveToStorage()

    return { success: true, session }
  }

  async logout(token: string): Promise<void> {
    this.sessions.delete(token)
    this.saveToStorage()
  }

  async validateSession(token: string): Promise<AuthSession | null> {
    const session = this.sessions.get(token)
    if (!session) return null

    if (session.expiresAt < new Date()) {
      this.sessions.delete(token)
      this.saveToStorage()
      return null
    }

    return session
  }

  async register(
    email: string,
    name: string,
    password: string,
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    // Check if user already exists
    if (this.users.find((u) => u.email === email)) {
      return { success: false, error: "User already exists" }
    }

    // Create new user
    const user: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email,
      name,
      role: "user",
      createdAt: new Date(),
    }

    this.users.push(user)
    this.saveToStorage()

    return { success: true, user }
  }

  getUsers(): User[] {
    return this.users
  }

  getCurrentUser(token: string): User | null {
    const session = this.sessions.get(token)
    return session?.user || null
  }

  private generateToken(): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
  }

  private saveToStorage() {
    if (typeof window !== "undefined") {
      localStorage.setItem("debugger_users", JSON.stringify(this.users))

      const sessionsObj: Record<string, any> = {}
      this.sessions.forEach((session, token) => {
        sessionsObj[token] = session
      })
      localStorage.setItem("debugger_sessions", JSON.stringify(sessionsObj))
    }
  }

  clearAllData() {
    this.sessions.clear()
    this.users = []
    if (typeof window !== "undefined") {
      localStorage.removeItem("debugger_users")
      localStorage.removeItem("debugger_sessions")
    }
  }
}

export const authManager = new AuthManager()
