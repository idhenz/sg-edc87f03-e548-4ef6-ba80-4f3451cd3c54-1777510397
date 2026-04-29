import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/AppLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Eye, Edit, Trash2, FileText } from 'lucide-react'

interface IncomingMail {
  id: number
  letter_number: string
  sender: string
  subject: string
  received_date: string
  category: string
  status: string
}

export default function IncomingMailsPage() {
  const [mails, setMails] = useState<IncomingMail[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMails()
  }, [])

  const fetchMails = async () => {
    try {
      const res = await fetch('/api/mails/incoming')
      if (res.ok) {
        const data = await res.json()
        setMails(data.mails || [])
      }
    } catch (error) {
      console.error('Failed to fetch mails:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMails = mails.filter(mail =>
    mail.letter_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mail.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mail.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      archived: 'default',
      pending: 'secondary',
      urgent: 'destructive',
    }
    const labels: Record<string, string> = {
      archived: 'Diarsipkan',
      pending: 'Proses',
      urgent: 'Mendesak',
    }
    return <Badge variant={variants[status] || 'secondary'}>{labels[status] || status}</Badge>
  }

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Surat Masuk</h1>
              <p className="text-muted-foreground">
                Kelola arsip surat masuk dan dokumen
              </p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Catat Surat Baru
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nomor, pengirim, atau perihal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Memuat data...
                </div>
              ) : filteredMails.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'Tidak ada data yang cocok dengan pencarian' : 'Belum ada surat masuk tercatat'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No. Surat</TableHead>
                        <TableHead>Pengirim</TableHead>
                        <TableHead>Perihal</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Tanggal Terima</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMails.map((mail) => (
                        <TableRow key={mail.id}>
                          <TableCell className="font-mono font-medium">{mail.letter_number}</TableCell>
                          <TableCell>{mail.sender}</TableCell>
                          <TableCell className="max-w-[250px] truncate">{mail.subject}</TableCell>
                          <TableCell className="text-sm">{mail.category}</TableCell>
                          <TableCell className="text-sm">{new Date(mail.received_date).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell>{getStatusBadge(mail.status)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" title="Lihat Detail">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Edit">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Hapus">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}