import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Pencil, Trash2, Upload, X, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  address: string
  package_name: string
  status: string
  customer_type: string
  province_id: string
  regency_id: string
  district_id: string
  village_id: string
  province_name?: string
  regency_name?: string
  district_name?: string
  village_name?: string
  ktp_file?: string | null
  npwp_file?: string | null
  nib_file?: string | null
  sertifikat_standar_file?: string | null
}

interface Region {
  id: string
  name: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({})
  const { toast } = useToast()

  const [provinces, setProvinces] = useState<Region[]>([])
  const [regencies, setRegencies] = useState<Region[]>([])
  const [districts, setDistricts] = useState<Region[]>([])
  const [villages, setVillages] = useState<Region[]>([])

  const [selectedProvince, setSelectedProvince] = useState('')
  const [selectedRegency, setSelectedRegency] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedVillage, setSelectedVillage] = useState('')
  const [selectedCustomerType, setSelectedCustomerType] = useState('personal')

  const [uploadingFile, setUploadingFile] = useState('')
  const [ktpFile, setKtpFile] = useState<string | null>(null)
  const [npwpFile, setNpwpFile] = useState<string | null>(null)
  const [nibFile, setNibFile] = useState<string | null>(null)
  const [sertifikatFile, setSertifikatFile] = useState<string | null>(null)
  const [deleteFlags, setDeleteFlags] = useState({
    ktp: false,
    npwp: false,
    nib: false,
    sertifikat: false
  })

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/customers')
      const data = await res.json()
      setCustomers(data.customers || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data pelanggan',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchProvinces = async () => {
    try {
      const res = await fetch('/api/regions/provinces')
      const data = await res.json()
      setProvinces(data.provinces || [])
    } catch (error) {
      console.error('Failed to fetch provinces:', error)
    }
  }

  const fetchRegencies = async (provinceId: string) => {
    try {
      const res = await fetch(`/api/regions/regencies?province_id=${provinceId}`)
      const data = await res.json()
      setRegencies(data.regencies || [])
    } catch (error) {
      console.error('Failed to fetch regencies:', error)
    }
  }

  const fetchDistricts = async (regencyId: string) => {
    try {
      const res = await fetch(`/api/regions/districts?regency_id=${regencyId}`)
      const data = await res.json()
      setDistricts(data.districts || [])
    } catch (error) {
      console.error('Failed to fetch districts:', error)
    }
  }

  const fetchVillages = async (districtId: string) => {
    try {
      const res = await fetch(`/api/regions/villages?district_id=${districtId}`)
      const data = await res.json()
      setVillages(data.villages || [])
    } catch (error) {
      console.error('Failed to fetch villages:', error)
    }
  }

  useEffect(() => {
    fetchCustomers()
    fetchProvinces()
  }, [])

  useEffect(() => {
    if (selectedProvince) {
      fetchRegencies(selectedProvince)
      setSelectedRegency('')
      setSelectedDistrict('')
      setSelectedVillage('')
      setRegencies([])
      setDistricts([])
      setVillages([])
    }
  }, [selectedProvince])

  useEffect(() => {
    if (selectedRegency) {
      fetchDistricts(selectedRegency)
      setSelectedDistrict('')
      setSelectedVillage('')
      setDistricts([])
      setVillages([])
    }
  }, [selectedRegency])

  useEffect(() => {
    if (selectedDistrict) {
      fetchVillages(selectedDistrict)
      setSelectedVillage('')
      setVillages([])
    }
  }, [selectedDistrict])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fileType: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      setUploadingFile(fileType)
      const res = await fetch('/api/customers/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      
      switch (fileType) {
        case 'ktp':
          setKtpFile(data.fileUrl)
          break
        case 'npwp':
          setNpwpFile(data.fileUrl)
          break
        case 'nib':
          setNibFile(data.fileUrl)
          break
        case 'sertifikat':
          setSertifikatFile(data.fileUrl)
          break
      }

      toast({
        title: 'Berhasil',
        description: 'File berhasil diupload',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengupload file',
        variant: 'destructive',
      })
    } finally {
      setUploadingFile('')
    }
  }

  const handleDeleteFile = (fileType: string) => {
    switch (fileType) {
      case 'ktp':
        setKtpFile(null)
        setDeleteFlags(prev => ({ ...prev, ktp: true }))
        break
      case 'npwp':
        setNpwpFile(null)
        setDeleteFlags(prev => ({ ...prev, npwp: true }))
        break
      case 'nib':
        setNibFile(null)
        setDeleteFlags(prev => ({ ...prev, nib: true }))
        break
      case 'sertifikat':
        setSertifikatFile(null)
        setDeleteFlags(prev => ({ ...prev, sertifikat: true }))
        break
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      package_name: formData.get('package_name'),
      status: formData.get('status'),
      customer_type: selectedCustomerType,
      province_id: selectedProvince || null,
      regency_id: selectedRegency || null,
      district_id: selectedDistrict || null,
      village_id: selectedVillage || null,
      ktp_file: ktpFile,
      npwp_file: npwpFile,
      nib_file: nibFile,
      sertifikat_standar_file: sertifikatFile,
      delete_ktp: deleteFlags.ktp,
      delete_npwp: deleteFlags.npwp,
      delete_nib: deleteFlags.nib,
      delete_sertifikat: deleteFlags.sertifikat,
    }

    try {
      const url = editMode ? `/api/customers?id=${currentCustomer.id}` : '/api/customers'
      const method = editMode ? 'PUT' : 'POST'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Gagal menyimpan data')

      toast({
        title: 'Berhasil',
        description: editMode ? 'Data pelanggan berhasil diperbarui' : 'Pelanggan baru berhasil ditambahkan',
      })

      setDialogOpen(false)
      setEditMode(false)
      setCurrentCustomer({})
      resetForm()
      fetchCustomers()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan data pelanggan',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setSelectedProvince('')
    setSelectedRegency('')
    setSelectedDistrict('')
    setSelectedVillage('')
    setSelectedCustomerType('personal')
    setRegencies([])
    setDistricts([])
    setVillages([])
    setKtpFile(null)
    setNpwpFile(null)
    setNibFile(null)
    setSertifikatFile(null)
    setDeleteFlags({ ktp: false, npwp: false, nib: false, sertifikat: false })
  }

  const handleEdit = async (customer: Customer) => {
    setCurrentCustomer(customer)
    setEditMode(true)
    setSelectedCustomerType(customer.customer_type || 'personal')
    
    if (customer.province_id) {
      setSelectedProvince(customer.province_id)
      await fetchRegencies(customer.province_id)
    }
    if (customer.regency_id) {
      setSelectedRegency(customer.regency_id)
      await fetchDistricts(customer.regency_id)
    }
    if (customer.district_id) {
      setSelectedDistrict(customer.district_id)
      await fetchVillages(customer.district_id)
    }
    if (customer.village_id) {
      setSelectedVillage(customer.village_id)
    }
    
    setKtpFile(customer.ktp_file || null)
    setNpwpFile(customer.npwp_file || null)
    setNibFile(customer.nib_file || null)
    setSertifikatFile(customer.sertifikat_standar_file || null)
    setDeleteFlags({ ktp: false, npwp: false, nib: false, sertifikat: false })
    
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pelanggan ini?')) return

    try {
      const res = await fetch(`/api/customers?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus data')

      toast({
        title: 'Berhasil',
        description: 'Pelanggan berhasil dihapus',
      })
      fetchCustomers()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menghapus pelanggan',
        variant: 'destructive',
      })
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
  )

  const renderFileUpload = (fileType: string, label: string, currentFile: string | null) => {
    const isUploading = uploadingFile === fileType
    
    return (
      <div className="space-y-2">
        <Label htmlFor={fileType}>{label}</Label>
        {currentFile && !deleteFlags[fileType as keyof typeof deleteFlags] ? (
          <div className="flex items-center gap-2 p-2 border rounded-md">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <a 
              href={currentFile} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex-1"
            >
              Lihat File
            </a>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteFile(fileType)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              id={fileType}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload(e, fileType)}
              disabled={isUploading}
            />
            {isUploading && <span className="text-sm text-muted-foreground">Uploading...</span>}
          </div>
        )}
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Data Pelanggan</h1>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open)
              if (!open) {
                setEditMode(false)
                setCurrentCustomer({})
                resetForm()
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Pelanggan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editMode ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={currentCustomer.name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customer_type">Jenis Pelanggan</Label>
                      <Select 
                        value={selectedCustomerType} 
                        onValueChange={setSelectedCustomerType}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="personal">Personal</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                          <SelectItem value="reseller">Reseller</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={currentCustomer.email}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telepon</Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={currentCustomer.phone}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="package_name">Paket Layanan</Label>
                      <Input
                        id="package_name"
                        name="package_name"
                        defaultValue={currentCustomer.package_name}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select name="status" defaultValue={currentCustomer.status || 'active'}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Non-aktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="address">Alamat Detail</Label>
                      <Input
                        id="address"
                        name="address"
                        defaultValue={currentCustomer.address}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="province">Provinsi</Label>
                      <Select 
                        value={selectedProvince} 
                        onValueChange={setSelectedProvince}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Provinsi" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((prov) => (
                            <SelectItem key={prov.id} value={prov.id}>
                              {prov.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regency">Kabupaten/Kota</Label>
                      <Select 
                        value={selectedRegency} 
                        onValueChange={setSelectedRegency}
                        disabled={!selectedProvince}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Kabupaten/Kota" />
                        </SelectTrigger>
                        <SelectContent>
                          {regencies.map((reg) => (
                            <SelectItem key={reg.id} value={reg.id}>
                              {reg.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="district">Kecamatan</Label>
                      <Select 
                        value={selectedDistrict} 
                        onValueChange={setSelectedDistrict}
                        disabled={!selectedRegency}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Kecamatan" />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.map((dist) => (
                            <SelectItem key={dist.id} value={dist.id}>
                              {dist.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="village">Kelurahan/Desa</Label>
                      <Select 
                        value={selectedVillage} 
                        onValueChange={setSelectedVillage}
                        disabled={!selectedDistrict}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Kelurahan/Desa" />
                        </SelectTrigger>
                        <SelectContent>
                          {villages.map((vill) => (
                            <SelectItem key={vill.id} value={vill.id}>
                              {vill.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-4">Dokumen Pendukung (Opsional)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {renderFileUpload('ktp', 'KTP', ktpFile)}
                      
                      {(selectedCustomerType === 'corporate' || selectedCustomerType === 'reseller') && 
                        renderFileUpload('npwp', 'NPWP', npwpFile)
                      }
                      
                      {selectedCustomerType === 'reseller' && (
                        <>
                          {renderFileUpload('nib', 'NIB', nibFile)}
                          {renderFileUpload('sertifikat', 'Sertifikat Standar', sertifikatFile)}
                        </>
                      )}
                    </div>
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

          <Card>
            <CardHeader>
              <CardTitle>Daftar Pelanggan</CardTitle>
              <div className="flex items-center gap-2 mt-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari berdasarkan nama, email, atau telepon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Paket</TableHead>
                      <TableHead>Wilayah</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Tidak ada data pelanggan
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {customer.customer_type === 'personal' ? 'Personal' : 
                               customer.customer_type === 'corporate' ? 'Corporate' : 'Reseller'}
                            </Badge>
                          </TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell className="font-mono">{customer.phone}</TableCell>
                          <TableCell>{customer.package_name}</TableCell>
                          <TableCell className="text-sm">
                            {customer.village_name ? (
                              <div className="space-y-1">
                                <div>{customer.village_name}</div>
                                <div className="text-muted-foreground">
                                  {customer.district_name}, {customer.regency_name}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                              {customer.status === 'active' ? 'Aktif' : 'Non-aktif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(customer)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(customer.id)}
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
      </AppLayout>
    </ProtectedRoute>
  )
}