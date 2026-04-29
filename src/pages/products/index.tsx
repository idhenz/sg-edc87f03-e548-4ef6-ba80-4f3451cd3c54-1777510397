import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface Product {
  id: number
  name: string
  speed: string
  price: number
  description: string
}

// Helper functions untuk format ribuan
const formatRupiah = (value: string | number): string => {
  const numStr = value.toString().replace(/\D/g, '')
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const unformatRupiah = (value: string): number => {
  return parseInt(value.replace(/\./g, '') || '0')
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({})
  const [formattedPrice, setFormattedPrice] = useState('')
  const { toast } = useToast()

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data produk',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      speed: formData.get('speed'),
      price: unformatRupiah(formattedPrice),
      description: formData.get('description'),
    }

    try {
      const url = editMode ? `/api/products?id=${currentProduct.id}` : '/api/products'
      const method = editMode ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Gagal menyimpan data')

      toast({
        title: 'Berhasil',
        description: editMode ? 'Paket layanan berhasil diperbarui' : 'Paket layanan baru berhasil ditambahkan',
      })

      setDialogOpen(false)
      setEditMode(false)
      setCurrentProduct({})
      fetchProducts()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan data paket layanan',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (product: Product) => {
    setCurrentProduct(product)
    setEditMode(true)
    setDialogOpen(true)
    setFormattedPrice(formatRupiah(product.price))
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setCurrentProduct({})
    setEditMode(false)
    setFormattedPrice('')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus paket layanan ini?')) return

    try {
      const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus data')

      toast({
        title: 'Berhasil',
        description: 'Paket layanan berhasil dihapus',
      })
      fetchProducts()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus paket layanan',
        variant: 'destructive',
      })
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.speed.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="text-center py-8 text-muted-foreground">Memuat data produk...</div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Data Produk Layanan</h1>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setEditMode(false)
                setCurrentProduct({})
                setFormattedPrice('')
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Paket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editMode ? 'Edit Paket Layanan' : 'Tambah Paket Layanan Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Paket</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Misal: Paket Home 10 Mbps"
                        defaultValue={currentProduct.name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="speed">Kecepatan</Label>
                      <Input
                        id="speed"
                        name="speed"
                        placeholder="Misal: 10 Mbps"
                        defaultValue={currentProduct.speed}
                        required
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="price">Harga (Rp)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="text"
                        placeholder="Misal: 250000"
                        value={formattedPrice}
                        onChange={(e) => {
                          const formatted = formatRupiah(e.target.value)
                          setFormattedPrice(formatted)
                        }}
                        defaultValue={currentProduct.price ? formatRupiah(currentProduct.price) : ''}
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Ketik angka, akan otomatis terformat: 100000 → 100.000
                      </p>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Detail paket layanan..."
                        rows={4}
                        defaultValue={currentProduct.description}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>
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
              <CardTitle>Daftar Paket Layanan</CardTitle>
              <div className="flex items-center gap-2 mt-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan nama atau kecepatan..."
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
                      <TableHead>Nama Paket</TableHead>
                      <TableHead>Kecepatan</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Tidak ada data paket layanan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.speed}</TableCell>
                          <TableCell className="font-mono">
                            Rp {new Intl.NumberFormat('id-ID').format(product.price)}
                          </TableCell>
                          <TableCell className="max-w-md truncate">{product.description || '-'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(product)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(product.id)}
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