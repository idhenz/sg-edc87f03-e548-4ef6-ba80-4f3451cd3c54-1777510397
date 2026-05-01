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
import { Plus, Edit, Trash2, Printer, DollarSign, Calendar, User, Package, FileText, CheckCircle, Clock, XCircle, Eye, Activity, TrendingUp, TrendingDown, Search, Pencil, ExternalLink, Download } from 'lucide-react'

interface Invoice {
  id: number
  customer_id: number
  customer_name: string
  package_name: string
  due_date: string
  amount: string
  tax: string
  total_amount: string
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
  is_active?: boolean
}

interface Settings {
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  logo_url: string
}

export default function InvoicesOutgoingPage() {
  const router = useRouter()
  const { user, getAuthHeader } = useAuth()
  const { toast } = useToast()

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([])
  const [paymentAmount, setPaymentAmount] = useState('')
  
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
      
      const res = await fetch(url, { headers: getAuthHeader() })
      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch {
      toast({ title: 'Error', description: 'Gagal memuat data invoice', variant: 'destructive' })
    }
  }

  const fetchBanks = async () => {
    try {
      const res = await fetch('/api/banks', { headers: getAuthHeader() })
      const data = await res.json()
      
      // Handle both direct array or { banks: [] } object format
      const banksList = Array.isArray(data) ? data : (data.banks || [])
      setBanks(banksList.filter((b: Bank) => b.is_active))
    } catch (error) {
      console.error('Error fetching banks:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', { headers: getAuthHeader() })
      const data = await res.json()
      // API returns array [{}], we need the first object
      const settingsData = Array.isArray(data) ? data[0] : data
      setSettings(settingsData)
      console.log('Settings fetched:', settingsData)
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchPaymentHistory = async (invoiceId: number) => {
    try {
      const res = await fetch(`/api/payments/history?invoice_id=${invoiceId}`, { headers: getAuthHeader() })
      const data = await res.json()
      setPaymentHistory(data.payments || [])
    } catch {
      toast({ title: 'Error', description: 'Gagal memuat riwayat pembayaran', variant: 'destructive' })
    }
  }

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    const remaining = parseFloat(invoice.total_amount || invoice.amount) - parseFloat(invoice.paid_amount || '0')
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
      const res = await fetch(`/api/invoices/outgoing?id=${id}`, { method: 'DELETE', headers: getAuthHeader() })
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
      console.log('=== GENERATING PDF FOR INVOICE ===')
      console.log('Invoice ID:', invoice.id)
      console.log('Invoice Number:', invoice.invoice_number)
      console.log('Amount (Subtotal):', invoice.amount)
      console.log('Tax:', invoice.tax)
      console.log('Total Amount:', invoice.total_amount)
      console.log('===================================')
      
      // Ensure settings are loaded first
      let currentSettings = settings
      if (!currentSettings) {
        const res = await fetch('/api/settings', { headers: getAuthHeader() })
        const data = await res.json()
        currentSettings = Array.isArray(data) ? data[0] : data
        setSettings(currentSettings)
      }

      // Ensure banks are loaded
      let currentBanks = banks
      if (!currentBanks || currentBanks.length === 0) {
        const res = await fetch('/api/banks', { headers: getAuthHeader() })
        const data = await res.json()
        const banksList = Array.isArray(data) ? data : (data.banks || [])
        currentBanks = banksList.filter((b: Bank) => b.is_active)
        setBanks(currentBanks)
      }

      // Extract settings data
      const settingsData = currentSettings?.settings || currentSettings
      const companyName = settingsData?.isp_name || 'PT. Internet Service Provider'
      const companyAddress = settingsData?.isp_address || 'Alamat Perusahaan'
      const companyPhone = settingsData?.isp_phone || '-'
      const companyEmail = settingsData?.isp_email || '-'
      const logoUrl = settingsData?.logo_url || ''
      const whatsappContact = settingsData?.invoice_whatsapp || '-'
      const taxPercentage = settingsData?.tax_percentage || 0

      console.log('=== SETTINGS DATA ===')
      console.log('Company Name:', companyName)
      console.log('Logo URL:', logoUrl)
      console.log('Tax Percentage:', taxPercentage)
      console.log('=====================')

      // Convert logo to base64 if available for better PDF rendering
      let logoBase64 = ''
      if (logoUrl) {
        try {
          const imgResponse = await fetch(logoUrl)
          const blob = await imgResponse.blob()
          logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
          })
          console.log('Logo converted to base64 successfully')
        } catch (error) {
          console.warn('Failed to load logo, will use URL directly:', error)
          logoBase64 = logoUrl
        }
      }

      // Calculate amounts
      const amount = parseFloat(invoice.amount)
      const tax = parseFloat(invoice.tax || '0')
      const totalAmount = parseFloat(invoice.total_amount || invoice.amount)
      const paid = parseFloat(invoice.paid_amount || '0')
      const remaining = totalAmount - paid

      console.log('=== PDF CALCULATIONS ===')
      console.log('Subtotal:', amount)
      console.log('Tax:', tax)
      console.log('Total:', totalAmount)
      console.log('Paid:', paid)
      console.log('Remaining:', remaining)
      console.log('========================')
      
      // Create temporary container for PDF content
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.width = '794px'
      tempDiv.style.background = 'white'
      tempDiv.style.padding = '40px'
      
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: #333; position: relative;">
          <!-- Watermark -->
          <div style="position: absolute; top: 400px; left: 50%; transform: translateX(-50%) rotate(-45deg); font-size: 100px; font-weight: 600; opacity: 0.04; color: ${invoice.status === 'paid' ? '#22c55e' : '#ef4444'}; z-index: 0; white-space: nowrap;">
            ${invoice.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS'}
          </div>

          <!-- Header -->
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="flex: 1;">
              ${logoBase64 ? `<img src="${logoBase64}" crossorigin="anonymous" style="max-width: 180px; max-height: 70px; margin-bottom: 10px; object-fit: contain;" />` : ''}
              <div style="font-size: 20px; font-weight: 600; color: #1e40af; margin-bottom: 8px;">${companyName}</div>
              <div style="font-size: 12px; color: #64748b; line-height: 1.6;">
                ${companyAddress}<br/>
                Telp: ${companyPhone}<br/>
                Email: ${companyEmail}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 32px; font-weight: 700; color: #1e40af; margin-bottom: 10px;">INVOICE</div>
              <div style="font-size: 12px; color: #475569; line-height: 1.8;">
                <span style="font-weight: 600;">No Invoice:</span> ${invoice.invoice_number}<br/>
                <span style="font-weight: 600;">Tanggal:</span> ${invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}<br/>
                <span style="font-weight: 600;">Jatuh Tempo:</span> ${new Date(invoice.due_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}<br/>
                <span style="font-weight: 600;">Jenis:</span> ${invoice.invoice_type}
              </div>
              <div style="display: inline-block; padding: 5px 15px; margin-top: 10px; border-radius: 20px; font-size: 11px; font-weight: 600; background: ${invoice.status === 'paid' ? '#dcfce7' : invoice.status === 'partial' ? '#fef3c7' : '#fee2e2'}; color: ${invoice.status === 'paid' ? '#166534' : invoice.status === 'partial' ? '#92400e' : '#991b1b'};">
                ${invoice.status === 'paid' ? 'Lunas' : invoice.status === 'partial' ? 'Lunas Sebagian' : 'Belum Lunas'}
              </div>
            </div>
          </div>

          <!-- Bill To -->
          <div style="margin: 25px 0;">
            <div style="font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">Tagihan Kepada</div>
            <div style="font-size: 17px; font-weight: 600; padding: 15px; background: #f8fafc; border-radius: 5px; color: #1e293b;">${invoice.customer_name}</div>
          </div>

          <!-- Items Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
            <thead>
              <tr style="background: #3b82f6; color: white;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600;">Deskripsi Layanan</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600;">Periode</th>
                <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #475569;">${invoice.package_name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #475569;">${invoice.invoice_type || 'MRC'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1e293b;">Rp ${amount.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>

          <!-- Totals -->
          <div style="text-align: right; margin-top: 20px;">
            <div style="display: inline-block; min-width: 350px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 10px; font-size: 13px;">
                <span style="color: #64748b;">Subtotal</span>
                <span style="font-weight: 600; color: #1e293b;">Rp ${amount.toLocaleString('id-ID')}</span>
              </div>
              
              <div style="display: flex; justify-content: space-between; padding: 8px 10px; font-size: 13px;">
                <span style="color: #64748b;">Tax (${taxPercentage}%)</span>
                <span style="font-weight: 600; color: #1e293b;">Rp ${tax.toLocaleString('id-ID')}</span>
              </div>

              <div style="display: flex; justify-content: space-between; padding: 12px 10px; font-size: 14px; border-top: 2px solid #3b82f6; margin-top: 8px;">
                <span style="font-weight: 600; color: #1e293b;">Total Tagihan</span>
                <span style="font-weight: 700; font-size: 17px; color: #1e40af;">Rp ${totalAmount.toLocaleString('id-ID')}</span>
              </div>
              
              ${paid > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 8px 10px; font-size: 13px;">
                <span style="color: #64748b;">Terbayar</span>
                <span style="font-weight: 600; color: #22c55e;">-Rp ${paid.toLocaleString('id-ID')}</span>
              </div>
              ` : ''}

              ${paid > 0 && remaining > 0 ? `
              <div style="display: flex; justify-content: space-between; padding: 12px 10px; font-size: 14px; border-top: 2px solid #3b82f6; margin-top: 8px;">
                <span style="font-weight: 600; color: #1e293b;">Sisa Tagihan</span>
                <span style="font-weight: 700; font-size: 17px; color: #ea580c;">Rp ${remaining.toLocaleString('id-ID')}</span>
              </div>
              ` : ''}
            </div>
          </div>

          ${invoice.status !== 'paid' ? `
          <!-- Payment Info -->
          <div style="margin-top: 40px; padding: 20px; border: 2px solid #3b82f6; border-radius: 8px;">
            <div style="font-size: 14px; font-weight: 600; margin-bottom: 15px; color: #1e40af;">🏦 Informasi Pembayaran</div>

            ${currentBanks.slice(0, 4).map(bank => `
              <div style="background: #eff6ff; padding: 12px; margin-bottom: 10px; border-radius: 5px; border: 1px solid #bfdbfe;">
                <div style="font-size: 11px; color: #64748b;">${bank.bank_name}</div>
                <div style="font-size: 14px; font-weight: 600; margin: 5px 0; color: #1e293b;">${bank.account_number}</div>
                <div style="font-size: 11px; color: #64748b;">a/n ${bank.account_holder}</div>
              </div>
            `).join('')}

            <div style="border-top: 2px solid #bfdbfe; margin-top: 15px; padding-top: 15px; font-size: 12px; line-height: 1.7; color: #475569;">
              <span style="font-weight: 600;">📱 Konfirmasi Pembayaran:</span><br/>
              Silakan konfirmasi pembayaran Anda melalui:<br/>
              <span style="font-weight: 600;">WhatsApp:</span> ${whatsappContact}<br/>
              <span style="font-weight: 600;">Email:</span> ${companyEmail}<br/>
              <em style="font-size: 11px; opacity: 0.9;">Sertakan bukti transfer dan nomor invoice</em>
            </div>
          </div>
          ` : ''}

          <!-- Footer -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.6;">
            Invoice ini dibuat secara otomatis oleh sistem.<br/>
            Terima kasih atas kepercayaan Anda menggunakan layanan kami.<br/>
            <em>Dokumen ini sah dan diproses oleh komputer tanpa memerlukan tanda tangan basah.</em>
          </div>
        </div>
      `

      document.body.appendChild(tempDiv)

      // Generate canvas from HTML
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

      document.body.removeChild(tempDiv)

      // Create PDF from canvas
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
    const remaining = parseFloat(inv.total_amount || inv.amount) - parseFloat(inv.paid_amount || '0')
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
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Terbayar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center text-muted-foreground">
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
                        <TableCell className="text-right font-mono text-muted-foreground">
                          Rp {parseFloat(invoice.tax || '0').toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          Rp {parseFloat(invoice.total_amount || invoice.amount).toLocaleString('id-ID')}
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
                      <p className="text-muted-foreground">Subtotal</p>
                      <p className="font-semibold">Rp {parseFloat(selectedInvoice.amount).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tax</p>
                      <p className="font-semibold">Rp {parseFloat(selectedInvoice.tax || '0').toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total Tagihan</p>
                      <p className="font-semibold text-lg">Rp {parseFloat(selectedInvoice.total_amount || selectedInvoice.amount).toLocaleString('id-ID')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sudah Dibayar</p>
                      <p className="font-semibold text-green-600">Rp {parseFloat(selectedInvoice.paid_amount || '0').toLocaleString('id-ID')}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Sisa Tagihan</p>
                      <p className="font-bold text-xl text-orange-600">
                        Rp {(parseFloat(selectedInvoice.total_amount || selectedInvoice.amount) - parseFloat(selectedInvoice.paid_amount || '0')).toLocaleString('id-ID')}
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