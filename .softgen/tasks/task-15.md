---
title: PDF Preview Modal untuk Invoice
status: done
priority: urgent
type: feature
tags: [invoice, pdf, modal, preview]
created_by: agent
created_at: 2026-04-30
position: 15
---

## Notes
User klik icon Print pada tabel Invoice Keluar, muncul modal yang menampilkan preview PDF invoice. Saat ini ada 2 masalah:
1. API `/api/invoices/outgoing.ts` belum support fetch single invoice dengan data lengkap (JOIN customers & products)
2. Belum ada modal preview PDF - masih buka tab baru `/invoices/print/[id]`

Library sudah terinstall: jspdf, html2canvas

## Checklist
- [x] Fix API `/api/invoices/outgoing.ts`:
  - GET dengan query param `id` harus JOIN dengan tabel `customers` dan `products`
  - Return data lengkap: invoice + customer_name + package_name + company settings
  - Handle case invoice tidak ditemukan (404)
- [x] Update halaman `/invoices/outgoing.tsx`:
  - Install & import jspdf dan html2canvas
  - Buat state `showPdfModal` dan `selectedInvoiceForPdf`
  - Buat fungsi `generatePDF()` yang:
    * Fetch invoice data + settings (logo, company info, banks)
    * Render HTML invoice template dalam hidden div
    * Convert HTML to Canvas menggunakan html2canvas
    * Generate PDF dari canvas menggunakan jspdf
    * Return PDF blob untuk preview
  - Buat Dialog component untuk preview PDF:
    * Header dengan tombol Download & Print
    * iframe atau embed untuk preview PDF blob
    * Footer dengan info invoice
  - Update tombol Print di tabel untuk buka modal (bukan new tab)
- [x] Template PDF harus include:
  - Logo perusahaan & company info dari settings
  - Invoice number, customer, package, dates
  - Tabel rincian tagihan dengan total
  - Status pembayaran (Pending/Partial/Paid) dengan watermark
  - Daftar bank accounts untuk pembayaran
  - Format A4 portrait ready-to-print

## Acceptance
- User klik icon Print pada invoice, muncul modal preview PDF
- PDF ter-generate dengan benar menampilkan semua detail invoice
- User bisa download PDF atau langsung print dari modal
- Error handling jika invoice tidak ditemukan