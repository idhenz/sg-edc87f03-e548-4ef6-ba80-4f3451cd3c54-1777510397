---
title: Sistem Aktivasi Pelanggan
status: todo
priority: high
type: feature
tags: [customer, activation, product]
---

## Notes
Fitur untuk menghubungkan Pelanggan dengan Paket Layanan (Produk) dan Vendor. Ini akan mencatat log ke tabel `activations` dan memperbarui `current_product_id`, `current_vendor_id`, serta `subscription_status` pada pelanggan.

## Checklist
- [ ] Buat endpoint API `/api/activations` untuk memproses aksi aktivasi (mencatat log dan mengupdate tabel customers)
- [ ] Pada halaman Pelanggan, tambahkan tombol aksi "Aktivasi / Ubah Layanan"
- [ ] Buat Dialog Form Aktivasi yang berisi:
  - Pilihan Jenis Aksi (Aktivasi Baru, Upgrade, Downgrade, Berhenti Berlangganan)
  - Pilihan Produk/Paket (Dropdown dari data tabel products)
  - Pilihan Vendor (Dropdown dari data tabel vendors)
  - Tanggal Aktivasi (Date picker)
  - Catatan opsional
- [ ] Update tampilan tabel Pelanggan untuk menampilkan Nama Paket yang sedang aktif dan Status (Aktif/Non-aktif)

## Acceptance
- Admin dapat mengaktifkan paket untuk pelanggan baru
- Admin dapat melakukan upgrade atau downgrade paket dengan mencatat tanggalnya
- Tabel pelanggan menunjukkan pelanggan mana yang sudah memiliki paket aktif