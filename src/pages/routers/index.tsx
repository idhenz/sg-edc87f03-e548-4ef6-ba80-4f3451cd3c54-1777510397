import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Loader2, Zap, RefreshCw } from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Router {
  id: number
  name: string
  ip_address: string
  api_port: number
  username: string
  is_active: boolean
  last_sync: string | null
  created_at: string
}

export default function RoutersPage() {
  const { getAuthHeader } = useAuth()
  const [routers, setRouters] = useState<Router[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRouter, setSelectedRouter] = useState<Router | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    api_port: 8728,
    username: '',
    password: '',
    is_active: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [syncingRouter, setSyncingRouter] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchRouters()
  }, [])

  const fetchRouters = async () => {
    try {
      const res = await fetch('/api/routers', {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      })
      
      if (res.ok) {
        const data = await res.json()
        setRouters(data)
      } else {
        toast({ title: 'Error', description: 'Gagal memuat data router', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Terjadi kesalahan jaringan', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!formData.ip_address || !formData.username || !formData.password) {
      toast({ title: 'Error', description: 'Lengkapi IP, Username, Password', variant: 'destructive' })
      return
    }

    setTesting(true)
    try {
      const res = await fetch('/api/routers/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip_address: formData.ip_address,
          api_port: formData.api_port,
          username: formData.username,
          password: formData.password
        })
      })

      const data = await res.json()

      if (data.success) {
        toast({ title: 'Koneksi Berhasil', description: `Router: ${data.identity}` })
      } else {
        toast({ title: 'Koneksi Gagal', description: data.message, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal test koneksi', variant: 'destructive' })
    } finally {
      setTesting(false)
    }
  }

  const handleSyncPPPoE = async (routerId: number, routerName: string) => {
    setSyncingRouter(routerId)
    try {
      const res = await fetch('/api/pppoe/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ router_id: routerId })
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: 'Sinkronisasi Berhasil',
          description: `${routerName}: ${data.synced} akun tersinkronisasi (${data.updated} diperbarui dari total ${data.total})`
        })
        fetchRouters()
      } else {
        toast({
          title: 'Sinkronisasi Gagal',
          description: data.message || 'Gagal menarik data dari router',
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
      setSyncingRouter(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/routers', {
        method: selectedRouter ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(selectedRouter ? { id: selectedRouter.id, ...formData } : formData)
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'Berhasil', description: data.message })
        setDialogOpen(false)
        resetForm()
        fetchRouters()
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menyimpan data', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRouter) return

    try {
      const res = await fetch(`/api/routers?id=${selectedRouter.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      })

      if (res.ok) {
        toast({ title: 'Berhasil', description: 'Router dihapus' })
        setDeleteDialogOpen(false)
        setSelectedRouter(null)
        fetchRouters()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.message, variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menghapus data', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormData({ name: '', ip_address: '', api_port: 8728, username: '', password: '', is_active: true })
    setSelectedRouter(null)
  }

  const handleOpenDialog = (router?: Router) => {
    if (router) {
      setSelectedRouter(router)
      setFormData({
        name: router.name,
        ip_address: router.ip_address,
        api_port: router.api_port,
        username: router.username,
        password: '',
        is_active: router.is_active
      })
    } else {
      resetForm()
    }
    setDialogOpen(true)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('id-ID')
  }

  return (
    <ProtectedRoute adminOnly>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Router MikroTik</h1>
              <p className="text-muted-foreground">Kelola router untuk integrasi PPPoE</p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" /> Tambah Router
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Router</CardTitle>
              <CardDescription>Router yang terdaftar untuk sinkronisasi PPPoE</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : routers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada router. Klik "Tambah Router" untuk menambahkan.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Port</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sync Terakhir</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routers.map((router) => (
                      <TableRow key={router.id}>
                        <TableCell className="font-medium">{router.name}</TableCell>
                        <TableCell className="font-mono">{router.ip_address}</TableCell>
                        <TableCell>{router.api_port}</TableCell>
                        <TableCell>{router.username}</TableCell>
                        <TableCell>
                          <Badge variant={router.is_active ? 'default' : 'secondary'}>
                            {router.is_active ? <CheckCircle className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                            {router.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(router.last_sync)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleSyncPPPoE(router.id, router.name)}
                              disabled={syncingRouter === router.id || !router.is_active}
                              title="Sync PPPoE"
                            >
                              {syncingRouter === router.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(router)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedRouter(router); setDeleteDialogOpen(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedRouter ? 'Edit Router' : 'Tambah Router'}</DialogTitle>
              <DialogDescription>Masukkan data router MikroTik</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Router</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ip_address">IP Address</Label>
                    <Input id="ip_address" value={formData.ip_address} onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })} placeholder="192.168.88.1" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api_port">API Port</Label>
                    <Input id="api_port" type="number" value={formData.api_port} onChange={(e) => setFormData({ ...formData, api_port: parseInt(e.target.value) || 8728 })} />
                    <p className="text-xs text-muted-foreground">Default: 8728, SSL: 8729</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!selectedRouter} />
                    {selectedRouter && <p className="text-xs text-muted-foreground">Kosongkan jika tidak ingin mengubah</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                  <Label htmlFor="is_active">Router Aktif</Label>
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleTestConnection} disabled={testing}>
                  {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
                  Test Koneksi
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Router?</AlertDialogTitle>
              <AlertDialogDescription>
                Router "{selectedRouter?.name}" akan dihapus beserta semua data PPPoE terkait.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppLayout>
    </ProtectedRoute>
  )
}