import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Package, FileText, DollarSign } from 'lucide-react'

interface DashboardStats {
  totalCustomers: number
  totalProducts: number
  pendingInvoices: number
  monthlyRevenue: number
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token')
  return {
    'Authorization': `Bearer ${token}`
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalProducts: 0,
    pendingInvoices: 0,
    monthlyRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      const [customersRes, productsRes] = await Promise.all([
        fetch('/api/customers', { headers: getAuthHeaders() }),
        fetch('/api/products', { headers: getAuthHeaders() }),
      ])

      const customersData = await customersRes.json()
      const productsData = await productsRes.json()

      setStats({
        totalCustomers: customersData.customers?.length || 0,
        totalProducts: productsData.products?.length || 0,
        pendingInvoices: 0,
        monthlyRevenue: 0,
      })
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Ringkasan operasional dan statistik sistem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Pelanggan
                </CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats.totalCustomers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Terdaftar di sistem</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pendapatan Bulan Ini
                </CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold font-mono">
                  Rp {new Intl.NumberFormat('id-ID').format(stats.monthlyRevenue)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Dari invoice lunas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Invoice Belum Bayar
                </CardTitle>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats.pendingInvoices}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Menunggu pembayaran</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Paket Layanan
                </CardTitle>
                <Package className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stats.totalProducts}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Produk tersedia</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Terkini</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Data aktivitas akan muncul di sini setelah sistem mulai digunakan.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}