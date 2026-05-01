import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Package, FileText, DollarSign, TrendingUp, Activity } from 'lucide-react'

interface DashboardStats {
  totalCustomers: number
  totalProducts: number
  pendingInvoices: number
  monthlyRevenue: number
}

export default function DashboardPage() {
  const { user, getAuthHeader } = useAuth()
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalProducts: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0,
    onlineConnections: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchStats()
    }
  }, [user])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const [customersRes, productsRes] = await Promise.all([
        fetch('/api/customers', { headers: getAuthHeader() }),
        fetch('/api/products', { headers: getAuthHeader() }),
      ])

      const customers = customersRes.ok ? await customersRes.json() : []
      const products = productsRes.ok ? await productsRes.json() : []

      const activeCustomers = customers.filter((c: any) => c.status === 'active').length
      const onlineConnections = customers.filter((c: any) => c.pppoe_online).length

      setStats({
        totalCustomers: customers.length,
        activeCustomers,
        totalProducts: products.length,
        monthlyRevenue: 0,
        pendingInvoices: 0,
        onlineConnections
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
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