"use client"

import { supabase } from "@/lib/supabaseClient"
import { User } from "@supabase/supabase-js"
import { createContext, useContext, useEffect, useState } from "react"

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const getUser = async () => {
      setIsLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if(!mounted) return;
      setUser(user)

      if (user) {
        const { data, error } = await supabase.from("admin_users")
          .select("user_id")
          .eq("user_id", user.id)
          .single()

        if(!mounted) return;
        setIsAdmin(!!data && !error)
      } else {
        setIsAdmin(false)
      }

      setIsLoading(false)
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange(e => {
      if(e === "SIGNED_IN" || e === "SIGNED_OUT") getUser();
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])
  
  const value = { user, isAdmin, isLoading }
  
  return <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)