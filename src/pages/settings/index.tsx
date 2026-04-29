import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Settings, Building2, Database, Bell } from 'lucide-react'

export default function SettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Pengaturan</h1>
            <p className="text-muted-foreground">
              Konfigurasi sistem dan profil perusahaan
            </p>
          </div>

          <div className="grid gap-6">
            {/* Company Profile */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle>Profil Perusahaan</CardTitle>
                    <CardDescription>
                      Informasi identitas ISP yang muncul di invoice dan dokumen
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Nama Perusahaan</Label>
                    <Input id="company-name" placeholder="PT. Contoh ISP" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Nomor Telepon</Label>
                    <Input id="company-phone" placeholder="+62 xxx xxxx xxxx" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Email</Label>
                  <Input id="company-email" type="email" placeholder="info@contohisp.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Alamat</Label>
                  <Textarea id="company-address" rows={3} placeholder="Alamat lengkap kantor" />
                </div>
                <Button>Simpan Profil</Button>
              </CardContent>
            </Card>

            {/* System Configuration */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle>Konfigurasi Sistem</CardTitle>
                    <CardDescription>
                      Pengaturan umum aplikasi dan notifikasi
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice-prefix">Prefix Nomor Invoice</Label>
                  <Input id="invoice-prefix" placeholder="INV" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-due">Jatuh Tempo Pembayaran (Hari)</Label>
                  <Input id="payment-due" type="number" placeholder="30" />
                </div>
                <Button>Simpan Konfigurasi</Button>
              </CardContent>
            </Card>

            {/* Database Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-primary" />
                  <div>
                    <CardTitle>Koneksi Database</CardTitle>
                    <CardDescription>
                      Informasi koneksi ke MySQL remote
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Host</span>
                  <span className="text-sm font-mono">{process.env.DB_HOST || 'Not configured'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Database</span>
                  <span className="text-sm font-mono">{process.env.DB_NAME || 'Not configured'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className="text-sm text-green-600 font-medium">Connected</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Kredensial database dikelola melalui Environment Variables di Settings Softgen
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}