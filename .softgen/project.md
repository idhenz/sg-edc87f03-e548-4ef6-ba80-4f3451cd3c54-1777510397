---
title: ISP Operational Management
---

## Vision
Aplikasi Management Operasional untuk kantor ISP (Internet Service Provider) yang berfungsi sebagai pusat kendali administrasi, keuangan, dan manajemen pelanggan. Sistem ini mendukung arsitektur multi-role (Admin dan Reseller) dan terkoneksi langsung dengan remote MySQL database milik pengguna.

## Design
Sistem desain menggunakan pendekatan fungsional dan profesional, cocok untuk aplikasi data-heavy (Analyze/Assist).
- `--primary`: 226 70% 40% (Deep Indigo - profesional dan stabil)
- `--background`: 210 40% 98% (Slightly cool slate-white)
- `--foreground`: 222 47% 11% (Deep slate untuk teks utama)
- `--muted`: 210 40% 96% (Abu-abu kebiruan untuk background sekunder/tabel)
- `--accent`: 226 100% 97% (Light indigo untuk hover states)
- **Fonts**: Inter (Heading & Body), dengan Tabular Nums (JetBrains Mono atau default tabular) untuk tabel data dan angka invoice.
- **Style Direction**: Clean, high-density dashboard. Menggunakan card dengan border tipis, shadow minimal, dan kepadatan data menengah untuk memudahkan pembacaan tabel yang panjang.

## Features
- Sistem login dengan Role-Based Access Control (Admin & Reseller).
- Dashboard analitik untuk memantau metrik utama operasional.
- CRM dasar: Manajemen Data Pelanggan dan Data Reseller.
- Sistem Billing: Pencatatan Invoice Masuk (pembelian/pengeluaran) dan Invoice Keluar (tagihan pelanggan).
- Sistem Kearsipan: Pencatatan Surat Masuk dan Surat Keluar.
- Manajemen Produk: Katalog layanan/paket internet.
- Pengaturan: Konfigurasi sistem dan profil perusahaan.
- **Catatan Teknis**: Backend menggunakan Next.js API routes yang terhubung ke remote MySQL menggunakan environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`). Kredensial tidak boleh di-hardcode.

**Status Implementasi**: Semua 6 modul utama sudah dibangun dan siap digunakan. Pastikan database MySQL Anda memiliki tabel yang sesuai dengan struktur query di API routes.