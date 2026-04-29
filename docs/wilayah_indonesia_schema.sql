-- ============================================================
-- Script SQL untuk Modifikasi Tabel Customers
-- Menyesuaikan dengan struktur wilayah_indonesia.sql
-- Sumber data: https://github.com/ibnux/data-indonesia/
-- ============================================================

-- LANGKAH 1: Download dan import file wilayah_indonesia.sql
-- Download dari: https://raw.githubusercontent.com/ibnux/data-indonesia/refs/heads/master/wilayah_indonesia.sql
-- Import ke database Anda:
-- mysql -u remote -p isp < wilayah_indonesia.sql

-- LANGKAH 2: Modifikasi tabel customers untuk menambahkan kolom wilayah dan jenis pelanggan
ALTER TABLE customers 
ADD COLUMN customer_type ENUM('personal', 'corporate', 'reseller') DEFAULT 'personal' AFTER status,
ADD COLUMN province_id VARCHAR(2) AFTER address,
ADD COLUMN regency_id VARCHAR(4) AFTER province_id,
ADD COLUMN district_id VARCHAR(7) AFTER regency_id,
ADD COLUMN village_id VARCHAR(10) AFTER district_id;

-- CATATAN: 
-- Tabel wilayah yang akan digunakan dari wilayah_indonesia.sql:
-- - t_provinsi (id, nama)
-- - t_kota (id, nama) -- untuk kabupaten/kota
-- - t_kecamatan (id, nama)
-- - t_kelurahan (id, nama)
-- 
-- Relasi antar tabel menggunakan prefix ID:
-- - ID Provinsi: "11" (Aceh)
-- - ID Kota: "1101" (Kab. Aceh Selatan) -- 2 digit pertama = provinsi
-- - ID Kecamatan: "110101" (Bakongan) -- 4 digit pertama = kota
-- - ID Kelurahan: "1101012001" (Keude Bakongan) -- 6 digit pertama = kecamatan