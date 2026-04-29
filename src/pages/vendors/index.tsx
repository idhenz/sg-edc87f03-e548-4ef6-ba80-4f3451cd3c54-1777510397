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
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Building2, Plus, Pencil, Trash2, Search, FileText, Upload, History, Download } from 'lucide-react'

interface Vendor {
  id: number
  name: string
  contact: string
  address: string
}

interface VendorMOU {
  id: number
  vendor_id: number
  mou_number: string
  mou_date: string
  start_date: string
  end_date: string
  mou_file: string | null
  created_at: string
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  
  // MOU History
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [mouHistory, setMouHistory] = useState<VendorMOU[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Add MOU
  const [isAddMouOpen, setIsAddMouOpen] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [mouFileUrl, setMouFileUrl] = useState<string | null>(null)
  
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

  const fetchMouHistory = async (vendorId: number) => {
    try {
      setLoadingHistory(true)
      const res = await fetch(`/api/vendors/mous?vendor_id=${vendorId}`)
      const data = await res.json()
      setMouHistory(data.mous || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat riwayat MOU',
        variant: 'destructive',
      })
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleViewHistory = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setIsHistoryOpen(true)
    fetchMouHistory(vendor.id)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploadingFile(true)
      const res = await fetch('/api/vendors/mous/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload gagal')

      const data = await res.json()
      setMouFileUrl(data.fileUrl)

      toast({
        title: 'Berhasil',
        description: 'File MOU berhasil diupload',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengupload file MOU',
        variant: 'destructive',
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleSubmitMou = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const data = {
      vendor_id: selectedVendor?.id,
      mou_number: formData.get('mou_number'),
      mou_date: formData.get('mou_date'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      mou_file: mouFileUrl,
    }

    try {
      setSaving(true)
      const res = await fetch('/api/vendors/mous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Gagal menyimpan data')

      toast({
        title: 'Berhasil',
        description: 'MOU berhasil ditambahkan',
      })

      setIsAddMouOpen(false)
      setMouFileUrl(null)
      if (selectedVendor) {
        fetchMouHistory(selectedVendor.id)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan data MOU',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMou = async (mouId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus MOU ini?')) return

    try {
      const res = await fetch(`/api/vendors/mous?id=${mouId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus data')

      toast({
        title: 'Berhasil',
        description: 'MOU berhasil dihapus',
      })
      
      if (selectedVendor) {
        fetchMouHistory(selectedVendor.id)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus MOU',
        variant: 'destructive',
      })
    }
  }

  const getMouStatus = (endDate: string) => {
    const today = new Date()
    const end = new Date(endDate)
    return end >= today ? 'active' : 'expired'
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
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewHistory(vendor)}
                              title="Lihat Riwayat Kontrak"
                            >
                              <History className="h-4 w-4" />
                            </Button>
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

          {/* MOU History Dialog */}
          <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Riwayat Kontrak/MOU - {selectedVendor?.name}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <Button onClick={() => setIsAddMouOpen(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kontrak Baru
                </Button>

                {loadingHistory ? (
                  <div className="text-center py-8 text-muted-foreground">Memuat riwayat...</div>
                ) : mouHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada riwayat kontrak
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. MOU</TableHead>
                        <TableHead>Tanggal MOU</TableHead>
                        <TableHead>Masa Berlaku</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>File</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mouHistory.map((mou) => {
                        const status = getMouStatus(mou.end_date)
                        return (
                          <TableRow key={mou.id}>
                            <TableCell className="font-medium">{mou.mou_number}</TableCell>
                            <TableCell>{new Date(mou.mou_date).toLocaleDateString('id-ID')}</TableCell>
                            <TableCell>
                              {new Date(mou.start_date).toLocaleDateString('id-ID')} - {new Date(mou.end_date).toLocaleDateString('id-ID')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                                {status === 'active' ? 'Aktif' : 'Expired'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {mou.mou_file ? (
                                <a 
                                  href={mou.mou_file} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Download className="h-4 w-4" />
                                  Lihat File
                                </a>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteMou(mou.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Add MOU Dialog */}
          <Dialog open={isAddMouOpen} onOpenChange={setIsAddMouOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Kontrak/MOU Baru</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmitMou} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mou_number">Nomor MOU *</Label>
                  <Input
                    id="mou_number"
                    name="mou_number"
                    placeholder="Contoh: MOU/001/2024"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mou_date">Tanggal MOU *</Label>
                  <Input
                    id="mou_date"
                    name="mou_date"
                    type="date"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Tanggal Mulai *</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Tanggal Berakhir *</Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mou_file">Upload File MOU (PDF/JPG/PNG)</Label>
                  <Input
                    id="mou_file"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                  {uploadingFile && (
                    <p className="text-sm text-muted-foreground">Mengupload file...</p>
                  )}
                  {mouFileUrl && (
                    <p className="text-sm text-green-600">✓ File berhasil diupload</p>
                  )}
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAddMouOpen(false)
                    setMouFileUrl(null)
                  }}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={saving || uploadingFile}>
                    {saving ? 'Menyimpan...' : 'Simpan MOU'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}