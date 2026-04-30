---
title: Integrasi PPPoE Pelanggan
status: done
priority: high
type: feature
tags:
  - crm
  - customers
  - pppoe
created_by: agent
created_at: 2026-04-30T11:56:00Z
position: 20
---

## Notes
Setiap pelanggan di sistem manajemen operasional harus memiliki relasi 1-to-1 dengan akun PPPoE yang ditarik dari MikroTik. Ini memungkinkan admin melihat pemakaian atau status koneksi pelanggan langsung dari profil pelanggan tersebut.

## Checklist
- [x] Tambahkan dropdown "Pilih Akun PPPoE" pada form tambah dan edit Pelanggan, yang datanya bersumber dari tabel PPPoE tersinkronisasi
- [x] Pastikan satu akun PPPoE yang sudah dikaitkan tidak bisa dipilih lagi oleh pelanggan lain (validasi 1-to-1)
- [x] Tambahkan kolom "PPPoE Username" dan "Status Online" pada tabel utama daftar Pelanggan
- [x] Pada tampilan Detail Pelanggan, tampilkan informasi teknis koneksi (IP Address PPPoE dan Uptime terakhir jika memungkinkan)