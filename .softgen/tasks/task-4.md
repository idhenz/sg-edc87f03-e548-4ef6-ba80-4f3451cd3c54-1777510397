---
title: Invoicing System
status: todo
priority: high
type: feature
tags: [finance, billing]
created_by: softgen
---

## Notes
Pusat pencatatan keuangan. Terdiri dari Invoice Keluar (tagihan internet ke pelanggan) dan Invoice Masuk (tagihan dari supplier/pembelian alat). Harus mendukung visualisasi status pembayaran yang jelas.

## Checklist
- [ ] Halaman Invoice Keluar (Tagihan Pelanggan): Tabel daftar tagihan dengan badge status (Lunas, Belum Bayar, Jatuh Tempo).
- [ ] Form pembuatan Invoice Keluar: Pilihan pelanggan, pilihan layanan/produk, periode tagihan, diskon, pajak, dan total.
- [ ] Halaman detail Invoice Keluar dengan tampilan struk/nota yang siap dicetak (Print view) atau disimpan sebagai PDF.
- [ ] Halaman Invoice Masuk (Pembelian/Pengeluaran): Tabel daftar tagihan dari pihak ketiga (pembelian kabel, sewa tiang, bandwidth, dll).
- [ ] Form pencatatan Invoice Masuk dengan unggah bukti bayar (jika diperlukan) atau pencatatan nomor referensi.
- [ ] Fitur ubah status pembayaran (Tandai Lunas) pada setiap invoice.

## Acceptance
- Invoice baru bisa dibuat dan dikaitkan dengan data pelanggan/produk yang ada.
- Detail tagihan bisa dilihat dalam format dokumen yang rapi dan siap cetak.