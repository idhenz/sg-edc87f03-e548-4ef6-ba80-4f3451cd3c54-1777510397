-- ============================================================
-- Script SQL untuk Tabel Settings
-- Menyimpan konfigurasi global aplikasi ISP
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY DEFAULT 1,
  isp_name VARCHAR(255) NOT NULL DEFAULT 'Nama ISP',
  isp_address TEXT,
  isp_phone VARCHAR(20),
  tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 11.00 COMMENT 'Pajak dalam persen (contoh: 11.00 = 11%)',
  logo_url VARCHAR(255),
  invoice_whatsapp VARCHAR(20) COMMENT 'Nomor WA untuk konfirmasi invoice',
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(50),
  bank_account_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (id = 1) -- Hanya boleh 1 row untuk settings
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert data awal (default)
INSERT INTO settings (id, isp_name, tax_percentage) 
VALUES (1, 'Nama ISP Anda', 11.00)
ON DUPLICATE KEY UPDATE id=id;

-- CATATAN PENGGUNAAN:
-- Tax/Pajak disimpan dalam bentuk persentase (misal: 11.00 untuk PPN 11%)
-- Untuk menghitung pajak dari harga: harga * (tax_percentage / 100)
-- Contoh: Rp 100.000 * (11.00 / 100) = Rp 11.000