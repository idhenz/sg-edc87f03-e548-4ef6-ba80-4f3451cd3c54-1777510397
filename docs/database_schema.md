# Database Schema

Jalankan script SQL di bawah ini pada Database MySQL Anda (`isp`) untuk membuat tabel-tabel yang dibutuhkan oleh aplikasi:

```sql
-- 1. Table: Users (For Login Admin & Reseller)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'reseller') DEFAULT 'reseller',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin account
-- Email: admin@admin.com
-- Password: admin123
INSERT INTO users (name, email, password, role)
VALUES ('Super Admin', 'admin@admin.com', 'admin123', 'admin');

-- Insert sample reseller account
INSERT INTO users (name, email, password, role)
VALUES ('Reseller Demo', 'reseller@admin.com', 'reseller123', 'reseller');

-- 2. Table: Customers (Pelanggan)
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  active_package VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active'
);

-- 3. Table: Resellers (Data Reseller)
CREATE TABLE IF NOT EXISTS resellers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  company VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  total_customers INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active'
);

-- 4. Table: Products (Paket Layanan)
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  speed VARCHAR(50),
  price DECIMAL(15, 2),
  status VARCHAR(20) DEFAULT 'active'
);

-- 5. Table: Invoices Incoming (Invoice Masuk/Pengeluaran)
CREATE TABLE IF NOT EXISTS invoices_incoming (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL,
  vendor VARCHAR(100),
  description TEXT,
  date DATE,
  amount DECIMAL(15, 2),
  status VARCHAR(20) DEFAULT 'pending'
);

-- 6. Table: Invoices Outgoing (Invoice Keluar/Tagihan)
CREATE TABLE IF NOT EXISTS invoices_outgoing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL,
  customer_name VARCHAR(100),
  package_name VARCHAR(100),
  due_date DATE,
  amount DECIMAL(15, 2),
  status VARCHAR(20) DEFAULT 'pending',
  invoice_type VARCHAR(20) DEFAULT 'MRC' COMMENT 'OTC (One Time Charge) or MRC (Monthly Recurring Charge)',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OPTIONAL: Add invoice_type column if your table already exists but doesn't have this column
-- Run this if you get error about invoice_type column:
-- ALTER TABLE invoices_outgoing ADD COLUMN invoice_type VARCHAR(20) DEFAULT 'MRC' COMMENT 'OTC (One Time Charge) or MRC (Monthly Recurring Charge)';

-- 7. Table: Mails Incoming (Surat Masuk)
CREATE TABLE IF NOT EXISTS mails_incoming (
  id INT AUTO_INCREMENT PRIMARY KEY,
  letter_number VARCHAR(50) NOT NULL,
  sender VARCHAR(100),
  subject VARCHAR(200),
  received_date DATE,
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'archived'
);

-- 8. Table: Mails Outgoing (Surat Keluar)
CREATE TABLE IF NOT EXISTS mails_outgoing (
  id INT AUTO_INCREMENT PRIMARY KEY,
  letter_number VARCHAR(50) NOT NULL,
  recipient VARCHAR(100),
  subject VARCHAR(200),
  sent_date DATE,
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'sent'
);
```