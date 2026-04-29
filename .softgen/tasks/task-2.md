---
title: Main Dashboard and Layout Structure
status: done
priority: high
type: feature
tags: [layout, dashboard]
created_by: softgen
---

## Notes
Pembuatan kerangka utama aplikasi yang akan membungkus semua halaman operasional. Layout ini harus memiliki navigasi yang intuitif untuk berpindah antar modul dengan cepat.

## Checklist
- [x] Setup desain sistem (warna Indigo, font, dan utilitas tabel) pada konfigurasi tema.
- [x] Sidebar navigasi (collapsible di desktop, drawer di mobile) dengan menu: Dashboard, Pelanggan, Reseller, Produk, Invoice (Masuk & Keluar), Surat (Masuk & Keluar), dan Pengaturan.
- [x] Header atas yang menampilkan nama pengguna aktif, role (Admin/Reseller), dan menu dropdown profil.
- [x] Halaman Dashboard Utama dengan 4-6 kartu ringkasan/metrik (contoh: Total Pelanggan, Pendapatan Bulan Ini, Total Invoice Belum Dibayar, Jumlah Reseller Aktif).
- [x] Filter menu pada Sidebar berdasarkan role (misal: Reseller mungkin tidak melihat menu Pengaturan Sistem atau Surat Masuk internal).

## Acceptance
- Tata letak konsisten di seluruh halaman dengan navigasi yang berfungsi penuh.
- Sidebar responsif (berubah menjadi menu hamburger di layar kecil).