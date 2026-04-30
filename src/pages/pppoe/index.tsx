import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Loader2, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Router {
  id: number
  name: string
}

interface PPPoESecret {
  id: number
  router_id: number
  pppoe_id: string
  username: string
  service: string
  profile: string | null
  local_address: string | null
  remote_address: string | null
  is_active: boolean
  last_login: string | null
  uptime: string | null
  caller_id: string | null
  customer_id: number | null
  router_name: string
  customer_name: string | null
  created_at: string
  updated_at: string
}

export default function PPPoEPage() {
  const [routers, setRouters] = useState<Router[]>([])
  const [secrets, setSecrets] = useState<PPPoESecret[]>([])
  const [selectedRouter, setSelectedRouter] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchRouters()
  }, [])

  useEffect(() => {
    if (selectedRouter) {
      fetchSecrets()
    }
  }, [selectedRouter])

  const fetchRouters = async () => {
    try {
      const res = await fetch('/api/routers')
      if (res.ok) {
        const data = await res.json()
        setRouters(data.filter((r: any) => r.is_active))
        if (data.length > 0 && data[0].is_active) {
          setSelectedRouter(data[0].id.toString())
        }
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data router',
        variant: 'destructive'
      })
    }
  }

  const fetchSecrets = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/pppoe?router_id=${selectedRouter}`)
      if (res.ok) {
        const data = await res.json()
        setSecrets(data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data PPPoE',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!selectedRouter) {
      toast({
        title: 'Error',
        description: 'Pilih router terlebih dahulu',
        variant: 'destructive'
      })
      return
    }

    setSyncing(true)
    try {
      const res = await fetch('/api/pppoe/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ router_id: parseInt(selectedRouter) })
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast({
          title: 'Sinkronisasi Berhasil',
          description: `${data.synced} akun baru ditambahkan, ${data.updated} akun diperbarui dari total ${data.total} akun`
        })
        fetchSecrets()
      } else {
        toast({
          title: 'Sinkronisasi Gagal',
          description: data.message || 'Gagal terhubung ke router',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat sinkronisasi',
        variant: 'destructive'
      })
    } finally {
      setSyncing(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">PPPoE Secrets</h1>
              <p className="text-muted-foreground mt-1">
                Monitor dan kelola akun PPPoE dari MikroTik
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedRouter} onValueChange={setSelectedRouter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Pilih Router" />
                </SelectTrigger>
                <SelectContent>
                  {routers.map((router) => (
                    <SelectItem key={router.id} value={router.id.toString()}>
                      {router.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSync} disabled={syncing || !selectedRouter}>
                {syncing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync PPPoE
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Akun PPPoE</CardTitle>
              <CardDescription>
                {secrets.length} akun tersinkronisasi • {secrets.filter(s => s.is_active).length} sedang online
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : secrets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada data PPPoE. Klik tombol "Sync PPPoE" untuk menarik data dari router.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Profile</TableHead>
                        <TableHead>Local Address</TableHead>
                        <TableHead>Remote Address</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Last Login</TableHead>
                        <TableHead>Uptime</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {secrets.map((secret) => (
                        <TableRow key={secret.id}>
                          <TableCell>
                            {secret.is_active ? (
                              <Badge variant="default" className="gap-1">
                                <Wifi className="w-3 h-3" />
                                Online
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1">
                                <WifiOff className="w-3 h-3" />
                                Offline
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium font-mono text-sm">
                            {secret.username}
                          </TableCell>
                          <TableCell className="text-sm">{secret.profile || '-'}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {secret.local_address || '-'}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {secret.remote_address || '-'}
                          </TableCell>
                          <TableCell>
                            {secret.customer_name ? (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-600" />
                                <span className="text-sm">{secret.customer_name}</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <XCircle className="w-3 h-3" />
                                Belum Terhubung
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(secret.last_login)}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {secret.uptime || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}