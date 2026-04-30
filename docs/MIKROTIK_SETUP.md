# Setup Database untuk Integrasi MikroTik

Panduan lengkap setup database untuk fitur integrasi MikroTik Router.

## SQL Schema untuk Eksekusi

Jalankan SQL berikut di database MySQL Anda:

```sql
-- =============================================
-- Schema untuk Integrasi MikroTik
-- =============================================

-- 1. Tabel Router
CREATE TABLE IF NOT EXISTS `routers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Nama router (contoh: Router Kantor Pusat)',
  `ip_address` VARCHAR(50) NOT NULL COMMENT 'IP Address router',
  `api_port` INT DEFAULT 8728 COMMENT 'Port API MikroTik (default 8728)',
  `username` VARCHAR(50) NOT NULL COMMENT 'Username untuk login API',
  `password` VARCHAR(255) NOT NULL COMMENT 'Password untuk login API',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Status aktif router',
  `last_sync` DATETIME NULL COMMENT 'Waktu sinkronisasi terakhir',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ip_address (`ip_address`),
  INDEX idx_is_active (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabel PPPoE Secrets
CREATE TABLE IF NOT EXISTS `pppoe_secrets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `router_id` INT NOT NULL COMMENT 'ID router sumber data',
  `username` VARCHAR(100) NOT NULL COMMENT 'Username PPPoE dari MikroTik',
  `password` VARCHAR(255) NULL COMMENT 'Password PPPoE (jika tersedia)',
  `service` VARCHAR(50) DEFAULT 'pppoe' COMMENT 'Jenis layanan (pppoe/pptp/l2tp)',
  `profile` VARCHAR(100) NULL COMMENT 'Profile yang digunakan',
  `local_address` VARCHAR(50) NULL COMMENT 'IP lokal yang diberikan',
  `remote_address` VARCHAR(50) NULL COMMENT 'IP remote untuk client',
  `is_active` BOOLEAN DEFAULT FALSE COMMENT 'Status koneksi saat ini (online/offline)',
  `uptime` VARCHAR(50) NULL COMMENT 'Uptime koneksi jika sedang online',
  `last_login` DATETIME NULL COMMENT 'Waktu login terakhir',
  `customer_id` INT NULL COMMENT 'ID pelanggan yang terkait',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_router_username (`router_id`, `username`),
  INDEX idx_username (`username`),
  INDEX idx_is_active (`is_active`),
  INDEX idx_customer_id (`customer_id`),
  FOREIGN KEY (`router_id`) REFERENCES `routers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Update Tabel Customers (tambah kolom pppoe_secret_id)
ALTER TABLE `customers` 
ADD COLUMN `pppoe_secret_id` INT NULL COMMENT 'ID akun PPPoE yang terkait' AFTER `reseller_id`;

ALTER TABLE `customers`
ADD INDEX idx_pppoe_secret_id (`pppoe_secret_id`);

ALTER TABLE `customers`
ADD CONSTRAINT fk_customer_pppoe 
FOREIGN KEY (`pppoe_secret_id`) 
REFERENCES `pppoe_secrets`(`id`) 
ON DELETE SET NULL;
```

## Cara Penggunaan

### 1. Setup Database
- Copy SQL di atas
- Eksekusi di database MySQL Anda (via phpMyAdmin, MySQL Workbench, atau CLI)
- Pastikan tabel `customers` sudah ada sebelum menjalankan ALTER TABLE

### 2. Setup Router di Aplikasi
- Login ke aplikasi
- Buka menu **Router** di sidebar
- Klik **Tambah Router**
- Isi data:
  - Nama: `Router Kantor Pusat` (bebas)
  - IP Address: IP router MikroTik Anda (contoh: `192.168.88.1`)
  - API Port: `8728` (default) atau `8729` untuk SSL
  - Username: Username admin MikroTik
  - Password: Password admin MikroTik
- Klik **Test Koneksi** untuk validasi
- Klik **Simpan**

### 3. Sinkronisasi PPPoE
- Buka menu **PPPoE Secrets** di sidebar
- Pilih router yang ingin disinkronisasi
- Klik tombol **Sync PPPoE**
- Sistem akan menarik data dari MikroTik dan menyimpannya di database

### 4. Kaitkan PPPoE ke Pelanggan
- Buka menu **Pelanggan**
- Edit pelanggan yang ingin dikaitkan
- Di dropdown **Akun PPPoE**, pilih username yang sesuai
- Simpan

### 5. Monitoring
- Status online/offline akan terlihat di kolom **Koneksi** pada tabel pelanggan
- Klik pelanggan untuk melihat detail koneksi (IP, Uptime, Last Login)

## Catatan Penting

### Keamanan
- Password router disimpan dalam plaintext di database
- Pastikan database Anda aman dan tidak bisa diakses publik
- Gunakan username khusus untuk API (bukan admin utama) dengan permission terbatas

### API MikroTik
- Port default API: `8728` (non-SSL) atau `8729` (SSL)
- Pastikan API service sudah diaktifkan di MikroTik: 
  ```
  /ip service enable api
  ```
- Pastikan firewall tidak memblokir koneksi ke port API

### Library Node.js
- Aplikasi menggunakan `node-routeros` untuk komunikasi dengan MikroTik
- Sudah terinstall otomatis via `npm install node-routeros`

## Query Utility (untuk pengecekan manual)

```sql
-- Cek total router aktif
SELECT COUNT(*) as total_routers 
FROM routers 
WHERE is_active = TRUE;

-- Cek total akun PPPoE
SELECT COUNT(*) as total_pppoe 
FROM pppoe_secrets;

-- Cek akun PPPoE yang sedang online
SELECT COUNT(*) as online_count 
FROM pppoe_secrets 
WHERE is_active = TRUE;

-- Cek pelanggan dengan koneksi PPPoE
SELECT 
  c.name as customer_name,
  ps.username as pppoe_username,
  ps.is_active as is_online,
  ps.remote_address as ip_address,
  ps.uptime
FROM customers c
INNER JOIN pppoe_secrets ps ON c.pppoe_secret_id = ps.id
ORDER BY ps.is_active DESC, c.name ASC;

-- Cek akun PPPoE yang belum dikaitkan ke pelanggan
SELECT 
  ps.username,
  ps.profile,
  ps.is_active,
  r.name as router_name
FROM pppoe_secrets ps
INNER JOIN routers r ON ps.router_id = r.id
WHERE ps.customer_id IS NULL
ORDER BY ps.username;
```

## Troubleshooting

### Koneksi ke MikroTik Gagal
- Pastikan IP address dan port benar
- Cek firewall MikroTik: `/ip firewall filter print`
- Pastikan API service running: `/ip service print`
- Test ping dari server aplikasi ke router

### Sync PPPoE Tidak Ada Data
- Pastikan ada secret di MikroTik: `/ppp secret print`
- Cek log error di console browser (F12)
- Verifikasi username/password API sudah benar

### Akun PPPoE Tidak Muncul di Dropdown Pelanggan
- Pastikan akun belum dikaitkan ke pelanggan lain
- Refresh halaman atau sync ulang data PPPoE
- Cek di tabel: `SELECT * FROM pppoe_secrets WHERE customer_id IS NULL`
```