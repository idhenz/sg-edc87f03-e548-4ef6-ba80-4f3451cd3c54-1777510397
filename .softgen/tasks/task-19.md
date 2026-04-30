---
title: Sinkronisasi Data PPPoE
status: todo
priority: high
type: feature
tags:
  - mikrotik
  - pppoe
  - sync
created_by: agent
created_at: 2026-04-30T11:56:00Z
position: 19
---

## Notes
Menarik data akun PPPoE dari MikroTik menggunakan command `/ppp/secret/print` dan mencocokkan status online menggunakan `/ppp/active/print`. Data ini harus disalin ke database MySQL lokal agar aplikasi dapat memprosesnya tanpa membebani router dengan request API terus-menerus.

## Checklist
- [ ] Buat halaman daftar "PPPoE Secrets" yang menampilkan akun-akun PPPoE (Username, Profile, Local Address, Remote Address)
- [ ] Tambahkan tombol "Sync PPPoE" yang ketika ditekan akan menarik data terbaru dari MikroTik API dan memperbarui data di database lokal
- [ ] Tampilkan indikator status visual (misal: badge Hijau/Merah) untuk menandakan apakah akun PPPoE tersebut sedang "Active" (online) saat ini
- [ ] Buat API endpoint khusus yang menangani koneksi node-routeros ke MikroTik untuk mengambil data ppp secret dan ppp active
- [ ] Buat dokumentasi skema database baru (tabel `pppoe_secrets`) di dalam folder docs