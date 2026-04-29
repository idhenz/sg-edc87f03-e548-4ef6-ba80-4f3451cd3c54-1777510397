-- ============================================================
-- Script SQL untuk menambahkan Tabel Wilayah Indonesia
-- Sumber data: https://github.com/ibnux/data-indonesia/
-- ============================================================

-- 1. Buat tabel provinces (provinsi)
CREATE TABLE IF NOT EXISTS provinces (
  id VARCHAR(2) PRIMARY KEY,
  name VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Buat tabel regencies (kabupaten/kota)
CREATE TABLE IF NOT EXISTS regencies (
  id VARCHAR(4) PRIMARY KEY,
  province_id VARCHAR(2) NOT NULL,
  name VARCHAR(100) NOT NULL,
  FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Buat tabel districts (kecamatan)
CREATE TABLE IF NOT EXISTS districts (
  id VARCHAR(7) PRIMARY KEY,
  regency_id VARCHAR(4) NOT NULL,
  name VARCHAR(100) NOT NULL,
  FOREIGN KEY (regency_id) REFERENCES regencies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Buat tabel villages (kelurahan/desa)
CREATE TABLE IF NOT EXISTS villages (
  id VARCHAR(10) PRIMARY KEY,
  district_id VARCHAR(7) NOT NULL,
  name VARCHAR(100) NOT NULL,
  FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- Modifikasi tabel customers
-- ============================================================

-- Tambahkan kolom wilayah dan jenis pelanggan
ALTER TABLE customers 
ADD COLUMN customer_type ENUM('personal', 'corporate', 'reseller') DEFAULT 'personal' AFTER status,
ADD COLUMN province_id VARCHAR(2) AFTER address,
ADD COLUMN regency_id VARCHAR(4) AFTER province_id,
ADD COLUMN district_id VARCHAR(7) AFTER regency_id,
ADD COLUMN village_id VARCHAR(10) AFTER district_id,
ADD FOREIGN KEY (province_id) REFERENCES provinces(id),
ADD FOREIGN KEY (regency_id) REFERENCES regencies(id),
ADD FOREIGN KEY (district_id) REFERENCES districts(id),
ADD FOREIGN KEY (village_id) REFERENCES villages(id);

-- ============================================================
-- Catatan: Data wilayah Indonesia harus diimport dari repo:
-- https://github.com/ibnux/data-indonesia/
-- 
-- Download file CSV/SQL dari repo tersebut:
-- - provinces.sql
-- - regencies.sql
-- - districts.sql
-- - villages.sql
-- 
-- Kemudian import ke database Anda menggunakan:
-- mysql -u remote -p isp < provinces.sql
-- mysql -u remote -p isp < regencies.sql
-- mysql -u remote -p isp < districts.sql
-- mysql -u remote -p isp < villages.sql
-- ============================================================