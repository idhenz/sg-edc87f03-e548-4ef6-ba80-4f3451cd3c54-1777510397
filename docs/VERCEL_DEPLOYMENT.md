# Panduan Deployment ke Vercel (Production)

## Prasyarat
1. Akun GitHub yang sudah terkoneksi dengan Softgen
2. Project sudah di-push ke GitHub repository
3. MySQL database yang bisa diakses dari internet
4. Biznet GIO Object Storage credentials

---

## Langkah 1: Login ke Vercel

1. Buka: **https://vercel.com/login**
2. Klik **"Continue with GitHub"**
3. Login dengan akun GitHub yang sama dengan Softgen
4. Authorize Vercel jika diminta

---

## Langkah 2: Import Project (Jika Belum)

Jika project belum ada di Vercel:

1. Klik tombol **"Add New..."** → **"Project"**
2. Pilih **repository GitHub** project Anda
3. Klik **"Import"**
4. **JANGAN deploy dulu** - kita setup environment variables dulu

---

## Langkah 3: Setup Environment Variables

1. **Di Vercel Dashboard**, pilih project Anda
2. Klik tab **"Settings"** (bagian atas)
3. Klik **"Environment Variables"** (menu kiri)
4. **Tambahkan semua variable berikut:**

### Database Configuration
```
Key: DB_HOST
Value: (alamat MySQL server, contoh: mysql.example.com atau IP)
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: DB_USER
Value: (username MySQL Anda)
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: DB_PASSWORD
Value: (password MySQL Anda)
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: DB_NAME
Value: (nama database Anda)
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: DB_PORT
Value: 3306
Environments: ✓ Production ✓ Preview ✓ Development
```

### Biznet GIO Storage (untuk upload file)
```
Key: BIZNETGIO_ACCESS_KEY
Value: (lihat di .env.local lokal Anda)
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: BIZNETGIO_SECRET_KEY
Value: (lihat di .env.local lokal Anda)
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: BIZNETGIO_BUCKET_NAME
Value: dokumen
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: BIZNETGIO_ENDPOINT
Value: https://nos.wjv-1.neo.id
Environments: ✓ Production ✓ Preview ✓ Development
```

```
Key: BIZNETGIO_REGION
Value: wjv-1
Environments: ✓ Production ✓ Preview ✓ Development
```

5. Klik **"Save"** setelah setiap variable ditambahkan

---

## Langkah 4: Deploy Project

### Opsi A: Deploy Pertama Kali
1. Setelah semua env vars tersimpan
2. Klik tab **"Deployments"**
3. Klik **"Redeploy"** atau **"Deploy"**
4. Tunggu proses build selesai (3-5 menit)

### Opsi B: Redeploy (Jika Sudah Ada Deployment)
1. Klik tab **"Deployments"**
2. Klik titik 3 (**···**) di deployment paling atas
3. Pilih **"Redeploy"**
4. Centang **"Use existing Build Cache"** (opsional, lebih cepat)
5. Klik **"Redeploy"**
6. Tunggu sampai status menjadi **"Ready"** (warna hijau)

---

## Langkah 5: Whitelist IP Vercel di MySQL (Jika Perlu)

Jika MySQL Anda memiliki firewall/IP whitelist:

1. Dapatkan IP ranges Vercel: https://vercel.com/docs/concepts/edge-network/regions
2. Atau gunakan domain: `*.vercel.app` di MySQL host configuration
3. Untuk cPanel/WHM: tambahkan `%` di Remote MySQL Access Hosts

**Contoh MySQL Remote Access:**
```
%.vercel.app
0.0.0.0/0 (allow all - tidak recommended untuk production)
```

---

## Langkah 6: Test Production

1. Buka URL production Anda (contoh: `https://your-app.vercel.app`)
2. Test login dengan user yang ada di database:
   - Email: (user di tabel `users`)
   - Password: (password di tabel `users`)
3. Test fitur:
   - Dashboard (data muncul)
   - Tambah pelanggan
   - Upload file dokumen
   - Filter & pagination

---

## Troubleshooting

### Error: "Database configuration error"
- Cek environment variables sudah tersimpan dengan benar
- Pastikan tidak ada spasi di awal/akhir value
- Redeploy project setelah menambah/update env vars

### Error: Login gagal / 500 Internal Server Error
- Cek MySQL bisa diakses dari luar (test dengan MySQL Workbench dari komputer lain)
- Cek firewall MySQL tidak blocking koneksi dari Vercel
- Lihat "Runtime Logs" di tab Deployments untuk detail error

### Error: "Invalid session"
- Clear browser cookies
- Coba incognito/private window
- Pastikan cookie settings sudah benar (sudah di-fix di code)

### Upload file gagal
- Cek Biznet GIO credentials di environment variables
- Pastikan bucket "dokumen" sudah dibuat
- Test koneksi Biznet GIO dengan script lokal dulu

---

## Monitoring & Logs

### Melihat Runtime Logs:
1. Tab **"Deployments"**
2. Klik deployment yang aktif
3. Scroll ke bawah ke bagian **"Runtime Logs"**
4. Lihat error logs real-time

### Melihat Build Logs:
1. Tab **"Deployments"**
2. Klik deployment
3. Bagian **"Building"** akan menampilkan build logs

---

## Tips Production

1. **Database Connection Pooling**: Sudah dikonfigurasi otomatis (max 5 connections untuk serverless)
2. **Session Duration**: 7 hari (bisa diubah di `src/pages/api/auth/login.ts`)
3. **File Upload**: Langsung ke Biznet GIO S3, tidak melalui Next.js server
4. **Security**: Cookie httpOnly, secure di production, CORS headers sudah di-set

---

## Dukungan

Jika masih ada masalah:
1. Screenshot error message
2. Copy Runtime Logs dari Vercel
3. Hubungi Softgen support atau developer Anda

---

**Selamat! Aplikasi Anda sekarang production-ready! 🚀**