---
title: Invoice PDF Preview & Export
status: in_progress
priority: high
type: feature
tags: [invoice, pdf, print, export]
created_by: agent
created_at: 2026-04-30
position: 14
---

## Notes
Menambahkan fitur untuk preview dan export invoice keluar ke dalam bentuk PDF menggunakan standard browser print API.
Desain invoice akan disesuaikan untuk ukuran kertas A4.

## Checklist
- [ ] Buat halaman khusus print di `src/pages/invoices/print/[id].tsx`
- [ ] Update API `/api/invoices/outgoing.ts` untuk mendukung fetch 1 invoice berdasarkan `id`
- [ ] Desain template invoice (Kop Perusahaan, Detail Pelanggan, Rincian Paket, Total, Status Lunas/Partial, Info Bank)
- [ ] Tambahkan tombol `Print / Export PDF` di halaman `outgoing.tsx` pada masing-masing baris tabel
- [ ] Implementasi auto-print / media print CSS agar rapi saat disimpan sebagai PDF

## Acceptance
- User bisa mengklik icon Print di tabel Invoice Keluar
- Terbuka tab baru yang menampilkan desain invoice profesional
- Bisa langsung disimpan sebagai PDF menggunakan dialog Print browser
- Data di invoice sesuai dengan database (termasuk status pembayaran parsial)