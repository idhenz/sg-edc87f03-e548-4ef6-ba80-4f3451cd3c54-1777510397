import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'

interface Reseller {
  id: number
  name: string
  email: string
  phone: string
  company_name: string
  total_customers: number
  status: string
}

export default function ResellersPage() {
  const [resellers, setResellers] = useState<Reseller[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchResellers()
  }, [])

  const fetchResellers = async () => {
    try {
      const res = await fetch('/api/resellers')
      if (res.ok) {
        const data = await res.json()
        setResellers(data.resellers || [])
      }
    } catch (error) {
      console.error('Failed to fetch resellers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredResellers = resellers.filter(reseller =>
    reseller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reseller.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reseller.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Data Reseller</h1>
              <p className="text-muted-foreground">
                Kelola mitra reseller ISP
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Reseller
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama, email, atau perusahaan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Memuat data...
                </div>
              ) : filteredResellers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'Tidak ada data yang cocok dengan pencarian' : 'Belum ada data reseller'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Perusahaan</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telepon</TableHead>
                        <TableHead className="text-center">Pelanggan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredResellers.map((reseller) => (
                        <TableRow key={reseller.id}>
                          <TableCell className="font-medium">{reseller.name}</TableCell>
                          <TableCell>{reseller.company_name}</TableCell>
                          <TableCell>{reseller.email}</TableCell>
                          <TableCell className="font-mono text-sm">{reseller.phone}</TableCell>
                          <TableCell className="text-center font-mono">{reseller.total_customers}</TableCell>
                          <TableCell>
                            <Badge variant={reseller.status === 'active' ? 'default' : 'secondary'}>
                              {reseller.status === 'active' ? 'Aktif' : 'Non-aktif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
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