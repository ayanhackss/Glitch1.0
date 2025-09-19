"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { authManager, type User, type AuthSession } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  session: AuthSession | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (email: string, name: string, password: string) => Promise<{ success: boolean; error?: string }>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem("debugger_auth_token")
    if (token) {
      authManager.validateSession(token).then((validSession) => {
        if (validSession) {
          setSession(validSession)
        } else {
          localStorage.removeItem("debugger_auth_token")
        }
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const result = await authManager.login(email, password)
    if (result.success && result.session) {
      setSession(result.session)
      localStorage.setItem("debugger_auth_token", result.session.token)
    }
    return { success: result.success, error: result.error }
  }

  const logout = async () => {
    if (session) {
      await authManager.logout(session.token)
      localStorage.removeItem("debugger_auth_token")
      setSession(null)
    }
  }

  const register = async (email: string, name: string, password: string) => {
    return await authManager.register(email, name, password)
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        session,
        login,
        logout,
        register,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
