---
title: Riwayat Berlangganan Pelanggan
status: todo
priority: medium
type: feature
tags: [customer, history]
---

## Notes
Menampilkan rekam jejak atau history perubahan paket pada seorang pelanggan dari awal mereka berlangganan, kapan mereka melakukan upgrade, downgrade, hingga berhenti.

## Checklist
- [ ] Buat endpoint API untuk mengambil history aktivasi berdasarkan `customer_id` yang di-join dengan tabel produk dan vendor
- [ ] Tambahkan tombol "Lihat Riwayat" pada baris tabel masing-masing pelanggan
- [ ] Tampilkan Dialog atau Modal yang memuat timeline atau tabel riwayat aktivitas
- [ ] Riwayat harus menampilkan: Tanggal, Jenis Aksi (Baru/Upgrade/Downgrade/Berhenti), Nama Paket, Nama Vendor, dan Catatan

## Acceptance
- Admin dapat melihat kapan pertama kali pelanggan berlangganan
- Riwayat perubahan paket terekam secara kronologis dan mudah dibaca