# Skema Database Sistem Aktivasi

Jalankan perintah SQL di bawah ini pada database MySQL Anda untuk mendukung fitur Aktivasi dan Riwayat Pelanggan:

```sql
-- 1. Buat Tabel Vendor
CREATE TABLE vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(100),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Modifikasi Tabel Customers (untuk melacak status saat ini dengan cepat)
ALTER TABLE customers
ADD COLUMN current_product_id INT NULL AFTER customer_type,
ADD COLUMN current_vendor_id INT NULL AFTER current_product_id,
ADD COLUMN subscription_status ENUM('active', 'inactive') DEFAULT 'inactive' AFTER current_vendor_id;

-- 3. Buat Tabel Activations (sebagai Log Riwayat)
CREATE TABLE activations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    product_id INT NULL, -- NULL jika berhenti berlangganan
    vendor_id INT NULL,
    action_type ENUM('activation', 'upgrade', 'downgrade', 'termination') NOT NULL,
    activation_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);
```