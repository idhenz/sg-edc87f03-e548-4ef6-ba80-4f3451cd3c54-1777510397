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
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  
  // Payment confirmation states
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [banks, setBanks] = useState<Bank[]>([])
  const [paymentAmount, setPaymentAmount] = useState('')
  
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
    invoice_type: 'MRC'
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
  }, [selectedMonth, selectedYear])

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
      setBanks(data.banks || [])
    } catch {
      toast({ title: 'Error', description: 'Gagal memuat data bank', variant: 'destructive' })
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
          invoice_type: 'MRC'
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
      invoice_type: invoice.invoice_type
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
    setShowPdfModal(true)

    try {
      // Fetch additional data
      const [settingsRes, banksRes, historyRes] = await Promise.all([
        fetch('/api/settings'),
        fetch('/api/banks'),
        fetch(`/api/payments/history?invoice_id=${invoice.id}`)
      ])

      const settingsData = await settingsRes.json()
      const banksData = await banksRes.json()
      const historyData = await historyRes.json()

      const settings: Settings = settingsData.settings || {}
      const banksList: Bank[] = banksData.banks || []
      const payments: PaymentHistory[] = historyData.payments || []

      // Create hidden container for PDF generation
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.width = '210mm'
      container.style.padding = '20mm'
      container.style.backgroundColor = 'white'
      container.style.fontFamily = 'Arial, sans-serif'
      
      const paidAmount = parseFloat(invoice.paid_amount || '0')
      const totalAmount = parseFloat(invoice.amount)
      const remainingAmount = totalAmount - paidAmount

      // Generate invoice HTML
      container.innerHTML = `
        <div style="position: relative;">
          ${invoice.status === 'paid' ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 120px; color: rgba(34, 197, 94, 0.1); font-weight: bold; z-index: 0; pointer-events: none;">LUNAS</div>' : ''}
          ${invoice.status === 'partial' ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80px; color: rgba(251, 146, 60, 0.1); font-weight: bold; z-index: 0; pointer-events: none;">LUNAS SEBAGIAN</div>' : ''}
          ${invoice.status === 'pending' ? '<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; color: rgba(148, 163, 184, 0.1); font-weight: bold; z-index: 0; pointer-events: none;">BELUM BAYAR</div>' : ''}
          
          <div style="position: relative; z-index: 1;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px;">
              <div>
                ${settings.logo_url ? `<img src="${settings.logo_url}" alt="Logo" style="height: 60px; margin-bottom: 10px;" />` : ''}
                <h1 style="margin: 0; font-size: 24px; color: #1e40af;">${settings.company_name || 'ISP Company'}</h1>
                <p style="margin: 5px 0; font-size: 12px; color: #64748b;">${settings.company_address || ''}</p>
                <p style="margin: 5px 0; font-size: 12px; color: #64748b;">Telp: ${settings.company_phone || ''} | Email: ${settings.company_email || ''}</p>
              </div>
              <div style="text-align: right;">
                <h2 style="margin: 0; font-size: 32px; color: #1e40af; font-weight: bold;">INVOICE</h2>
                <p style="margin: 5px 0; font-size: 14px;"><strong>No:</strong> ${invoice.invoice_number}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Tgl Jatuh Tempo:</strong> ${new Date(invoice.due_date).toLocaleDateString('id-ID')}</p>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-transform: uppercase;">Tagihan Kepada:</h3>
                <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #1e293b;">${invoice.customer_name}</p>
                <p style="margin: 5px 0; font-size: 14px; color: #64748b;">Paket: ${invoice.package_name}</p>
              </div>
              <div style="flex: 1; text-align: right;">
                <p style="margin: 5px 0; font-size: 14px;"><strong>Jenis:</strong> ${invoice.invoice_type}</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>Status:</strong> <span style="color: ${invoice.status === 'paid' ? '#22c55e' : invoice.status === 'partial' ? '#fb923c' : '#94a3b8'}; font-weight: bold;">${invoice.status === 'paid' ? 'LUNAS' : invoice.status === 'partial' ? 'LUNAS SEBAGIAN' : 'BELUM BAYAR'}</span></p>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
              <thead>
                <tr style="background-color: #1e40af; color: white;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Deskripsi</th>
                  <th style="padding: 12px; text-align: right; border: 1px solid #ddd; width: 150px;">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 12px; border: 1px solid #ddd;">${invoice.package_name} - ${invoice.invoice_type}</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #ddd;">Rp ${parseFloat(invoice.amount).toLocaleString('id-ID')}</td>
                </tr>
                ${invoice.status !== 'pending' ? `
                <tr style="background-color: #f1f5f9;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Sudah Dibayar</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: #22c55e; font-weight: bold;">Rp ${paidAmount.toLocaleString('id-ID')}</td>
                </tr>
                ` : ''}
                ${invoice.status === 'partial' ? `
                <tr style="background-color: #fef3c7;">
                  <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Sisa Tagihan</td>
                  <td style="padding: 12px; text-align: right; border: 1px solid #ddd; color: #fb923c; font-weight: bold;">Rp ${remainingAmount.toLocaleString('id-ID')}</td>
                </tr>
                ` : ''}
                <tr style="background-color: #1e293b; color: white;">
                  <td style="padding: 15px; border: 1px solid #ddd; font-weight: bold; font-size: 16px;">TOTAL TAGIHAN</td>
                  <td style="padding: 15px; text-align: right; border: 1px solid #ddd; font-weight: bold; font-size: 18px;">Rp ${parseFloat(invoice.amount).toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>

            ${payments.length > 0 ? `
            <div style="margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-transform: uppercase;">Riwayat Pembayaran:</h3>
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                  <tr style="background-color: #f1f5f9;">
                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Tanggal</th>
                    <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Bank</th>
                    <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  ${payments.map(p => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">${new Date(p.payment_date).toLocaleDateString('id-ID')}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${p.bank_name}</td>
                    <td style="padding: 8px; text-align: right; border: 1px solid #ddd;">Rp ${parseFloat(p.amount).toLocaleString('id-ID')}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <div style="margin-bottom: 30px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #1e40af;">
              <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af; text-transform: uppercase;">Pembayaran Transfer ke:</h3>
              ${banksList.map(bank => `
                <p style="margin: 5px 0; font-size: 13px;"><strong>${bank.bank_name}</strong> - ${bank.account_number} a.n. ${bank.account_holder}</p>
              `).join('')}
            </div>

            <div style="margin-top: 60px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              <p style="margin: 5px 0;">Dokumen ini dibuat secara otomatis oleh sistem.</p>
              <p style="margin: 5px 0;">Untuk informasi lebih lanjut, hubungi ${settings.company_phone || ''} atau ${settings.company_email || ''}</p>
            </div>
          </div>
        </div>
      `

      document.body.appendChild(container)

      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      document.body.removeChild(container)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      
      const pdfBlob = pdf.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)
      
      setPdfBlob(pdfUrl)
      setIsGeneratingPdf(false)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast({ 
        title: 'Error', 
        description: 'Gagal membuat PDF. Silakan coba lagi.', 
        variant: 'destructive' 
      })
      setIsGeneratingPdf(false)
      setShowPdfModal(false)
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
                  <Label htmlFor="due_date">Tanggal Jatuh Tempo</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </div>
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
          <DialogContent className="max-w-4xl max-h-[90vh]">
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
            <div className="flex-1 overflow-hidden bg-gray-100">
              {isGeneratingPdf ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Membuat PDF...</p>
                  </div>
                </div>
              ) : pdfBlob ? (
                <iframe
                  src={pdfBlob}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
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