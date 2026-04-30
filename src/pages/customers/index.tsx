import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Pencil, Trash2, FileText, Zap, History, User, Building2, Users, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  address: string
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
  current_product_id?: number
  current_product_name?: string
  current_product_speed?: string
  current_vendor_id?: number
  current_vendor_name?: string
  subscription_status?: string
}

interface Region {
  id: string
  name: string
}

interface Product {
  id: number
  name: string
  speed: string
  price: number
}

interface Vendor {
  id: number
  name: string
}

interface ActivationHistory {
  id: number
  action_type: string
  activation_date: string
  notes: string
  product_name: string
  product_speed: string
  product_price: number
  vendor_name: string
  created_at: string
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({})
  const { toast } = useToast()

  // Filter states
  const [filterProduct, setFilterProduct] = useState<string>('all')
  const [filterVendor, setFilterVendor] = useState<string>('all')
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  // Activation states
  const [activationDialogOpen, setActivationDialogOpen] = useState(false)
  const [activationCustomer, setActivationCustomer] = useState<Customer | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [activationSaving, setActivationSaving] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [activationDate, setActivationDate] = useState<string>('')
  const [otcAmount, setOtcAmount] = useState<string>('')
  const [prorataPreview, setProrataPreview] = useState<{
    totalDays: number
    remainingDays: number
    pricePerDay: number
    proratedAmount: number
  } | null>(null)

  // History states
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null)
  const [activationHistory, setActivationHistory] = useState<ActivationHistory[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/customers', {
        headers: getAuthHeaders()
      })
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
      const res = await fetch('/api/regions/provinces', {
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      setProvinces(data.provinces || [])
    } catch (error) {
      console.error('Failed to fetch provinces:', error)
    }
  }

  const fetchRegencies = async (provinceId: string) => {
    try {
      const res = await fetch(`/api/regions/regencies?province_id=${provinceId}`, {
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      setRegencies(data.regencies || [])
    } catch (error) {
      console.error('Failed to fetch regencies:', error)
    }
  }

  const fetchDistricts = async (regencyId: string) => {
    try {
      const res = await fetch(`/api/regions/districts?regency_id=${regencyId}`, {
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      setDistricts(data.districts || [])
    } catch (error) {
      console.error('Failed to fetch districts:', error)
    }
  }

  const fetchVillages = async (districtId: string) => {
    try {
      const res = await fetch(`/api/regions/villages?district_id=${districtId}`, {
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      setVillages(data.villages || [])
    } catch (error) {
      console.error('Failed to fetch villages:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', {
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchVendors = async () => {
    try {
      const res = await fetch('/api/vendors', {
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      setVendors(data.vendors || [])
    } catch (error) {
      console.error('Failed to fetch vendors:', error)
    }
  }

  const calculateProrataPreview = (productId: string, activationDateStr: string) => {
    if (!productId || !activationDateStr) {
      setProrataPreview(null)
      return
    }

    const product = products.find(p => p.id.toString() === productId)
    if (!product) {
      setProrataPreview(null)
      return
    }

    const activation = new Date(activationDateStr)
    const year = activation.getFullYear()
    const month = activation.getMonth()
    
    // Akhir bulan
    const lastDay = new Date(year, month + 1, 0).getDate()
    const activationDay = activation.getDate()
    
    // Sisa hari (termasuk hari aktivasi)
    const remainingDays = lastDay - activationDay + 1
    
    // Harga per hari
    const pricePerDay = Math.round(product.price / lastDay)
    
    // MRC Prorata
    const proratedAmount = pricePerDay * remainingDays
    
    setProrataPreview({
      totalDays: lastDay,
      remainingDays,
      pricePerDay,
      proratedAmount
    })
  }

  useEffect(() => {
    if (selectedProductId && activationDate) {
      calculateProrataPreview(selectedProductId, activationDate)
    }
  }, [selectedProductId, activationDate, products])

  const fetchActivationHistory = async (customerId: number) => {
    try {
      setHistoryLoading(true)
      const res = await fetch(`/api/activations?customer_id=${customerId}`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      setActivationHistory(data.history || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat riwayat aktivasi',
        variant: 'destructive',
      })
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
    fetchProvinces()
    fetchProducts()
    fetchVendors()
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
    formData.append('type', fileType)

    try {
      setUploadingFile(fileType)
      const token = localStorage.getItem('auth_token')
      const res = await fetch('/api/customers/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Upload failed')
      }

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
        case 'sertifikat_standar':
          setSertifikatFile(data.fileUrl)
          break
      }

      toast({
        title: 'Berhasil',
        description: 'File berhasil diupload',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Gagal mengupload file',
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
        headers: getAuthHeaders(),
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

  const handleActivationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const data = {
      customer_id: activationCustomer?.id,
      product_id: selectedProductId || null,
      vendor_id: formData.get('vendor_id') || null,
      action_type: formData.get('action_type'),
      activation_date: activationDate,
      notes: formData.get('notes'),
      otc_amount: otcAmount ? parseInt(otcAmount.replace(/\./g, '')) : 0,
    }

    try {
      setActivationSaving(true)
      const res = await fetch('/api/activations', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Gagal menyimpan aktivasi')

      toast({
        title: 'Berhasil',
        description: 'Aktivasi berhasil direkam dan invoice telah dibuat',
      })

      setActivationDialogOpen(false)
      setActivationCustomer(null)
      setSelectedProductId('')
      setActivationDate('')
      setOtcAmount('')
      setProrataPreview(null)
      fetchCustomers()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan aktivasi',
        variant: 'destructive',
      })
    } finally {
      setActivationSaving(false)
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
      const res = await fetch(`/api/customers?id=${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      })
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

  const handleActivation = (customer: Customer) => {
    setActivationCustomer(customer)
    setActivationDialogOpen(true)
    setSelectedProductId('')
    setActivationDate('')
    setOtcAmount('')
    setProrataPreview(null)
  }

  const handleViewHistory = (customer: Customer) => {
    setHistoryCustomer(customer)
    setHistoryDialogOpen(true)
    fetchActivationHistory(customer.id)
  }

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'activation':
        return 'Aktivasi Baru'
      case 'upgrade':
        return 'Upgrade'
      case 'downgrade':
        return 'Downgrade'
      case 'termination':
        return 'Berhenti Berlangganan'
      default:
        return type
    }
  }

  const getActionTypeBadge = (type: string) => {
    switch (type) {
      case 'activation':
        return 'default'
      case 'upgrade':
        return 'default'
      case 'downgrade':
        return 'secondary'
      case 'termination':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm)
    
    const matchesProduct = filterProduct === 'all' || 
      (filterProduct === 'none' && !c.current_product_id) ||
      c.current_product_id?.toString() === filterProduct
    
    const matchesVendor = filterVendor === 'all' || 
      (filterVendor === 'none' && !c.current_vendor_id) ||
      c.current_vendor_id?.toString() === filterVendor
    
    return matchesSearch && matchesProduct && matchesVendor
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex)

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
              <Trash2 className="h-4 w-4" />
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
                      <Label>Jenis Pelanggan</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={selectedCustomerType === 'personal' ? 'default' : 'outline'}
                          className="flex-1 flex items-center gap-2"
                          onClick={() => setSelectedCustomerType('personal')}
                        >
                          <User className="h-4 w-4" />
                          Personal
                        </Button>
                        <Button
                          type="button"
                          variant={selectedCustomerType === 'corporate' ? 'default' : 'outline'}
                          className="flex-1 flex items-center gap-2"
                          onClick={() => setSelectedCustomerType('corporate')}
                        >
                          <Building2 className="h-4 w-4" />
                          Corporate
                        </Button>
                        <Button
                          type="button"
                          variant={selectedCustomerType === 'reseller' ? 'default' : 'outline'}
                          className="flex-1 flex items-center gap-2"
                          onClick={() => setSelectedCustomerType('reseller')}
                        >
                          <Users className="h-4 w-4" />
                          Reseller
                        </Button>
                      </div>
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
                          {renderFileUpload('sertifikat_standar', 'Sertifikat Standar', sertifikatFile)}
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
              <div className="flex items-center gap-3 mt-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterProduct} onValueChange={setFilterProduct}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter Paket Layanan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Paket</SelectItem>
                    <SelectItem value="none">Belum Ada Paket</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterVendor} onValueChange={setFilterVendor}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Vendor</SelectItem>
                    <SelectItem value="none">Belum Ada Vendor</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id.toString()}>
                        {vendor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(filterProduct !== 'all' || filterVendor !== 'all') && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setFilterProduct('all')
                      setFilterVendor('all')
                    }}
                  >
                    Reset Filter
                  </Button>
                )}
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
                      <TableHead>Paket Aktif</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Tidak ada data pelanggan
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCustomers.map((customer) => (
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
                          <TableCell>
                            {customer.current_product_name ? (
                              <div className="text-sm">
                                <div className="font-medium">{customer.current_product_name}</div>
                                <div className="text-muted-foreground">{customer.current_product_speed}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Belum aktif</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={customer.subscription_status === 'active' ? 'default' : 'secondary'}>
                              {customer.subscription_status === 'active' ? 'Aktif' : 'Non-aktif'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleActivation(customer)}
                                title="Aktivasi / Ubah Paket"
                              >
                                <Zap className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewHistory(customer)}
                                title="Lihat Riwayat"
                              >
                                <History className="h-4 w-4" />
                              </Button>
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
              
              {filteredCustomers.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Menampilkan {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} dari {filteredCustomers.length} pelanggan
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      ) : (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page as number)}
                          className="min-w-[36px]"
                        >
                          {page}
                        </Button>
                      )
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activation Dialog */}
          <Dialog open={activationDialogOpen} onOpenChange={setActivationDialogOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Aktivasi / Ubah Paket Layanan</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleActivationSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Pelanggan</Label>
                  <Input value={activationCustomer?.name || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action_type">Jenis Aksi *</Label>
                  <Select name="action_type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jenis aksi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activation">Aktivasi Baru</SelectItem>
                      <SelectItem value="upgrade">Upgrade Paket</SelectItem>
                      <SelectItem value="downgrade">Downgrade Paket</SelectItem>
                      <SelectItem value="termination">Berhenti Berlangganan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product_id">Paket Layanan</Label>
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih paket (opsional untuk berhenti)" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - {product.speed} - Rp {product.price.toLocaleString('id-ID')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor_id">Vendor</Label>
                  <Select name="vendor_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih vendor (opsional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id.toString()}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activation_date">Tanggal Aktivasi *</Label>
                  <Input
                    id="activation_date"
                    type="date"
                    value={activationDate}
                    onChange={(e) => setActivationDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otc_amount">Biaya Registrasi / OTC (Opsional)</Label>
                  <Input
                    id="otc_amount"
                    type="text"
                    placeholder="0"
                    value={otcAmount}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '')
                      const formatted = value.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                      setOtcAmount(formatted)
                    }}
                  />
                  {otcAmount && (
                    <p className="text-sm text-muted-foreground">
                      Rp {parseInt(otcAmount.replace(/\./g, '')).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
                
                {prorataPreview && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="font-semibold text-sm">Preview Invoice MRC (Prorata):</p>
                    <div className="text-sm space-y-1">
                      <p>Total hari bulan ini: {prorataPreview.totalDays} hari</p>
                      <p>Sisa hari (termasuk aktivasi): {prorataPreview.remainingDays} hari</p>
                      <p>Harga per hari: Rp {prorataPreview.pricePerDay.toLocaleString('id-ID')}</p>
                      <p className="font-semibold pt-2 border-t">
                        Total MRC Bulan Pertama: Rp {prorataPreview.proratedAmount.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    placeholder="Catatan tambahan (opsional)"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setActivationDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={activationSaving}>
                    {activationSaving ? 'Menyimpan...' : 'Simpan Aktivasi'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* History Dialog */}
          <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Riwayat Berlangganan - {historyCustomer?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {historyLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Memuat riwayat...</div>
                ) : activationHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Belum ada riwayat aktivasi
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activationHistory.map((history) => (
                      <Card key={history.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={getActionTypeBadge(history.action_type) as any}>
                                  {getActionTypeLabel(history.action_type)}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(history.activation_date).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                              {history.product_name && (
                                <div className="space-y-1">
                                  <div className="font-medium">{history.product_name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {history.product_speed} • Rp {new Intl.NumberFormat('id-ID').format(history.product_price)}
                                  </div>
                                </div>
                              )}
                              {history.vendor_name && (
                                <div className="text-sm text-muted-foreground">
                                  Vendor: {history.vendor_name}
                                </div>
                              )}
                              {history.notes && (
                                <div className="text-sm text-muted-foreground italic">
                                  {history.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}