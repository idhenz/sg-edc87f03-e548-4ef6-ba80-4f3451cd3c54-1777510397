import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Eye, Edit, Trash2, Download } from 'lucide-react'

interface IncomingInvoice {
  id: number
  invoice_number: string
  vendor_name: string
  description: string
  amount: number
  invoice_date: string
  due_date: string
  payment_status: string
}

export default function IncomingInvoicesPage() {
  const [invoices, setInvoices] = useState<IncomingInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices/incoming')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.vendor_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
    }
    const labels: Record<string, string> = {
      paid: 'Lunas',
      pending: 'Menunggu',
      overdue: 'Terlambat',
    }
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Invoice Masuk</h1>
              <p className="text-muted-foreground">
                Kelola invoice pembelian dan pengeluaran
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Invoice
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nomor invoice atau vendor..."
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
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'Tidak ada data yang cocok dengan pencarian' : 'Belum ada invoice masuk'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Invoice</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Jatuh Tempo</TableHead>
                        <TableHead className="text-right">Jumlah</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>{invoice.vendor_name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{invoice.description}</TableCell>
                          <TableCell className="text-sm">{new Date(invoice.invoice_date).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell className="text-sm">{new Date(invoice.due_date).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(invoice.amount)}</TableCell>
                          <TableCell>{getStatusBadge(invoice.payment_status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" title="Lihat Detail">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Edit">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Unduh">
                                <Download className="w-4 h-4" />
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