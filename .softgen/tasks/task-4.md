---
title: Invoicing System
status: done
priority: high
type: feature
tags: [finance, billing]
created_by: softgen
---

## Notes
Dua modul invoice: satu untuk mencatat pembelian/pengeluaran (Invoice Masuk), dan satu lagi untuk tagihan pelanggan (Invoice Keluar). Keduanya memiliki status pembayaran (Pending, Paid, Overdue).

## Checklist
- [x] Halaman Invoice Masuk dengan tabel: Nomor Invoice, Vendor, Deskripsi, Tanggal, Jumlah, Status Pembayaran.
- [x] Halaman Invoice Keluar dengan tabel: Nomor Invoice, Nama Pelanggan, Paket Layanan, Tanggal Jatuh Tempo, Jumlah, Status.
- [x] Filter pencarian berdasarkan nomor invoice atau nama vendor/pelanggan.
- [x] Aksi untuk melihat detail, edit, dan hapus invoice.
- [x] Tombol "Buat Invoice" di Invoice Keluar yang membuka form pembuatan invoice baru untuk pelanggan dan produk yang ada.

## Acceptance
- Invoice baru bisa dibuat dan dikaitkan dengan data pelanggan/produk yang ada.
- Detail tagihan bisa dilihat dalam format dokumen yang rapi dan siap cetak.