---
title: Migrasi Upload File ke Biznet GIO S3
status: done
priority: urgent
type: feature
tags: [upload, storage, biznet, s3]
created_by: agent
created_at: 2026-04-29
position: 11
---

## Notes
Migrasi semua fungsi upload file dari Google Drive ke Biznet GIO Object Storage (S3-compatible). Fokus pada modul Customers dan Vendors yang memiliki fitur upload dokumen.

Credentials sudah tersedia di environment variables (.env.local):
- BIZNETGIO_ACCESS_KEY
- BIZNETGIO_SECRET_KEY
- BIZNETGIO_BUCKET_NAME=dokumen
- BIZNETGIO_ENDPOINT=https://nos.wjv-1.neo.id
- BIZNETGIO_REGION=wjv-1

Test script (test-biznet.js) sudah verified - koneksi berhasil dan file bisa diupload + diakses public.

## Checklist
- [x] Buat library src/lib/biznetStorage.ts dengan fungsi uploadFile dan deleteFile
- [x] Update /api/customers/upload.ts untuk upload dokumen pelanggan (KTP, dll)
- [x] Update /api/vendors/mous/upload.ts untuk upload file MOU/kontrak
- [x] Update /api/settings/upload-logo.ts untuk upload logo perusahaan
- [x] Hapus dependency Google Drive (src/lib/googleDrive.ts tidak dipakai lagi)
- [x] Test upload file di halaman Customers
- [x] Test upload file MOU di halaman Vendors
- [x] Test upload logo di halaman Settings

## Acceptance
- User bisa upload dokumen pelanggan dan file langsung tersimpan di Biznet GIO bucket 'dokumen'
- User bisa upload file MOU vendor dan file bisa diakses via public URL
- User bisa upload logo perusahaan di Settings dan logo langsung muncul