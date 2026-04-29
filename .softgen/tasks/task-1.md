---
title: Authentication and Role Management
status: todo
priority: urgent
type: feature
tags: [auth, mysql]
created_by: softgen
---

## Notes
Modul ini menangani antarmuka login dan sistem sesi untuk pengguna. Karena menggunakan database MySQL remote, verifikasi login akan dilakukan melalui API yang mengecek kredensial ke database. Aplikasi harus bisa membedakan antara sesi Admin dan sesi Reseller, dan mengarahkan mereka ke tampilan yang sesuai.

## Checklist
- [x] Halaman Login dengan form email/username dan password, dilengkapi desain responsif bergaya korporat.
- [x] Pesan error yang informatif jika kredensial salah atau koneksi database gagal.
- [x] Mekanisme proteksi halaman (middleware/wrapper) yang mencegah akses ke dashboard tanpa login.
- [x] Penanganan Role (RBAC): Admin memiliki akses penuh, sedangkan Reseller diarahkan ke versi dashboard yang lebih terbatas (hanya melihat data milik mereka).
- [x] Tombol Logout di antarmuka utama yang menghapus sesi dan mengembalikan pengguna ke halaman login.

## Acceptance
- Pengguna bisa login dan sistem mengenali apakah mereka Admin atau Reseller.
- Pengguna yang belum login tidak bisa membuka halaman dashboard apa pun.