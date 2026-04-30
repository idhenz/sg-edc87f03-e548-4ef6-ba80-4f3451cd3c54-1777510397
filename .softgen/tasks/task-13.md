---
title: Partial Payment & Payment History
status: todo
priority: high
type: feature
tags: [payment, partial, history, invoice]
created_by: agent
created_at: 2026-04-30
position: 13
---

## Notes
Implementasi sistem pembayaran parsial dan dialog detail pembayaran untuk Invoice Keluar.

**Skenario Pembayaran Parsial:**
- Invoice Rp 100.000
- Bayar Rp 50.000 → Status "Lunas Sebagian" (badge orange)
- Bayar Rp 50.000 lagi → Status "Lunas" (badge green)
- Multiple pembayaran per invoice sampai lunas
- Tampilkan sisa tagihan dan history pembayaran

**Dialog Detail Pembayaran:**
- Klik status "Lunas" atau "Lunas Sebagian" → muncul dialog
- Tampilkan bukti transfer (gambar/PDF embedded)
- Tampilkan detail pembayaran (bank, nominal, tanggal, pengirim)
- Tampilkan history semua pembayaran (jika partial payment)

**Database Update Required:**
User harus jalankan SQL ini di MySQL database:
```sql
ALTER TABLE invoices_outgoing 
ADD COLUMN paid_amount DECIMAL(15,2) DEFAULT 0.00 AFTER amount;
```

## Checklist
- [ ] Update API `/api/payments/confirm.ts`:
  - Get current invoice amount & paid_amount
  - Calculate new paid_amount = current + new payment
  - Validate overpayment (new paid_amount > total amount)
  - Update status logic: pending → partial → paid
  - Update invoice: SET paid_amount = X, status = Y
  - Return remaining balance dan new status
- [ ] Buat API `/api/payments/history.ts`:
  - GET endpoint dengan query param invoice_id
  - JOIN payment_confirmations dengan banks dan users
  - Return array of payments dengan detail bank & admin konfirmator
- [ ] Update halaman `/invoices/outgoing.tsx`:
  - Update Badge component untuk support 3 status (pending=gray, partial=orange, paid=green)
  - Tambahkan onClick handler di badge status "Lunas" dan "Lunas Sebagian"
  - Buat Dialog "Detail Pembayaran":
    - Tampilkan bukti transfer (gambar dengan zoom, PDF dengan embed)
    - Tampilkan detail: bank tujuan, nominal, tanggal, pengirim, catatan
    - Tampilkan table history pembayaran (jika partial payment)
    - Tampilkan sisa tagihan jika status partial
  - Update Dialog Konfirmasi Pembayaran:
    - Show remaining balance di atas form
    - Validate input nominal tidak melebihi sisa tagihan
- [ ] Update statistics calculation:
  - Total Terbayar = sum(paid_amount) untuk semua invoice
  - Total Belum Bayar = sum(amount - paid_amount) untuk invoice pending + partial
- [ ] Test partial payment flow:
  - Invoice Rp 100.000
  - Bayar Rp 30.000 → status partial, sisa Rp 70.000
  - Bayar Rp 70.000 → status paid, sisa Rp 0
- [ ] Test payment history dialog:
  - Klik badge "Lunas Sebagian" → muncul dialog
  - Tampilkan 2 pembayaran di table
  - Bukti transfer muncul dengan benar

## Acceptance
- User bisa melakukan pembayaran bertahap pada satu invoice (partial payment)
- Status invoice otomatis berubah: pending → partial → paid
- User bisa klik status "Lunas"/"Lunas Sebagian" untuk melihat detail pembayaran lengkap
- Bukti transfer (gambar/PDF) tampil dengan jelas di dialog
- History pembayaran tampil lengkap untuk invoice yang dibayar bertahap
- Card statistik menghitung dengan benar (Terbayar = sum paid_amount, Belum Bayar = sum remaining)