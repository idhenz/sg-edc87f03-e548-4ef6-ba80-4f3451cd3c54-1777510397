---
title: Riwayat Kontrak dan MOU Vendor
status: todo
priority: high
type: feature
tags: [vendor, history, document]
---

## Notes
Sistem untuk melacak riwayat kerjasama (kontrak/MOU) antara ISP dengan Vendor. Satu vendor bisa memiliki banyak riwayat kontrak dari waktu ke waktu. Dokumen MOU akan diunggah dan disimpan di storage lokal server.

## Checklist
- [ ] Buat endpoint API `/api/vendors/mous/index.ts` untuk operasi GET, POST, dan DELETE riwayat MOU berdasarkan `vendor_id`
- [ ] Buat endpoint API `/api/vendors/mous/upload.ts` untuk menangani unggahan file MOU ke folder `public/uploads/vendors/`
- [ ] Pada halaman Manajemen Vendor, tambahkan tombol "Riwayat Kontrak" di setiap baris tabel
- [ ] Buat Modal/Dialog Riwayat Kontrak yang menampilkan daftar MOU dalam bentuk tabel
- [ ] Implementasikan indikator status dinamis: munculkan badge "Aktif" (Hijau) jika tanggal hari ini <= `end_date`, dan "Expired" (Merah) jika tanggal hari ini > `end_date`
- [ ] Buat Form untuk "Tambah Kontrak Baru" yang mencakup field: Nomor MOU, Tanggal MOU, Tanggal Mulai, Tanggal Berakhir, dan Upload File (opsional)

## Acceptance
- Pengguna dapat melihat daftar lengkap kontrak per vendor.
- Status Aktif/Expired terhitung otomatis berdasarkan masa berlaku (`end_date`).
- File MOU berhasil diunggah, tersimpan, dan dapat dibuka kembali/diunduh.