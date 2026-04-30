---
title: Perbesar Tinggi Modal Preview PDF
status: done
priority: low
type: chore
tags: [ui, pdf, modal]
created_by: agent
created_at: 2026-04-30
position: 16
---

## Notes
User mengeluhkan tinggi iframe PDF preview di dalam modal terlalu rendah sehingga sulit dibaca.
Perlu mengubah class height dari iframe dan container-nya di `src/pages/invoices/outgoing.tsx`.

## Checklist
- [ ] Buka `src/pages/invoices/outgoing.tsx`
- [ ] Ubah height iframe dan placeholder dari default/sebelumnya menjadi `h-[80vh]` atau `h-[85vh]` agar lebih tinggi.
- [ ] Pastikan `max-h` di `DialogContent` menampung ukuran tersebut (misalnya `max-h-[95vh]`).

## Acceptance
- Popup preview PDF tampil lebih tinggi dan proporsional untuk membaca dokumen ukuran A4.