import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import { ReactNode, useEffect } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: ('admin' | 'reseller')[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    } else if (user && allowedRoles && !allowedRoles.includes(user.role)) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router, allowedRoles])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}