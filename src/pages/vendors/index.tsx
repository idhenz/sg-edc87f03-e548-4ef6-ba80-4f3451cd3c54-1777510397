import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { Building2, Plus, Pencil, Trash2, Search } from 'lucide-react'

interface Vendor {
  id: number
  name: string
  contact: string
  address: string
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const { toast } = useToast()

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/vendors')
      const data = await res.json()
      setVendors(data.vendors || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data vendor',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const data = {
      name: formData.get('name'),
      contact: formData.get('contact'),
      address: formData.get('address'),
    }

    try {
      setSaving(true)
      const url = editingVendor ? `/api/vendors?id=${editingVendor.id}` : '/api/vendors'
      const method = editingVendor ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Gagal menyimpan data')

      toast({
        title: 'Berhasil',
        description: editingVendor ? 'Vendor berhasil diperbarui' : 'Vendor baru berhasil ditambahkan',
      })

      setIsDialogOpen(false)
      setEditingVendor(null)
      fetchVendors()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan data vendor',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus vendor ini?')) return

    try {
      const res = await fetch(`/api/vendors?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus data')

      toast({
        title: 'Berhasil',
        description: 'Vendor berhasil dihapus',
      })
      fetchVendors()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus vendor',
        variant: 'destructive',
      })
    }
  }

  const filteredVendors = vendors.filter((v) =>
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.contact && v.contact.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="text-center py-8 text-muted-foreground">Memuat data vendor...</div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Manajemen Vendor</h1>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open)
              if (!open) setEditingVendor(null)
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingVendor ? 'Edit Vendor' : 'Tambah Vendor Baru'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Vendor *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Contoh: PT Fiber Optik Indonesia"
                      defaultValue={editingVendor?.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact">Kontak (Telepon/Email)</Label>
                    <Input
                      id="contact"
                      name="contact"
                      placeholder="Contoh: 0812-3456-7890"
                      defaultValue={editingVendor?.contact}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Textarea
                      id="address"
                      name="address"
                      rows={3}
                      placeholder="Alamat lengkap vendor"
                      defaultValue={editingVendor?.address}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? 'Menyimpan...' : (editingVendor ? 'Simpan Perubahan' : 'Tambah Vendor')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Vendor</CardTitle>
              <div className="flex items-center gap-2 mt-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan nama atau kontak..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Vendor</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Tidak ada data vendor
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>{vendor.contact || '-'}</TableCell>
                        <TableCell className="max-w-md truncate">{vendor.address || '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(vendor)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(vendor.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}