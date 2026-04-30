import { useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log('[LOGIN DEBUG] Attempting login with username:', username)
    console.log('[LOGIN DEBUG] Password length:', password.length)

    const loginData = {
      username: username,
      password: password
    }
    console.log('[LOGIN DEBUG] Sending login data:', { username: loginData.username, password: '***' })

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
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
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Masuk ke sistem manajemen operasional</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}