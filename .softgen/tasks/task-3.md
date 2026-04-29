---
title: Customer and Reseller Management
status: done
priority: high
type: feature
tags: [crm, customers, resellers]
created_by: softgen
---

## Notes
Dua halaman terpisah untuk mengelola data pelanggan dan reseller. Keduanya memiliki fitur pencarian dan pagination (jika data besar). Admin bisa melihat kedua halaman, sementara Reseller hanya melihat data pelanggannya sendiri.

## Checklist
- [x] Halaman Pelanggan dengan tabel yang menampilkan: Nama, Email, Telepon, Alamat, Paket Aktif, Status (Aktif/Non-aktif).
- [x] Fitur pencarian pelanggan berdasarkan nama, email, atau telepon.
- [x] Tombol aksi untuk Edit dan Hapus pelanggan (edit membuka form modal atau halaman baru).
- [x] Halaman Reseller (khusus Admin) dengan tabel: Nama, Perusahaan, Email, Telepon, Jumlah Pelanggan, Status.
- [x] Fitur pencarian reseller.
- [x] Role filter: Reseller hanya melihat pelanggan yang dimilikinya sendiri, sedangkan Admin melihat semua.

## Acceptance
- Admin dapat menambah, mengubah, melihat, dan mencari data pelanggan dan reseller.
- Tabel data memiliki navigasi halaman (pagination) yang rapi.