# Payment Confirmation System Schema

## Tabel 1: banks

Menyimpan data rekening bank perusahaan yang digunakan untuk menerima pembayaran.

```sql
CREATE TABLE banks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bank_name VARCHAR(100) NOT NULL COMMENT 'Nama Bank (BCA, Mandiri, BNI, dll)',
  account_number VARCHAR(50) NOT NULL COMMENT 'Nomor Rekening',
  account_holder VARCHAR(150) NOT NULL COMMENT 'Nama Pemilik Rekening',
  branch VARCHAR(100) DEFAULT NULL COMMENT 'Cabang Bank (opsional)',
  is_active TINYINT(1) DEFAULT 1 COMMENT '1 = Aktif, 0 = Nonaktif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Tabel 2: payment_confirmations

Menyimpan bukti pembayaran yang diupload pelanggan/admin untuk konfirmasi invoice.

```sql
CREATE TABLE payment_confirmations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL COMMENT 'FK ke invoices_outgoing.id',
  bank_id INT NOT NULL COMMENT 'FK ke banks.id - Bank tujuan pembayaran',
  payment_date DATE NOT NULL COMMENT 'Tanggal pembayaran (dari bukti transfer)',
  amount DECIMAL(15,2) NOT NULL COMMENT 'Jumlah yang dibayarkan',
  transfer_proof_url VARCHAR(500) DEFAULT NULL COMMENT 'URL bukti transfer (PDF/gambar) di Biznet GIO',
  notes TEXT DEFAULT NULL COMMENT 'Catatan tambahan (opsional)',
  confirmed_by INT DEFAULT NULL COMMENT 'FK ke users.id - Admin yang mengkonfirmasi',
  confirmed_at TIMESTAMP DEFAULT NULL COMMENT 'Waktu konfirmasi',
  status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending' COMMENT 'Status konfirmasi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices_outgoing(id) ON DELETE CASCADE,
  FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Workflow Konfirmasi Pembayaran

1. **User upload bukti transfer:**
   - Pilih invoice yang akan dibayar
   - Pilih bank tujuan transfer
   - Input tanggal transfer
   - Input nominal yang dibayar
   - Upload bukti (PDF/JPG/PNG) → langsung ke Biznet GIO Storage
   - Submit

2. **Admin verifikasi:**
   - Lihat list konfirmasi pembayaran dengan status "pending"
   - Download/lihat bukti transfer
   - Verifikasi nominal dan tanggal
   - Klik "Terima" atau "Tolak"

3. **Auto-update status invoice:**
   - Jika konfirmasi di-approve (status = verified) → invoice status berubah menjadi "paid"
   - Jika ditolak (status = rejected) → invoice tetap "pending"

## Sample Data

```sql
INSERT INTO banks (bank_name, account_number, account_holder, branch, is_active) VALUES
('BCA', '1234567890', 'PT ISP INDONESIA', 'KCP Jakarta Pusat', 1),
('Mandiri', '9876543210', 'PT ISP INDONESIA', 'Cabang Jakarta', 1),
('BNI', '5555666677', 'PT ISP INDONESIA', NULL, 1);
```