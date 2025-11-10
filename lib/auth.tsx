"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type React from "react"
import type { AuthChangeEvent, Session, User as SupabaseUser } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "editor" | "contributor"
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapUser(user: SupabaseUser | null | undefined): User | null {
  if (!user) return null

  const metadata = user.user_metadata || {}
  const role =
    (user.app_metadata?.role as User["role"] | undefined) ||
    (metadata.role as User["role"] | undefined) ||
    "editor"

  if (role !== "admin" && role !== "editor" && role !== "contributor") {
    return null
  }

  return {
    id: user.id,
    email: user.email ?? "",
    name: (metadata.display_name as string) || user.email || "User",
    role,
    avatar: (metadata.avatar_url as string) || undefined,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        setUser(mapUser(data.session?.user) ?? null)
      } finally {
        setLoading(false)
      }
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(mapUser(session?.user) ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const supabase = createClient()
    const normalizedEmail = email.trim()
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (error) {
      throw error
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const mapped = mapUser(session?.user) ?? null
    if (!mapped) {
      throw new Error("Unauthorized")
    }

    setUser(mapped)
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
