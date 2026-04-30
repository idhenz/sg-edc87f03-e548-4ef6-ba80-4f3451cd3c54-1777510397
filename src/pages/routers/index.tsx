import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Router {
  id: number
  name: string
  ip_address: string
  api_port: number
  username: string
  is_active: boolean
  last_sync: string | null
  created_at: string
  updated_at: string
}

export default function RoutersPage() {
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
  const { toast } = useToast()

  useEffect(() => {
    fetchRouters()
  }, [])

  const fetchRouters = async () => {
    try {
      const res = await fetch('/api/routers')
      if (res.ok) {
        const data = await res.json()
        setRouters(data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data router',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
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
      setSelectedRouter(null)
      setFormData({
        name: '',
        ip_address: '',
        api_port: 8728,
        username: '',
        password: '',
        is_active: true
      })
    }
    setDialogOpen(true)
  }

  const handleTestConnection = async () => {
    if (!formData.ip_address || !formData.username || !formData.password) {
      toast({
        title: 'Error',
        description: 'Lengkapi IP Address, Username, dan Password terlebih dahulu',
        variant: 'destructive'
      })
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

      if (res.ok && data.success) {
        toast({
          title: 'Koneksi Berhasil',
          description: `Terhubung ke router: ${data.identity}`
        })
      } else {
        toast({
          title: 'Koneksi Gagal',
          description: data.message || 'Tidak dapat terhubung ke router',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat testing koneksi',
        variant: 'destructive'
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const url = '/api/routers'
      const method = selectedRouter ? 'PUT' : 'POST'
      const payload = selectedRouter 
        ? { ...formData, id: selectedRouter.id }
        : formData

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: selectedRouter ? 'Router berhasil diperbarui' : 'Router berhasil ditambahkan'
        })
        setDialogOpen(false)
        fetchRouters()
      } else {
        const error = await res.json()
        toast({
          title: 'Error',
          description: error.message || 'Gagal menyimpan data router',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menyimpan data',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedRouter) return
    setSubmitting(true)

    try {
      const res = await fetch(`/api/routers?id=${selectedRouter.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: 'Router berhasil dihapus'
        })
        setDeleteDialogOpen(false)
        fetchRouters()
      } else {
        toast({
          title: 'Error',
          description: 'Gagal menghapus router',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan saat menghapus data',
        variant: 'destructive'
      })
    } finally {
      setSubmitting(false)
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
              <h1 className="text-3xl font-bold tracking-tight">Router MikroTik</h1>
              <p className="text-muted-foreground mt-1">
                Kelola router MikroTik untuk sinkronisasi data PPPoE
              </p>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Router
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Router</CardTitle>
              <CardDescription>
                {routers.length} router terdaftar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : routers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Belum ada router terdaftar
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Router</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Port API</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sinkronisasi Terakhir</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routers.map((router) => (
                      <TableRow key={router.id}>
                        <TableCell className="font-medium">{router.name}</TableCell>
                        <TableCell className="font-mono text-sm">{router.ip_address}</TableCell>
                        <TableCell className="font-mono text-sm">{router.api_port}</TableCell>
                        <TableCell>{router.username}</TableCell>
                        <TableCell>
                          {router.is_active ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="w-3 h-3" />
                              Nonaktif
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(router.last_sync)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(router)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedRouter(router)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedRouter ? 'Edit Router' : 'Tambah Router'}
              </DialogTitle>
              <DialogDescription>
                Masukkan informasi koneksi router MikroTik
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Router *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Router Utama"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ip_address">IP Address *</Label>
                  <Input
                    id="ip_address"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    placeholder="192.168.88.1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_port">API Port *</Label>
                  <Input
                    id="api_port"
                    type="number"
                    value={formData.api_port}
                    onChange={(e) => setFormData({ ...formData, api_port: parseInt(e.target.value) })}
                    placeholder="8728"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Port 8728 untuk API biasa, 8729 untuk API SSL
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="admin"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password {selectedRouter && '(kosongkan jika tidak diubah)'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required={!selectedRouter}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Status Aktif</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="w-full"
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 mr-2" />
                  )}
                  Test Koneksi
                </Button>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {selectedRouter ? 'Perbarui' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Router?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus router <strong>{selectedRouter?.name}</strong>? 
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppLayout>
    </ProtectedRoute>
  )
}