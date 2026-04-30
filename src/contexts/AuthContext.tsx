import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/router'

interface User {
  id: number
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  getAuthHeader: () => Record<string, string>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        console.log('[AUTH] Loaded user from localStorage:', userData.email)
        setUser(userData)
      } catch (e) {
        console.error('[AUTH] Failed to parse saved user')
        localStorage.removeItem('user')
      }
    }
  }, [])

  const login = (userData: User) => {
    console.log('[AUTH] Login user:', userData.email)
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    console.log('[AUTH] Logout user')
    setUser(null)
    localStorage.removeItem('user')
    router.push('/login')
  }

  const getAuthHeader = () => {
    if (!user) {
      console.log('[AUTH] No user session for headers')
      return {}
    }
    console.log('[AUTH] Sending session header for:', user.email)
    return { 'X-User-Session': JSON.stringify(user) }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, getAuthHeader }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}