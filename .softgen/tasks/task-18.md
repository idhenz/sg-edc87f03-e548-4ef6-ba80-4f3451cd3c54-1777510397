---
title: Manajemen Router MikroTik
status: todo
priority: high
type: feature
tags:
  - mikrotik
  - router
  - settings
created_by: agent
created_at: 2026-04-30T11:56:00Z
position: 18
---

## Notes
Aplikasi perlu menyimpan kredensial akses API MikroTik agar bisa berkomunikasi dan menarik data PPPoE. Diperlukan halaman CRUD untuk mendata router (mendukung multi-router jika di masa depan ISP memiliki lebih dari satu router distribusi). Kredensial akan disimpan ke database MySQL.

## Checklist
- [ ] Tambahkan menu "Router" di Sidebar navigasi utama (di bawah grup menu Pengaturan atau Master Data)
- [ ] Buat halaman daftar Router yang menampilkan Nama Router, IP Address, Port, dan Status (Aktif/Tidak)
- [ ] Sediakan form Tambah/Edit Router dengan kolom input: Nama Router, IP Address, API Port (default 8728), Username, dan Password
- [ ] Sediakan fitur validasi/tes koneksi untuk memastikan aplikasi berhasil login ke MikroTik menggunakan kredensial yang dimasukkan
- [ ] Buat dokumentasi skema database baru (tabel `routers`) di dalam folder docs