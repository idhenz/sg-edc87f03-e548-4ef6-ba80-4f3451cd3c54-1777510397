# Activation & Auto-Generate Invoice Schema

## Business Logic: Auto-Generate Invoice saat Aktivasi

Ketika pelanggan diaktivasi (action_type = 'activation'), sistem akan otomatis membuat 2 invoice:

### 1. Invoice OTC (One Time Charge)
- **Jenis:** Biaya registrasi awal
- **Amount:** Input manual dari user (opsional)
- **Due Date:** 7 hari dari tanggal aktivasi
- **Invoice Number Format:** INV-OTC-YYYYMM-XXXX
- **Status:** pending

### 2. Invoice MRC (Monthly Recurring Charge) - Prorata
- **Jenis:** Tagihan bulanan bulan pertama (prorata)
- **Amount:** Dihitung otomatis berdasarkan rumus prorata
- **Due Date:** Akhir bulan aktivasi
- **Invoice Number Format:** INV-MRC-YYYYMM-XXXX
- **Status:** pending

## Rumus Prorata MRC

```
Total Hari Bulan = jumlah hari di bulan aktivasi (28-31)
Tanggal Aktivasi = tanggal pelanggan mulai berlangganan
Sisa Hari = (Akhir Bulan - Tanggal Aktivasi) + 1

Harga per Hari = Harga Paket / Total Hari Bulan
MRC Prorata = Harga per Hari × Sisa Hari
```

### Contoh Perhitungan:
```
Paket: Rp 500.000/bulan
Tanggal Aktivasi: 15 Januari 2026
Total Hari Januari: 31 hari
Sisa Hari: (31 - 15) + 1 = 17 hari

Harga per Hari: 500.000 / 31 = Rp 16.129
MRC Prorata: 16.129 × 17 = Rp 274.193

Invoice yang dibuat:
1. OTC: Rp (input manual), due 22 Jan 2026
2. MRC: Rp 274.193, due 31 Jan 2026
```

## Database Update Required

Tambahkan kolom `invoice_type` di tabel `invoices_outgoing`:

```sql
ALTER TABLE invoices_outgoing 
ADD COLUMN invoice_type VARCHAR(20) DEFAULT 'MRC' 
COMMENT 'OTC (One Time Charge) or MRC (Monthly Recurring Charge)';
```

## API Endpoint

**POST /api/activations**

Request Body:
```json
{
  "customer_id": 1,
  "product_id": 2,
  "vendor_id": 3,
  "action_type": "activation",
  "activation_date": "2026-01-15",
  "notes": "Pelanggan baru",
  "otc_amount": 150000
}
```

Response:
```json
{
  "message": "Aktivasi berhasil direkam dan invoice telah dibuat"
}
```

## Frontend Preview

Dialog aktivasi akan menampilkan:
- Input "Biaya Registrasi / OTC" (format Rupiah)
- Preview perhitungan MRC prorata real-time:
  - Total hari bulan ini
  - Sisa hari (termasuk aktivasi)
  - Harga per hari
  - Total MRC Bulan Pertama

User bisa melihat preview invoice sebelum submit.