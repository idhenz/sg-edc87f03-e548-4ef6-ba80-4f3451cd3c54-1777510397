import { useState, FormEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Wifi } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  if (user) {
    router.push('/dashboard')
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    console.log('[LOGIN DEBUG] Attempting login with email:', email)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      console.log('[LOGIN DEBUG] Login response status:', res.status)
      const data = await res.json()
      console.log('[LOGIN DEBUG] Login response data:', { ...data, token: data.token ? 'EXISTS' : 'NULL' })

      if (res.ok && data.token) {
        console.log('[LOGIN DEBUG] Login successful, calling login() from AuthContext')
        login(data.token, data.user)
        
        // Verify token is saved
        const savedToken = localStorage.getItem('token')
        console.log('[LOGIN DEBUG] Token saved to localStorage:', savedToken ? 'YES' : 'NO')
        console.log('[LOGIN DEBUG] Token length:', savedToken?.length || 0)
        
        toast({
          title: 'Login Berhasil',
          description: `Selamat datang, ${data.user.username}`
        })
        
        console.log('[LOGIN DEBUG] Redirecting to dashboard...')
        router.push('/dashboard')
      } else {
        console.log('[LOGIN DEBUG] Login failed:', data.message)
        toast({
          title: 'Login Gagal',
          description: data.message || 'Username atau password salah',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('[LOGIN DEBUG] Login exception:', error)
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat login',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Wifi className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">ISP Management</CardTitle>
          <CardDescription>Masuk ke sistem operasional</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@isp.co.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}