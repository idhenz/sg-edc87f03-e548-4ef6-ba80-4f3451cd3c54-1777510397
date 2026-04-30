---
title: Payment Confirmation System
status: in_progress
priority: high
type: feature
tags: [payment, invoice, bank, upload]
created_by: agent
created_at: 2026-04-30
position: 12
---

## Notes
Sistem konfirmasi pembayaran untuk invoice keluar. Admin/pelanggan bisa upload bukti transfer, pilih bank tujuan, dan sistem otomatis update status invoice dari "pending" ke "paid" setelah verifikasi.

## Checklist
- [x] Buat schema SQL untuk tabel `banks` dan `payment_confirmations`
- [x] Buat API `/api/banks` untuk CRUD data bank
- [x] Buat halaman Bank Management di `/banks/index.tsx`
- [ ] User membuat tabel `banks` di MySQL database
- [ ] Buat tabel `payment_confirmations` di database
- [ ] Buat API `/api/payments/confirm` untuk upload bukti + konfirmasi
- [ ] Buat API `/api/payments/verify` untuk admin verifikasi pembayaran
- [ ] Update halaman Invoice Keluar dengan tombol "Konfirmasi Pembayaran"
- [ ] Buat dialog konfirmasi pembayaran (pilih bank, upload bukti, input nominal)
- [ ] Test upload bukti transfer ke Biznet GIO
- [ ] Test auto-update status invoice setelah verifikasi

## Acceptance
- Admin bisa mengelola data bank (tambah, edit, hapus) di halaman Bank Management
- User bisa upload bukti transfer di halaman Invoice Keluar untuk invoice dengan status "pending"
- Bukti transfer tersimpan di Biznet GIO dan URL-nya tersimpan di database
- Setelah admin verifikasi, status invoice otomatis berubah menjadi "paid"