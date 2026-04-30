import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Printer, ArrowLeft, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function InvoicePrintPage() {
  const router = useRouter()
  const { id } = router.query
  
  const [invoice, setInvoice] = useState<any>(null)
  const [settings, setSettings] = useState<any>({})
  const [banks, setBanks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const headers = {
        'Authorization': `Bearer ${token}`
      }

      // Fetch Invoice
      const invRes = await fetch(`/api/invoices/outgoing?id=${id}`, { headers })
      const invData = await invRes.json()
      
      // Fetch Settings (Company Info)
      const setRes = await fetch('/api/settings', { headers })
      const setData = await setRes.json()
      
      // Fetch Banks
      const bankRes = await fetch('/api/banks', { headers })
      const bankData = await bankRes.json()

      if (invData.invoice) {
        setInvoice(invData.invoice)
      }
      if (setData.settings) {
        setSettings(setData.settings)
      }
      if (bankData.banks) {
        setBanks(bankData.banks)
      }
    } catch (error) {
      console.error('Error fetching print data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Memuat data invoice...</div>
  }

  if (!invoice) {
    return <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Invoice tidak ditemukan</h1>
      <Button onClick={() => router.push('/invoices/outgoing')}>Kembali</Button>
    </div>
  }

  const amount = parseFloat(invoice.amount)
  const paid = invoice.paid_amount !== null && invoice.paid_amount !== undefined 
    ? parseFloat(invoice.paid_amount) 
    : (invoice.status === 'paid' ? amount : 0)
  const remaining = amount - paid

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      <Head>
        <title>Invoice {invoice.invoice_number}</title>
        <style>{`
          body {
            background-color: #f1f5f9;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
          @media print {
            body {
              background-color: white;
            }
            .no-print {
              display: none !important;
            }
            .print-container {
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
            }
          }
        `}</style>
      </Head>

      {/* Top action bar - Hidden during print */}
      <div className="no-print bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/invoices/outgoing')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div className="flex items-center gap-2">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Printer className="h-4 w-4 mr-2" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>

      {/* A4 Paper Container */}
      <div className="py-8 px-4 flex justify-center">
        <div className="print-container bg-white shadow-lg w-[210mm] min-h-[297mm] p-[20mm] relative">
          
          {/* Watermark Status */}
          {invoice.status === 'paid' && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] text-[120px] font-bold text-green-500/10 pointer-events-none select-none z-0">
              LUNAS
            </div>
          )}
          {invoice.status === 'partial' && (
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] text-[100px] font-bold text-orange-500/10 pointer-events-none select-none z-0">
              LUNAS SEBAGIAN
            </div>
          )}

          <div className="relative z-10">
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-8 mb-8">
              <div className="flex gap-4 items-center">
                {settings.company_logo ? (
                  <img src={settings.company_logo} alt="Logo" className="h-16 object-contain" />
                ) : (
                  <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-xl">
                    LOGO
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{settings.company_name || 'Nama Perusahaan'}</h1>
                  <p className="text-sm text-slate-500 max-w-[250px] mt-1">{settings.company_address || 'Alamat perusahaan belum diatur'}</p>
                  <p className="text-sm text-slate-500">{settings.company_phone || '-'}</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black text-slate-200 tracking-wider">INVOICE</h2>
                <div className="mt-2 text-sm">
                  <div className="flex justify-end gap-4 mb-1">
                    <span className="text-slate-500">Nomor:</span>
                    <span className="font-semibold text-slate-900">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-end gap-4 mb-1">
                    <span className="text-slate-500">Tanggal:</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(invoice.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-end gap-4">
                    <span className="text-slate-500">Jatuh Tempo:</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(invoice.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Tagihan Kepada:</h3>
              <div className="p-4 bg-slate-50 rounded-lg inline-block min-w-[300px]">
                <p className="text-lg font-bold text-slate-900">{invoice.customer_name}</p>
                <p className="text-sm text-slate-600 mt-1">Layanan Internet: {invoice.package_name}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-8">
              <thead>
                <tr className="border-b-2 border-slate-900 text-left">
                  <th className="py-3 px-2 text-sm font-semibold text-slate-700">Deskripsi Layanan</th>
                  <th className="py-3 px-2 text-sm font-semibold text-slate-700 w-24 text-center">Tipe</th>
                  <th className="py-3 px-2 text-sm font-semibold text-slate-700 w-48 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b-2 border-slate-200">
                <tr>
                  <td className="py-4 px-2">
                    <p className="font-medium text-slate-900">{invoice.package_name}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      Tagihan {invoice.invoice_type === 'OTC' ? 'Pemasangan Baru' : 'Layanan Internet Bulanan'}
                    </p>
                  </td>
                  <td className="py-4 px-2 text-center">
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 rounded-md">
                      {invoice.invoice_type || 'MRC'}
                    </span>
                  </td>
                  <td className="py-4 px-2 text-right font-semibold text-slate-900">
                    Rp {amount.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-12">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>Rp {amount.toLocaleString('id-ID')}</span>
                </div>
                
                {paid > 0 && (
                  <div className="flex justify-end gap-2 text-sm">
                    <div className="flex justify-between w-full text-green-600 font-medium">
                      <span>Telah Dibayar</span>
                      <span>- Rp {paid.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold text-slate-900 border-t-2 pt-3">
                  <span>{paid > 0 ? 'Sisa Tagihan' : 'Total Tagihan'}</span>
                  <span>Rp {remaining.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Footer / Bank Info */}
            <div className="border-t pt-8 grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  Metode Pembayaran
                </h3>
                <div className="space-y-3">
                  {banks.map(bank => (
                    <div key={bank.id} className="text-sm">
                      <p className="font-bold text-slate-900">{bank.bank_name}</p>
                      <p className="font-mono text-slate-600">{bank.account_number}</p>
                      <p className="text-slate-500">a.n. {bank.account_holder}</p>
                    </div>
                  ))}
                  {banks.length === 0 && (
                    <p className="text-sm text-slate-500 italic">Informasi rekening belum diatur.</p>
                  )}
                </div>
              </div>
              
              <div className="text-right flex flex-col justify-end">
                <div className="mb-4">
                  <p className="text-sm text-slate-500">Diterbitkan oleh,</p>
                  <p className="font-bold text-slate-900 mt-1">{settings.company_name || 'Admin'}</p>
                </div>
                <div className="h-16"></div>
                <div className="w-48 border-t border-slate-300 ml-auto"></div>
                <p className="text-xs text-slate-400 mt-2">Finance Department</p>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </>
  )
}