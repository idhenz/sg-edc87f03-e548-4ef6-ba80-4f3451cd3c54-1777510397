import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import AppLayout from '@/components/AppLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Printer, DollarSign, Calendar, User, Package, FileText, CheckCircle, Clock, XCircle, Eye } from 'lucide-react'

interface Invoice {
  id: number
  customer_id: number
  customer_name: string
  product_id: number
  product_name: string
  amount: string
  tax_amount: string
  total_amount: string
  paid_amount: string
  invoice_date: string
  due_date: string
  notes: string
  status: string
}

interface PaymentData {
  bank_id: string
  amount: string
  payment_date: string
  transfer_from: string
  notes: string
}

export default function InvoiceOutgoingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, getAuthHeader } = useAuth()
  
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [banks, setBanks] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filterMonth, setFilterMonth] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  
  const [formData, setFormData] = useState({
    customer_id: '',
    amount: '',
    invoice_date: '',
    due_date: '',
    notes: '',
    status: 'pending'
  })
  
  const [paymentData, setPaymentData] = useState({
    bank_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    transfer_from: '',
    notes: ''
  })

  useEffect(() => {
    if (user) {
      fetchInvoices()
      fetchCustomers()
      fetchProducts()
      fetchBanks()
    }
  }, [user, selectedMonth, selectedYear])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterMonth) params.append('month', filterMonth)
      if (filterYear) params.append('year', filterYear)
      
      const res = await fetch(`/api/invoices/outgoing?${params.toString()}`, {
        headers: getAuthHeader()
      })
      
      if (!res.ok) {
        throw new Error('Failed to fetch invoices')
      }
      
      const data = await res.json()
      setInvoices(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Fetch invoices error:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat data invoice',
        variant: 'destructive',
      })
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers', { headers: getAuthHeader() })
      const data = await res.json()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', { headers: getAuthHeader() })
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/banks', { headers: getAuthHeader() })
      const data = await res.json()
      setBanks(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch banks:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const method = selectedInvoice ? 'PUT' : 'POST'
      const body = selectedInvoice ? { ...formData, id: selectedInvoice.id } : formData

      const res = await fetch('/api/invoices/outgoing', {
        method,
        headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (res.ok) {
        toast({
          title: 'Berhasil',
          description: selectedInvoice ? 'Invoice berhasil diperbarui' : 'Invoice berhasil ditambahkan'
        })
        setShowDialog(false)
        resetForm()
        fetchInvoices()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.message || 'Terjadi kesalahan', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Terjadi kesalahan', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedInvoice) return

    setLoading(true)
    try {
      const res = await fetch(`/api/invoices/outgoing?id=${selectedInvoice.id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      })

      if (res.ok) {
        toast({ title: 'Berhasil', description: 'Invoice berhasil dihapus' })
        setShowDeleteAlert(false)
        fetchInvoices()
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menghapus invoice', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedInvoice) return

    const remaining = parseFloat(selectedInvoice.total_amount || selectedInvoice.amount) - parseFloat(selectedInvoice.paid_amount || '0')
    const inputAmount = parseFloat(paymentData.amount)
    
    if (inputAmount > remaining) {
      toast({ 
        title: 'Error', 
        description: `Nominal melebihi sisa tagihan (Rp ${remaining.toLocaleString('id-ID')})`, 
        variant: 'destructive' 
      })
      return
    }

    setLoading(true)
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('invoice_id', selectedInvoice.id.toString())
      formDataToSend.append('bank_id', paymentData.bank_id)
      formDataToSend.append('amount', paymentData.amount)
      formDataToSend.append('payment_date', paymentData.payment_date)
      if (paymentData.transfer_from) formDataToSend.append('transfer_from', paymentData.transfer_from)
      if (paymentData.notes) formDataToSend.append('notes', paymentData.notes)
      if (proofFile) formDataToSend.append('proof', proofFile)
      
      // Add auth session to FormData
      if (user) {
        formDataToSend.append('user_session', JSON.stringify(user))
      }

      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        body: formDataToSend
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'Sukses', description: 'Pembayaran berhasil dikonfirmasi' })
        setShowPaymentDialog(false)
        setSelectedInvoice(null)
        setPaymentData({
          bank_id: '',
          amount: '',
          payment_date: new Date().toISOString().split('T')[0],
          transfer_from: '',
          notes: ''
        })
        setProofFile(null)
        fetchInvoices()
      } else {
        toast({ title: 'Error', description: data.message || 'Gagal menyimpan pembayaran', variant: 'destructive' })
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast({ title: 'Error', description: 'Terjadi kesalahan pada server', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    const remaining = parseFloat(invoice.total_amount || invoice.amount) - parseFloat(invoice.paid_amount || '0')
    setPaymentAmount(remaining.toString())
    setPaymentData({
      bank_id: '',
      amount: remaining.toString(),
      payment_date: new Date().toISOString().split('T')[0],
      transfer_from: '',
      notes: ''
    })
    setProofFile(null)
    setShowPaymentDialog(true)
  }

  const openEditDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setFormData({
      customer_id: invoice.customer_id.toString(),
      product_id: invoice.product_id.toString(),
      amount: invoice.amount,
      invoice_date: invoice.invoice_date,
      due_date: invoice.due_date,
      notes: invoice.notes || '',
      status: invoice.status
    })
    setShowDialog(true)
  }

  const resetForm = () => {
    setSelectedInvoice(null)
    setFormData({
      customer_id: '',
      product_id: '',
      amount: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: '',
      notes: '',
      status: 'pending'
    })
  }

  const handlePrint = (invoice: Invoice) => {
    router.push(`/invoices/print/${invoice.id}`)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      partial: "secondary",
      paid: "default",
      overdue: "destructive"
    }
    
    const labels: Record<string, string> = {
      pending: "Belum Bayar",
      partial: "Bayar Sebagian",
      paid: "Lunas",
      overdue: "Jatuh Tempo"
    }

    return <Badge variant={variants[status] || "outline"}>{labels[status] || status}</Badge>
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Invoice Keluar</h1>
              <p className="text-muted-foreground">Kelola invoice untuk pelanggan</p>
            </div>
            <Button onClick={() => { resetForm(); setShowDialog(true) }}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Invoice
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex gap-4 items-center">
                <div>
                  <Label>Bulan</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <SelectItem key={m} value={m.toString()}>
                          {new Date(2000, m - 1).toLocaleDateString('id-ID', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tahun</Label>
                  <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Invoice</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>PPN</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Dibayar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center">Memuat data...</TableCell>
                    </TableRow>
                  ) : invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center">Tidak ada data</TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((invoice, idx) => (
                      <TableRow key={invoice.id}>
                        <TableCell>INV-{String(invoice.id).padStart(5, '0')}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>{invoice.product_name}</TableCell>
                        <TableCell>{new Date(invoice.invoice_date).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>{new Date(invoice.due_date).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>Rp {parseFloat(invoice.amount).toLocaleString('id-ID')}</TableCell>
                        <TableCell>Rp {parseFloat(invoice.tax_amount || '0').toLocaleString('id-ID')}</TableCell>
                        <TableCell>Rp {parseFloat(invoice.total_amount || invoice.amount).toLocaleString('id-ID')}</TableCell>
                        <TableCell>Rp {parseFloat(invoice.paid_amount || '0').toLocaleString('id-ID')}</TableCell>
                        <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handlePrint(invoice)}>
                              <Printer className="h-4 w-4" />
                            </Button>
                            {invoice.status !== 'paid' && (
                              <Button size="sm" variant="outline" onClick={() => openPaymentDialog(invoice)}>
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(invoice)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => { setSelectedInvoice(invoice); setShowDeleteAlert(true) }}>
                              <Trash2 className="h-4 w-4" />
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

          {/* Dialog Create/Edit Invoice */}
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedInvoice ? 'Edit Invoice' : 'Tambah Invoice'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customer_id">Pelanggan *</Label>
                    <Select value={formData.customer_id} onValueChange={(v) => setFormData({ ...formData, customer_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pelanggan" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="product_id">Layanan *</Label>
                    <Select value={formData.product_id} onValueChange={(v) => setFormData({ ...formData, product_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih layanan" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>{p.name} - Rp {parseFloat(p.price).toLocaleString('id-ID')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Nominal (Rp) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Belum Bayar</SelectItem>
                        <SelectItem value="partial">Bayar Sebagian</SelectItem>
                        <SelectItem value="paid">Lunas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoice_date">Tanggal Invoice *</Label>
                    <Input
                      id="invoice_date"
                      type="date"
                      value={formData.invoice_date}
                      onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="due_date">Jatuh Tempo *</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={formData.due_date}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Catatan</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Catatan tambahan"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog Payment Confirmation */}
          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
                <DialogDescription>
                  Invoice: INV-{selectedInvoice && String(selectedInvoice.id).padStart(5, '0')}
                </DialogDescription>
              </DialogHeader>
              {selectedInvoice && (
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <Label>Sisa Tagihan</Label>
                    <p className="text-2xl font-bold">
                      Rp {(parseFloat(selectedInvoice.total_amount || selectedInvoice.amount) - parseFloat(selectedInvoice.paid_amount || '0')).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="bank_id">Bank Tujuan *</Label>
                    <Select value={paymentData.bank_id} onValueChange={(v) => setPaymentData({ ...paymentData, bank_id: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {banks.map(b => (
                          <SelectItem key={b.id} value={b.id.toString()}>
                            {b.bank_name} - {b.account_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="payment_amount">Nominal Transfer (Rp) *</Label>
                    <Input
                      id="payment_amount"
                      name="payment_amount"
                      type="number"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                      max={parseFloat(selectedInvoice.total_amount || selectedInvoice.amount) - parseFloat(selectedInvoice.paid_amount || '0')}
                      step="0.01"
                      required
                      placeholder={`Sisa tagihan: Rp ${(parseFloat(selectedInvoice.total_amount || selectedInvoice.amount) - parseFloat(selectedInvoice.paid_amount || '0')).toLocaleString('id-ID')}`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maksimal: Rp {(parseFloat(selectedInvoice.total_amount || selectedInvoice.amount) - parseFloat(selectedInvoice.paid_amount || '0')).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="payment_date">Tanggal Transfer *</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={paymentData.payment_date}
                      onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="transfer_from">Transfer Dari</Label>
                    <Input
                      id="transfer_from"
                      value={paymentData.transfer_from}
                      onChange={(e) => setPaymentData({ ...paymentData, transfer_from: e.target.value })}
                      placeholder="Nama rekening pengirim"
                    />
                  </div>

                  <div>
                    <Label htmlFor="proof">Bukti Transfer *</Label>
                    <Input
                      id="proof"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="payment_notes">Catatan</Label>
                    <Input
                      id="payment_notes"
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                      placeholder="Catatan tambahan"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Menyimpan...' : 'Konfirmasi Pembayaran'}
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation */}
          <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Invoice?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tindakan ini tidak dapat dibatalkan. Invoice akan dihapus permanen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}