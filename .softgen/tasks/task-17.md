---
title: Tambahkan Tanggal Invoice
status: done
priority: medium
type: feature
tags: [invoice, pdf, table]
created_by: agent
created_at: 2026-04-30
position: 17
---

## Notes
Saat ini tabel dan PDF hanya menampilkan "Tanggal Jatuh Tempo" (due_date). User meminta agar "Tanggal Invoice" juga ditampilkan. Kita akan menggunakan kolom `created_at` dari tabel `invoices_outgoing` sebagai Tanggal Invoice.

## Checklist
- [x] Update interface `Invoice` di `src/pages/invoices/outgoing.tsx` untuk menyertakan `created_at`
- [x] Tambahkan kolom "Tanggal Invoice" pada header tabel Invoice Keluar
- [x] Tampilkan `created_at` (format id-ID) pada baris tabel (gunakan fallback '-' jika kosong)
- [x] Tambahkan baris "Tanggal: [tanggal_invoice]" di template HTML untuk generator PDF (di atas baris Tgl Jatuh Tempo)

## Acceptance
- Tanggal invoice muncul di tabel utama Invoice Keluar
- Tanggal invoice muncul tercetak di dokumen PDF saat tombol Print di-klik