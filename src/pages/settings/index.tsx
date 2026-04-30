import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Upload, Building2, CreditCard, DollarSign, Phone, Mail } from 'lucide-react'

interface Settings {
  id: number
  isp_name: string
  isp_address: string
  isp_phone: string
  tax_percentage: number
  logo_url: string | null
  invoice_whatsapp: string
  bank_name: string
  bank_account_number: string
  bank_account_name: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      
      console.log('=== SETTINGS PAGE - FETCH ===')
      console.log('API Response:', data)
      
      if (data.settings) {
        const settingsData = data.settings
        console.log('Setting form data:', settingsData)
        
        setFormData({
          isp_name: settingsData.isp_name || '',
          isp_address: settingsData.isp_address || '',
          isp_phone: settingsData.isp_phone || '',
          isp_email: settingsData.isp_email || '',
          logo_url: settingsData.logo_url || '',
          invoice_whatsapp: settingsData.invoice_whatsapp || '',
          tax_percentage: settingsData.tax_percentage?.toString() || '11',
          bank_name: settingsData.bank_name || '',
          bank_account_number: settingsData.bank_account_number || '',
          bank_account_name: settingsData.bank_account_name || ''
        })
        
        console.log('Form data set successfully')
      }
      console.log('=============================')
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast({ 
        title: 'Error', 
        description: 'Gagal memuat data pengaturan', 
        variant: 'destructive' 
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'File harus berupa gambar (PNG, JPG, atau SVG)',
        variant: 'destructive',
      })
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploadingLogo(true)
      const res = await fetch('/api/settings/upload-logo', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload gagal')

      const data = await res.json()
      setLogoPreview(data.fileUrl)
      
      if (settings) {
        setSettings({ ...settings, logo_url: data.fileUrl })
      }

      toast({
        title: 'Berhasil',
        description: 'Logo berhasil diupload',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengupload logo',
        variant: 'destructive',
      })
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      const token = localStorage.getItem('auth_token')
      
      console.log('=== SAVING SETTINGS ===')
      console.log('Form data to save:', formData)
      
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      
      if (res.ok) {
        console.log('Settings saved successfully:', data)
        toast({ 
          title: 'Sukses', 
          description: 'Pengaturan berhasil disimpan' 
        })
        fetchSettings()
      } else {
        console.error('Save failed:', data)
        toast({ 
          title: 'Error', 
          description: data.message || 'Gagal menyimpan pengaturan', 
          variant: 'destructive' 
        })
      }
      console.log('=======================')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({ 
        title: 'Error', 
        description: 'Terjadi kesalahan pada server', 
        variant: 'destructive' 
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="text-center py-8 text-muted-foreground">Memuat pengaturan...</div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Pengaturan Sistem</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informasi ISP */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Informasi ISP
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="isp_name">Nama ISP *</Label>
                    <Input
                      id="isp_name"
                      name="isp_name"
                      defaultValue={settings?.isp_name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isp_phone">Telepon ISP</Label>
                    <Input
                      id="isp_phone"
                      name="isp_phone"
                      placeholder="08xx-xxxx-xxxx"
                      defaultValue={settings?.isp_phone}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="isp_address">Alamat ISP</Label>
                    <Textarea
                      id="isp_address"
                      name="isp_address"
                      rows={3}
                      defaultValue={settings?.isp_address}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="logo">Logo ISP</Label>
                    <div className="flex items-center gap-4">
                      {logoPreview && (
                        <div className="w-24 h-24 border rounded-lg overflow-hidden flex items-center justify-center bg-muted">
                          <img 
                            src={logoPreview} 
                            alt="Logo ISP" 
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                        {uploadingLogo && (
                          <span className="text-sm text-muted-foreground">Uploading...</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pajak */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pajak / Tax
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="tax_percentage">Persentase Pajak (%) *</Label>
                  <Input
                    id="tax_percentage"
                    name="tax_percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="11.00"
                    defaultValue={settings?.tax_percentage}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Contoh: 11.00 untuk PPN 11%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Informasi Bank */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informasi Rekening Bank
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank_name">Nama Bank</Label>
                    <Input
                      id="bank_name"
                      name="bank_name"
                      placeholder="Contoh: BCA"
                      defaultValue={settings?.bank_name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank_account_number">Nomor Rekening</Label>
                    <Input
                      id="bank_account_number"
                      name="bank_account_number"
                      placeholder="1234567890"
                      defaultValue={settings?.bank_account_number}
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="bank_account_name">Nama Pemilik Rekening</Label>
                    <Input
                      id="bank_account_name"
                      name="bank_account_name"
                      placeholder="Nama sesuai rekening bank"
                      defaultValue={settings?.bank_account_name}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kontak Invoice */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Kontak Konfirmasi Invoice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-w-md">
                  <Label htmlFor="invoice_whatsapp">Nomor WhatsApp</Label>
                  <Input
                    id="invoice_whatsapp"
                    name="invoice_whatsapp"
                    placeholder="628xxxxxxxxxx"
                    defaultValue={settings?.invoice_whatsapp}
                  />
                  <p className="text-sm text-muted-foreground">
                    Format: 628xxxxxxxxxx (tanpa +)
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </Button>
            </div>
          </form>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}