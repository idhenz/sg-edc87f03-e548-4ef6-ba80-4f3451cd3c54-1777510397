import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileText } from 'lucide-react'

interface Invoice {
  id: number
  invoice_number: string
  customer_name: string
  package_name: string
  due_date: string
  amount: number
  status: string
  invoice_type?: string
  notes: string
  created_at: string
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token')
  return {
    'Authorization': `Bearer ${token}`
  }
}

export default function InvoicesOutgoingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching invoices outgoing...')
      
      const res = await fetch('/api/invoices/outgoing', {
        headers: getAuthHeaders()
      })
      
      console.log('Response status:', res.status)
      
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Gagal mengambil data invoice')
      }
      
      const data = await res.json()
      console.log('Invoices data:', data)
      setInvoices(data.invoices || [])
    } catch (error: any) {
      console.error('Failed to fetch invoices:', error)
      setError(error.message || 'Gagal mengambil data invoice keluar')
    } finally {
      setLoading(false)
    }
  }

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
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
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Invoice Keluar (Tagihan)</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Daftar Invoice Keluar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-destructive mb-2">{error}</p>
                  <button 
                    onClick={fetchInvoices}
                    className="text-sm text-primary hover:underline"
                  >
                    Coba lagi
                  </button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Invoice</TableHead>
                      <TableHead>Pelanggan</TableHead>
                      <TableHead>Paket</TableHead>
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
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>{invoice.package_name}</TableCell>
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
                            <Button variant="ghost" size="icon" title="Kirim">
                              <Send className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Unduh PDF">
                              <Download className="w-4 h-4" />
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
      </AppLayout>
    </ProtectedRoute>
  )
}