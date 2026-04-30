import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Pencil, Trash2, FileText, CheckCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Invoice {
  id: number
  invoice_number: string
  customer_name: string
  package_name: string
  due_date: string
  amount: number
  status: string
  invoice_type?: string
  created_at: string
}

interface Bank {
  id: number
  bank_name: string
  account_number: string
  account_holder: string
  branch?: string
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export default function InvoicesOutgoingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState<Partial<Invoice>>({})
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [proofFile, setProofFile] = useState<File | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchInvoices()
    fetchBanks()
  }, [selectedMonth, selectedYear])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      let url = '/api/invoices/outgoing'
      const params = new URLSearchParams()
      if (selectedMonth && selectedMonth !== 'all') params.append('month', selectedMonth)
      if (selectedYear) params.append('year', selectedYear)
      if (params.toString()) url += `?${params.toString()}`
      
      const res = await fetch(url, {
        headers: getAuthHeaders()
      })
      
      if (!res.ok) {
        throw new Error('Gagal mengambil data invoice')
      }
      
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengambil data invoice keluar',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/banks', {
        headers: getAuthHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setBanks(data.banks || [])
      }
    } catch (error) {
      console.error('Error fetching banks:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      invoice_number: formData.get('invoice_number'),
      customer_name: formData.get('customer_name'),
      package_name: formData.get('package_name'),
      due_date: formData.get('due_date'),
      amount: parseInt(formData.get('amount') as string),
      status: formData.get('status'),
      invoice_type: formData.get('invoice_type') || 'MRC'
    }

    try {
      const url = editMode ? `/api/invoices/outgoing?id=${currentInvoice.id}` : '/api/invoices/outgoing'
      const method = editMode ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Gagal menyimpan data')

      toast({
        title: 'Berhasil',
        description: editMode ? 'Invoice berhasil diperbarui' : 'Invoice baru berhasil ditambahkan',
      })

      setDialogOpen(false)
      setEditMode(false)
      setCurrentInvoice({})
      fetchInvoices()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan invoice',
        variant: 'destructive',
      })
    }
  }

  const handlePaymentConfirmation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedInvoice) return

    const formData = new FormData(e.currentTarget)
    formData.append('invoice_id', selectedInvoice.id.toString())
    
    if (proofFile) {
      formData.append('proof', proofFile)
    }

    try {
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      })

      if (!res.ok) throw new Error('Gagal konfirmasi pembayaran')

      toast({
        title: 'Berhasil',
        description: 'Pembayaran berhasil dikonfirmasi, status invoice diperbarui',
      })

      setPaymentDialogOpen(false)
      setSelectedInvoice(null)
      setProofFile(null)
      fetchInvoices()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal konfirmasi pembayaran',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (invoice: Invoice) => {
    setCurrentInvoice(invoice)
    setEditMode(true)
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus invoice ini?')) return

    try {
      const res = await fetch(`/api/invoices/outgoing?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      if (!res.ok) throw new Error('Gagal menghapus data')

      toast({
        title: 'Berhasil',
        description: 'Invoice berhasil dihapus',
      })
      fetchInvoices()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus invoice',
        variant: 'destructive',
      })
    }
  }

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setPaymentDialogOpen(true)
  }

  const filteredInvoices = invoices.filter((inv) =>
    inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.package_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate statistics
  const totalInvoices = filteredInvoices.length
  const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid')
  const pendingInvoices = filteredInvoices.filter(inv => inv.status === 'pending')
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0)
  const totalUnpaid = pendingInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default'
      case 'pending':
        return 'secondary'
      case 'overdue':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Lunas'
      case 'pending':
        return 'Belum Bayar'
      case 'overdue':
        return 'Terlambat'
      default:
        return status
    }
  }

  const getInvoiceTypeBadge = (type?: string) => {
    if (type === 'OTC') {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Registrasi</Badge>
    }
    return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Bulanan</Badge>
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
  const months = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ]

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Invoice Keluar (Tagihan)</h1>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setEditMode(false)
                setCurrentInvoice({})
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editMode ? 'Edit Invoice' : 'Tambah Invoice Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoice_number">Nomor Invoice</Label>
                    <Input
                      id="invoice_number"
                      name="invoice_number"
                      defaultValue={currentInvoice.invoice_number}
                      placeholder="INV-MRC-202604-0001"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer_name">Nama Pelanggan</Label>
                    <Input
                      id="customer_name"
                      name="customer_name"
                      defaultValue={currentInvoice.customer_name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="package_name">Nama Paket</Label>
                    <Input
                      id="package_name"
                      name="package_name"
                      defaultValue={currentInvoice.package_name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice_type">Tipe Invoice</Label>
                    <Select name="invoice_type" defaultValue={currentInvoice.invoice_type || 'MRC'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MRC">Bulanan (MRC)</SelectItem>
                        <SelectItem value="OTC">Registrasi (OTC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Jatuh Tempo</Label>
                    <Input
                      id="due_date"
                      name="due_date"
                      type="date"
                      defaultValue={currentInvoice.due_date}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Jumlah Tagihan (Rp)</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      defaultValue={currentInvoice.amount}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue={currentInvoice.status || 'pending'}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Belum Bayar</SelectItem>
                        <SelectItem value="paid">Lunas</SelectItem>
                        <SelectItem value="overdue">Terlambat</SelectItem>
                      </SelectContent>
                    </Select>
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

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoice Aktif</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInvoices}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Invoice dalam periode ini
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Terbayar</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  Rp {totalPaid.toLocaleString('id-ID')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {paidInvoices.length} invoice lunas
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Belum Bayar</CardTitle>
                <TrendingDown className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  Rp {totalUnpaid.toLocaleString('id-ID')}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingInvoices.length} invoice pending
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Daftar Invoice Keluar
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan nomor invoice, pelanggan, atau paket..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(year => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Semua Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Bulan</SelectItem>
                      {months.map(month => (
                        <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor Invoice</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Pelanggan</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Jatuh Tempo</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Tidak ada data invoice
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                          <TableCell>{getInvoiceTypeBadge(invoice.invoice_type)}</TableCell>
                          <TableCell className="font-medium">{invoice.customer_name}</TableCell>
                          <TableCell>{invoice.package_name}</TableCell>
                          <TableCell>
                            {new Date(invoice.due_date).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            Rp {invoice.amount.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadge(invoice.status) as any}>
                              {getStatusLabel(invoice.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {invoice.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openPaymentDialog(invoice)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(invoice)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(invoice.id)}
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

        {/* Payment Confirmation Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
          setPaymentDialogOpen(open)
          if (!open) {
            setSelectedInvoice(null)
            setProofFile(null)
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
            </DialogHeader>
            {selectedInvoice && (
              <form onSubmit={handlePaymentConfirmation} className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <p className="text-sm font-medium">Detail Invoice:</p>
                  <div className="text-sm space-y-1">
                    <p>No. Invoice: <span className="font-mono">{selectedInvoice.invoice_number}</span></p>
                    <p>Pelanggan: <span className="font-medium">{selectedInvoice.customer_name}</span></p>
                    <p>Jumlah: <span className="font-bold">Rp {selectedInvoice.amount.toLocaleString('id-ID')}</span></p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_id">Bank Tujuan Transfer</Label>
                  <Select name="bank_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map(bank => (
                        <SelectItem key={bank.id} value={bank.id.toString()}>
                          {bank.bank_name} - {bank.account_number} ({bank.account_holder})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Nominal Transfer (Rp)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    defaultValue={selectedInvoice.amount}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_date">Tanggal Transfer</Label>
                  <Input
                    id="payment_date"
                    name="payment_date"
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer_from">Transfer Dari (Nama Rekening)</Label>
                  <Input
                    id="transfer_from"
                    name="transfer_from"
                    placeholder="Nama pemilik rekening pengirim"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="proof">Bukti Transfer (Gambar/PDF)</Label>
                  <Input
                    id="proof"
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setProofFile(file)
                    }}
                  />
                  {proofFile && (
                    <p className="text-xs text-muted-foreground">
                      File: {proofFile.name} ({(proofFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan (Opsional)</Label>
                  <Input
                    id="notes"
                    name="notes"
                    placeholder="Catatan tambahan"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Konfirmasi Pembayaran
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  )
}