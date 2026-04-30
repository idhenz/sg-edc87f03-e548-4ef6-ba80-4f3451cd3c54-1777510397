import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Landmark, Search } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'

interface Bank {
  id: number
  bank_name: string
  account_number: string
  account_holder: string
  branch: string | null
  is_active: number
  created_at: string
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token')
  return {
    'Authorization': `Bearer ${token}`
  }
}

export default function BanksPage() {
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentBank, setCurrentBank] = useState<Partial<Bank>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchBanks()
  }, [])

  const fetchBanks = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/banks', {
        headers: getAuthHeaders()
      })
      
      if (!res.ok) throw new Error('Gagal mengambil data bank')
      
      const data = await res.json()
      setBanks(data.banks || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      bank_name: formData.get('bank_name'),
      account_number: formData.get('account_number'),
      account_holder: formData.get('account_holder'),
      branch: formData.get('branch') || null,
      is_active: formData.get('is_active') === 'on' ? 1 : 0
    }

    try {
      const url = editMode ? `/api/banks?id=${currentBank.id}` : '/api/banks'
      const method = editMode ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Gagal menyimpan data')

      toast({
        title: 'Berhasil',
        description: editMode ? 'Bank berhasil diperbarui' : 'Bank baru berhasil ditambahkan',
      })

      setDialogOpen(false)
      setEditMode(false)
      setCurrentBank({})
      fetchBanks()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan bank',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (bank: Bank) => {
    setCurrentBank(bank)
    setEditMode(true)
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus bank ini?')) return

    try {
      const res = await fetch(`/api/banks?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      if (!res.ok) throw new Error('Gagal menghapus data')

      toast({
        title: 'Berhasil',
        description: 'Bank berhasil dihapus',
      })
      fetchBanks()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus bank',
        variant: 'destructive',
      })
    }
  }

  const filteredBanks = banks.filter((bank) =>
    bank.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.account_number.includes(searchTerm) ||
    bank.account_holder.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Bank Management</h1>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setEditMode(false)
                setCurrentBank({})
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Bank
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editMode ? 'Edit Bank' : 'Tambah Bank Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Nama Bank</Label>
                    <Input
                      id="bank_name"
                      name="bank_name"
                      defaultValue={currentBank.bank_name}
                      placeholder="BCA, Mandiri, BNI, dll"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_number">Nomor Rekening</Label>
                    <Input
                      id="account_number"
                      name="account_number"
                      defaultValue={currentBank.account_number}
                      placeholder="1234567890"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_holder">Nama Pemilik Rekening</Label>
                    <Input
                      id="account_holder"
                      name="account_holder"
                      defaultValue={currentBank.account_holder}
                      placeholder="PT ISP Indonesia"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Cabang (Opsional)</Label>
                    <Input
                      id="branch"
                      name="branch"
                      defaultValue={currentBank.branch || ''}
                      placeholder="KCP Jakarta Pusat"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      name="is_active"
                      defaultChecked={currentBank.is_active === 1}
                    />
                    <Label htmlFor="is_active" className="cursor-pointer">
                      Bank Aktif (ditampilkan di form pembayaran)
                    </Label>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit">
                      {editMode ? 'Perbarui' : 'Simpan'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Daftar Rekening Bank
              </CardTitle>
              <div className="flex items-center gap-2 mt-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari bank, nomor rekening, atau pemilik..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Bank</TableHead>
                      <TableHead>Nomor Rekening</TableHead>
                      <TableHead>Pemilik Rekening</TableHead>
                      <TableHead>Cabang</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBanks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Tidak ada data bank
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBanks.map((bank) => (
                        <TableRow key={bank.id}>
                          <TableCell className="font-semibold">{bank.bank_name}</TableCell>
                          <TableCell className="font-mono">{bank.account_number}</TableCell>
                          <TableCell>{bank.account_holder}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {bank.branch || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={bank.is_active === 1 ? 'default' : 'secondary'}>
                              {bank.is_active === 1 ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(bank)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(bank.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}