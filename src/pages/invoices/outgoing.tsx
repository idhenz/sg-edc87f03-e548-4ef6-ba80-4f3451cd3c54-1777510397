import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Pencil, Trash2, CheckCircle, TrendingUp, TrendingDown, Activity, ExternalLink, Printer, Download, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Invoice {
  id: number
  invoice_number: string
  customer_name: string
  package_name: string
  due_date: string
  amount: string
  paid_amount?: string
  status: string
  invoice_type: string
  created_at?: string
}

interface PaymentHistory {
  id: number
  amount: string
  payment_date: string
  transfer_from: string
  proof_url: string
  notes: string
  bank_name: string
  bank_account_number: string
  confirmed_by_name: string
  created_at: string
}

interface Bank {
  id: number
  bank_name: string
  account_number: string
  account_holder: string
}

interface Settings {
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  logo_url: string
}

export default function InvoicesOutgoingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  
  // Payment confirmation states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  
  // Payment history states
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [selectedHistoryInvoice, setSelectedHistoryInvoice] = useState<Invoice | null>(null)
  
  // PDF Preview states
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfBlob, setPdfBlob] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [selectedPdfInvoice, setSelectedPdfInvoice] = useState<Invoice | null>(null)
  
  const [formData, setFormData] = useState({
    invoice_number: '',
    customer_name: '',
    package_name: '',
    due_date: '',
    amount: '',
    status: 'pending',
    invoice_type: 'MRC',
    created_at: new Date().toISOString().split('T')[0]
  })
  const [paymentData, setPaymentData] = useState({
    bank_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    transfer_from: '',
    notes: ''
  })
  const [proofFile, setProofFile] = useState<File | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    fetchInvoices()
    fetchBanks()
    fetchSettings()
  }, [])

  useEffect(() => {
    const filtered = invoices.filter(inv =>
      inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.package_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredInvoices(filtered)
  }, [searchTerm, invoices])

  const fetchInvoices = async () => {
    try {
      let url = '/api/invoices/outgoing'
      const params = new URLSearchParams()
      
      if (selectedMonth && selectedMonth !== 'all') params.append('month', selectedMonth)
      if (selectedYear && selectedYear !== 'all') params.append('year', selectedYear)
      
      if (params.toString()) url += `?${params.toString()}`
      
      const res = await fetch(url)
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch {
      toast({ title: 'Error', description: 'Gagal memuat data invoice', variant: 'destructive' })
    }
  }

  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/banks')
      const data = await res.json()
      setBanks(data.filter((b: Bank) => b.is_active))
    } catch (error) {
      console.error('Error fetching banks:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchPaymentHistory = async (invoiceId: number) => {
    try {
      const res = await fetch(`/api/payments/history?invoice_id=${invoiceId}`)
      const data = await res.json()
      setPaymentHistory(data.payments || [])
    } catch {
      toast({ title: 'Error', description: 'Gagal memuat riwayat pembayaran', variant: 'destructive' })
    }
  }

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    const remaining = parseFloat(invoice.amount) - parseFloat(invoice.paid_amount || '0')
    setPaymentAmount(remaining.toString())
    setPaymentData({
      bank_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      transfer_from: '',
      notes: ''
    })
    setProofFile(null)
    setShowPaymentDialog(true)
  }

  const openHistoryDialog = async (invoice: Invoice) => {
    setSelectedHistoryInvoice(invoice)
    setShowHistoryDialog(true)
    await fetchPaymentHistory(invoice.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingId 
        ? `/api/invoices/outgoing?id=${editingId}` 
        : '/api/invoices/outgoing'
      
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'Sukses', description: data.message })
        setShowForm(false)
        setEditingId(null)
        setFormData({
          invoice_number: '',
          customer_name: '',
          package_name: '',
          due_date: '',
          amount: '',
          status: 'pending',
          invoice_type: 'MRC',
          created_at: new Date().toISOString().split('T')[0]
        })
        fetchInvoices()
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Terjadi kesalahan pada server', variant: 'destructive' })
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedInvoice) return

    const remaining = parseFloat(selectedInvoice.amount) - parseFloat(selectedInvoice.paid_amount || '0')
    const inputAmount = parseFloat(paymentData.amount)
    
    if (inputAmount > remaining) {
      toast({ 
        title: 'Error', 
        description: `Nominal melebihi sisa tagihan (Rp ${remaining.toLocaleString('id-ID')})`, 
        variant: 'destructive' 
      })
      return
    }

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('invoice_id', selectedInvoice.id.toString())
      formDataToSend.append('bank_id', paymentData.bank_id)
      formDataToSend.append('amount', paymentData.amount)
      formDataToSend.append('payment_date', paymentData.payment_date)
      if (paymentData.transfer_from) formDataToSend.append('transfer_from', paymentData.transfer_from)
      if (paymentData.notes) formDataToSend.append('notes', paymentData.notes)
      if (proofFile) formDataToSend.append('proof', proofFile)

      const res = await fetch('/api/payments/confirm', {
        method: 'POST',
        body: formDataToSend
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'Sukses', description: 'Pembayaran berhasil dikonfirmasi' })
        setShowPaymentDialog(false)
        setSelectedInvoice(null)
        fetchInvoices()
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Terjadi kesalahan pada server', variant: 'destructive' })
    }
  }

  const handleEdit = (invoice: Invoice) => {
    setEditingId(invoice.id)
    setFormData({
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer_name,
      package_name: invoice.package_name,
      due_date: invoice.due_date,
      amount: invoice.amount,
      status: invoice.status,
      invoice_type: invoice.invoice_type,
      created_at: invoice.created_at || new Date().toISOString().split('T')[0]
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus invoice ini?')) return

    try {
      const res = await fetch(`/api/invoices/outgoing?id=${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (res.ok) {
        toast({ title: 'Sukses', description: data.message })
        fetchInvoices()
      } else {
        toast({ title: 'Error', description: data.message, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Terjadi kesalahan pada server', variant: 'destructive' })
    }
  }

  const generatePDF = async (invoice: Invoice) => {
    setIsGeneratingPdf(true)
    setSelectedPdfInvoice(invoice)
    
    try {
      // Dynamic import to avoid SSR issues
      const html2pdf = (await import('html2pdf.js')).default
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              padding: 40px; 
              background: #f8f9fa;
              position: relative;
            }
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              font-weight: bold;
              opacity: 0.08;
              color: ${invoice.status === 'paid' ? '#10b981' : '#ef4444'};
              z-index: 0;
              white-space: nowrap;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: white; 
              padding: 50px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.08);
              border-radius: 8px;
              position: relative;
              z-index: 1;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start;
              padding-bottom: 30px;
              border-bottom: 3px solid #1e40af;
              margin-bottom: 40px;
            }
            .company-info {
              flex: 1;
            }
            .company-logo {
              max-width: 180px;
              max-height: 80px;
              margin-bottom: 15px;
            }
            .company-name {
              font-size: 24px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 8px;
            }
            .company-details {
              font-size: 12px;
              color: #64748b;
              line-height: 1.6;
            }
            .invoice-header {
              text-align: right;
            }
            .invoice-title {
              font-size: 36px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 10px;
            }
            .invoice-meta {
              font-size: 13px;
              color: #475569;
              line-height: 1.8;
            }
            .invoice-meta strong {
              color: #1e293b;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 16px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              margin-top: 8px;
              background: ${invoice.status === 'paid' ? '#dcfce7' : invoice.status === 'partial' ? '#fef3c7' : '#fee2e2'};
              color: ${invoice.status === 'paid' ? '#166534' : invoice.status === 'partial' ? '#92400e' : '#991b1b'};
            }
            .billing-section {
              margin: 30px 0;
              padding: 20px;
              background: #f8fafc;
              border-radius: 6px;
            }
            .billing-title {
              font-size: 12px;
              font-weight: bold;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 8px;
            }
            .billing-name {
              font-size: 18px;
              font-weight: bold;
              color: #1e293b;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 30px 0;
            }
            .items-table thead {
              background: #1e40af;
              color: white;
            }
            .items-table th {
              padding: 14px;
              text-align: left;
              font-size: 13px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .items-table th:last-child {
              text-align: right;
            }
            .items-table td {
              padding: 16px 14px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 14px;
              color: #475569;
            }
            .items-table td:last-child {
              text-align: right;
              font-weight: 600;
              color: #1e293b;
            }
            .items-table tbody tr:last-child td {
              border-bottom: none;
            }
            .totals-section {
              margin-top: 30px;
              text-align: right;
            }
            .total-row {
              display: flex;
              justify-content: flex-end;
              padding: 12px 0;
              font-size: 14px;
            }
            .total-label {
              min-width: 150px;
              color: #64748b;
              padding-right: 30px;
            }
            .total-amount {
              min-width: 150px;
              font-weight: 600;
              color: #1e293b;
            }
            .grand-total {
              border-top: 2px solid #1e40af;
              padding-top: 16px;
              margin-top: 8px;
            }
            .grand-total .total-label {
              font-size: 16px;
              font-weight: bold;
              color: #1e293b;
            }
            .grand-total .total-amount {
              font-size: 20px;
              font-weight: bold;
              color: #1e40af;
            }
            .payment-info {
              margin-top: 40px;
              padding: 25px;
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              border-radius: 8px;
              color: white;
            }
            .payment-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 16px;
            }
            .bank-details {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 12px;
              margin-bottom: 20px;
            }
            .bank-item {
              background: rgba(255,255,255,0.15);
              padding: 12px;
              border-radius: 6px;
            }
            .bank-label {
              font-size: 11px;
              opacity: 0.9;
              margin-bottom: 4px;
            }
            .bank-value {
              font-size: 14px;
              font-weight: 600;
            }
            .confirmation-info {
              border-top: 1px solid rgba(255,255,255,0.3);
              padding-top: 20px;
              margin-top: 20px;
              font-size: 13px;
              line-height: 1.6;
            }
            .confirmation-info strong {
              display: block;
              margin-bottom: 8px;
              font-size: 14px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 25px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
            }
            .footer-note {
              margin-top: 12px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="watermark">${invoice.status === 'paid' ? 'LUNAS' : invoice.status === 'partial' ? 'LUNAS SEBAGIAN' : 'BELUM LUNAS'}</div>
          
          <div class="container">
            <!-- Header -->
            <div class="header">
              <div class="company-info">
                ${settings?.logo_url ? `<img src="${settings.logo_url}" alt="Company Logo" class="company-logo">` : ''}
                <div class="company-name">${settings?.company_name || 'PT. Internet Service Provider'}</div>
                <div class="company-details">
                  ${settings?.company_address || 'Alamat Perusahaan'}<br>
                  Telp: ${settings?.company_phone || '-'}<br>
                  Email: ${settings?.company_email || '-'}
                </div>
              </div>
              <div class="invoice-header">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-meta">
                  <strong>No. Invoice:</strong> ${invoice.invoice_number}<br>
                  <strong>Tanggal:</strong> ${invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}<br>
                  <strong>Jatuh Tempo:</strong> ${new Date(invoice.due_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}<br>
                  <strong>Jenis:</strong> ${invoice.invoice_type}
                </div>
                <div class="status-badge">${invoice.status === 'paid' ? 'Lunas' : invoice.status === 'partial' ? 'Lunas Sebagian' : 'Belum Lunas'}</div>
              </div>
            </div>

            <!-- Bill To -->
            <div class="billing-section">
              <div class="billing-title">Tagihan Kepada</div>
              <div class="billing-name">${invoice.customer_name}</div>
            </div>

            <!-- Items Table -->
            <table class="items-table">
              <thead>
                <tr>
                  <th>Deskripsi Layanan</th>
                  <th>Periode</th>
                  <th>Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${invoice.package_name}</td>
                  <td>${invoice.invoice_type}</td>
                  <td>${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(invoice.amount))}</td>
                </tr>
              </tbody>
            </table>

            <!-- Totals -->
            <div class="totals-section">
              <div class="total-row">
                <div class="total-label">Subtotal</div>
                <div class="total-amount">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(invoice.amount))}</div>
              </div>
              ${invoice.paid_amount && Number(invoice.paid_amount) > 0 ? `
              <div class="total-row">
                <div class="total-label">Terbayar</div>
                <div class="total-amount" style="color: #10b981;">-${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(invoice.paid_amount))}</div>
              </div>
              ` : ''}
              <div class="total-row grand-total">
                <div class="total-label">${invoice.status === 'paid' ? 'Total Terbayar' : 'Total Tagihan'}</div>
                <div class="total-amount">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(invoice.status === 'paid' ? Number(invoice.amount) : Number(invoice.amount) - Number(invoice.paid_amount || 0))}</div>
              </div>
            </div>

            ${invoice.status !== 'paid' ? `
            <!-- Payment Info -->
            <div class="payment-info">
              <div class="payment-title">🏦 Informasi Pembayaran</div>
              <div class="bank-details">
                ${banks.slice(0, 4).map(bank => `
                  <div class="bank-item">
                    <div class="bank-label">${bank.bank_name}</div>
                    <div class="bank-value">${bank.account_number}</div>
                    <div class="bank-label" style="margin-top: 4px;">a/n ${bank.account_holder}</div>
                  </div>
                `).join('')}
              </div>
              <div class="confirmation-info">
                <strong>📱 Konfirmasi Pembayaran:</strong>
                Silakan konfirmasi pembayaran melalui:<br>
                <strong>WhatsApp:</strong> ${settings?.confirmation_contact || '-'}<br>
                <strong>Email:</strong> ${settings?.confirmation_email || settings?.company_email || '-'}<br>
                <em>Sertakan bukti transfer dan nomor invoice</em>
              </div>
            </div>
            ` : ''}

            <!-- Footer -->
            <div class="footer">
              Invoice ini dibuat secara otomatis oleh sistem.<br>
              Terima kasih atas kepercayaan Anda menggunakan layanan kami.
              <div class="footer-note">
                Dokumen ini sah dan diproses oleh komputer tanpa memerlukan tanda tangan basah.
              </div>
            </div>
          </div>
        </body>
        </html>
      `

      const opt = {
        margin: 0,
        filename: `Invoice-${invoice.invoice_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }

      const pdfBlob = await html2pdf().set(opt).from(htmlContent).output('blob')
      const blobUrl = URL.createObjectURL(pdfBlob)
      
      setPdfBlob(blobUrl)
      setShowPdfModal(true)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({ title: 'Error', description: 'Gagal generate PDF', variant: 'destructive' })
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const downloadPDF = () => {
    if (!pdfBlob || !selectedPdfInvoice) return
    
    const link = document.createElement('a')
    link.href = pdfBlob
    link.download = `Invoice-${selectedPdfInvoice.invoice_number}.pdf`
    link.click()
  }

  const printPDF = () => {
    if (!pdfBlob) return
    
    const printWindow = window.open(pdfBlob)
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  // Calculate statistics
  const totalInvoices = filteredInvoices.length
  const paidInvoices = filteredInvoices.filter(inv => inv.status === 'paid')
  const pendingInvoices = filteredInvoices.filter(inv => inv.status === 'pending' || inv.status === 'partial')
  const totalPaid = filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.paid_amount || '0'), 0)
  const totalUnpaid = filteredInvoices.reduce((sum, inv) => {
    const remaining = parseFloat(inv.amount) - parseFloat(inv.paid_amount || '0')
    return sum + remaining
  }, 0)

  const statusBadgeColor = (status: string) => {
    if (status === 'paid') return 'bg-green-100 text-green-800 hover:bg-green-200'
    if (status === 'partial') return 'bg-orange-100 text-orange-800 hover:bg-orange-200'
    return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }

  const statusText = (status: string) => {
    if (status === 'paid') return 'Lunas'
    if (status === 'partial') return 'Lunas Sebagian'
    return 'Belum Bayar'
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Invoice Keluar</h1>
              <p className="text-muted-foreground mt-1">Kelola tagihan pelanggan</p>
            </div>
            <Button onClick={() => { setShowForm(true); setEditingId(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Invoice
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoice Aktif</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInvoices}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Invoice periode ini
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

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tingkat Koleksi</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalInvoices > 0 ? Math.round((paidInvoices.length / totalInvoices) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Invoice yang sudah lunas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Filter & Pencarian</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari invoice, customer, paket..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Bulan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Bulan</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2024, i, 1).toLocaleString('id-ID', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedMonth('all')
                    setSelectedYear(new Date().getFullYear().toString())
                  }}
                >
                  Reset Filter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daftar Invoice</CardTitle>
              <CardDescription>Total {filteredInvoices.length} invoice ditemukan</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead>Tanggal Invoice</TableHead>
                    <TableHead>Tgl Jatuh Tempo</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Terbayar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        Tidak ada data invoice
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInvoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>{invoice.package_name}</TableCell>
                        <TableCell>{invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('id-ID') : '-'}</TableCell>
                        <TableCell>{new Date(invoice.due_date).toLocaleDateString('id-ID')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{invoice.invoice_type}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          Rp {parseFloat(invoice.amount).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          Rp {parseFloat(invoice.paid_amount || '0').toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={`${statusBadgeColor(invoice.status)} cursor-pointer`}
                            onClick={() => {
                              if (invoice.status === 'paid' || invoice.status === 'partial') {
                                openHistoryDialog(invoice)
                              }
                            }}
                          >
                            {statusText(invoice.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {(invoice.status === 'pending' || invoice.status === 'partial') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPaymentDialog(invoice)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Konfirmasi Pembayaran"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => generatePDF(invoice)}
                              title="Preview & Export PDF"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
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
            </CardContent>
          </Card>
        </div>

        {/* Add/Edit Form Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Invoice' : 'Tambah Invoice Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="invoice_number">No Invoice</Label>
                  <Input
                    id="invoice_number"
                    value={formData.invoice_number}
                    onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="invoice_type">Jenis Invoice</Label>
                  <Select
                    value={formData.invoice_type}
                    onValueChange={(value) => setFormData({ ...formData, invoice_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MRC">MRC (Monthly Recurring)</SelectItem>
                      <SelectItem value="OTC">OTC (One Time Charge)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="created_at">Tanggal Invoice</Label>
                  <Input
                    id="created_at"
                    type="date"
                    value={formData.created_at}
                    onChange={(e) => setFormData({ ...formData, created_at: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">Tanggal Jatuh Tempo</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Nama Customer</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="package_name">Paket</Label>
                  <Input
                    id="package_name"
                    value={formData.package_name}
                    onChange={(e) => setFormData({ ...formData, package_name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Jumlah (Rp)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Belum Bayar</SelectItem>
                    <SelectItem value="partial">Lunas Sebagian</SelectItem>
                    <SelectItem value="paid">Lunas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  {editingId ? 'Simpan Perubahan' : 'Tambah Invoice'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Confirmation Dialog */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Konfirmasi Pembayaran Invoice</DialogTitle>
            </DialogHeader>
            
            {selectedInvoice && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">No Invoice</p>
                      <p className="font-semibold">{selectedInvoice.invoice_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-semibold">{selectedInvoice.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Tagihan</p>
                      <p className="font-semibold">Rp {parseFloat(selectedInvoice.amount).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sudah Dibayar</p>
                      <p className="font-semibold text-green-600">Rp {parseFloat(selectedInvoice.paid_amount || '0').toLocaleString('id-ID')}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Sisa Tagihan</p>
                      <p className="font-bold text-xl text-orange-600">
                        Rp {(parseFloat(selectedInvoice.amount) - parseFloat(selectedInvoice.paid_amount || '0')).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bank_id">Bank Tujuan Transfer *</Label>
                      <Select
                        value={paymentData.bank_id}
                        onValueChange={(value) => setPaymentData({ ...paymentData, bank_id: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.map((bank) => (
                            <SelectItem key={bank.id} value={bank.id.toString()}>
                              {bank.bank_name} - {bank.account_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="payment_amount">Nominal Transfer (Rp) *</Label>
                      <Input
                        id="payment_amount"
                        type="number"
                        value={paymentData.amount}
                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                        max={parseFloat(selectedInvoice.amount) - parseFloat(selectedInvoice.paid_amount || '0')}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                      <Label htmlFor="transfer_from">Dari Rekening (Opsional)</Label>
                      <Input
                        id="transfer_from"
                        value={paymentData.transfer_from}
                        onChange={(e) => setPaymentData({ ...paymentData, transfer_from: e.target.value })}
                        placeholder="Nama pemilik rekening pengirim"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="proof">Bukti Transfer (Opsional)</Label>
                    <Input
                      id="proof"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Upload foto/scan bukti transfer (JPG, PNG, atau PDF)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="notes">Catatan (Opsional)</Label>
                    <Input
                      id="notes"
                      value={paymentData.notes}
                      onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                      placeholder="Catatan tambahan"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setShowPaymentDialog(false)}>
                      Batal
                    </Button>
                    <Button type="submit">
                      Konfirmasi Pembayaran
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment History Dialog */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Pembayaran Invoice</DialogTitle>
            </DialogHeader>
            
            {selectedHistoryInvoice && (
              <div className="space-y-6">
                {/* Invoice Summary */}
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">No Invoice</p>
                      <p className="font-semibold">{selectedHistoryInvoice.invoice_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Customer</p>
                      <p className="font-semibold">{selectedHistoryInvoice.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Tagihan</p>
                      <p className="font-semibold">Rp {parseFloat(selectedHistoryInvoice.amount).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sudah Dibayar</p>
                      <p className="font-semibold text-green-600">
                        Rp {parseFloat(selectedHistoryInvoice.paid_amount || '0').toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge className={statusBadgeColor(selectedHistoryInvoice.status)}>
                        {statusText(selectedHistoryInvoice.status)}
                      </Badge>
                    </div>
                    {selectedHistoryInvoice.status === 'partial' && (
                      <div>
                        <p className="text-muted-foreground">Sisa Tagihan</p>
                        <p className="font-semibold text-orange-600">
                          Rp {(parseFloat(selectedHistoryInvoice.amount) - parseFloat(selectedHistoryInvoice.paid_amount || '0')).toLocaleString('id-ID')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment History */}
                <div>
                  <h3 className="font-semibold mb-4">Riwayat Pembayaran ({paymentHistory.length})</h3>
                  <div className="space-y-4">
                    {paymentHistory.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Belum ada pembayaran</p>
                    ) : (
                      paymentHistory.map((payment) => (
                        <div key={payment.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-semibold text-lg">
                                Rp {parseFloat(payment.amount).toLocaleString('id-ID')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(payment.payment_date).toLocaleDateString('id-ID', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}
                              </p>
                            </div>
                            {payment.proof_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(payment.proof_url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Lihat Bukti
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Bank Tujuan</p>
                              <p className="font-medium">{payment.bank_name}</p>
                              <p className="text-xs text-muted-foreground">{payment.bank_account_number}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Dari Rekening</p>
                              <p className="font-medium">{payment.transfer_from || '-'}</p>
                            </div>
                          </div>

                          {payment.notes && (
                            <div>
                              <p className="text-muted-foreground text-sm">Catatan</p>
                              <p className="text-sm">{payment.notes}</p>
                            </div>
                          )}

                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground">
                              Dikonfirmasi oleh {payment.confirmed_by_name} pada {new Date(payment.created_at).toLocaleString('id-ID')}
                            </p>
                          </div>

                          {payment.proof_url && (
                            <div className="mt-3">
                              {payment.proof_url.toLowerCase().endsWith('.pdf') ? (
                                <div className="border rounded p-2">
                                  <p className="text-sm text-muted-foreground mb-2">Bukti Transfer (PDF)</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(payment.proof_url, '_blank')}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Buka PDF
                                  </Button>
                                </div>
                              ) : (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">Bukti Transfer</p>
                                  <img 
                                    src={payment.proof_url} 
                                    alt="Bukti Transfer" 
                                    className="max-w-full h-auto rounded border cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(payment.proof_url, '_blank')}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* PDF Preview Modal */}
        <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
          <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Preview Invoice PDF</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadPDF}
                    disabled={!pdfBlob}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={printPDF}
                    disabled={!pdfBlob}
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 w-full h-full min-h-[75vh] bg-gray-100 rounded-md overflow-hidden border relative">
              {isGeneratingPdf ? (
                <div className="flex items-center justify-center h-full absolute inset-0">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Membuat PDF...</p>
                  </div>
                </div>
              ) : pdfBlob ? (
                <iframe
                  src={pdfBlob}
                  className="w-full h-full absolute inset-0 border-0"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full absolute inset-0">
                  <p className="text-muted-foreground">Gagal memuat PDF</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    </ProtectedRoute>
  )
}