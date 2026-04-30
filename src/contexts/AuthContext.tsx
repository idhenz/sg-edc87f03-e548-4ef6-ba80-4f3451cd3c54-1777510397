import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/router'

interface User {
  id: number
  username: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    console.log('[AUTH DEBUG] AuthProvider mounted, checking for existing token...')
    const token = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    console.log('[AUTH DEBUG] Token exists:', token ? 'YES' : 'NO')
    console.log('[AUTH DEBUG] User exists:', savedUser ? 'YES' : 'NO')
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        console.log('[AUTH DEBUG] Restored user from localStorage:', parsedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error('[AUTH DEBUG] Error parsing saved user:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }, [])

  const login = (token: string, userData: User) => {
    console.log('[AUTH DEBUG] login() called with token length:', token.length)
    console.log('[AUTH DEBUG] login() called with user:', userData)
    
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    
    // Verify immediately
    const verifyToken = localStorage.getItem('token')
    const verifyUser = localStorage.getItem('user')
    console.log('[AUTH DEBUG] Verification - Token saved:', verifyToken ? 'YES' : 'NO')
    console.log('[AUTH DEBUG] Verification - User saved:', verifyUser ? 'YES' : 'NO')
    
    setUser(userData)
    console.log('[AUTH DEBUG] User state updated')
  }

  const logout = () => {
    console.log('[AUTH DEBUG] logout() called')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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