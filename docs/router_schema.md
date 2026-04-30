# Router Schema

Tabel untuk menyimpan informasi router MikroTik yang akan digunakan untuk sinkronisasi data PPPoE.

## Table: routers

```sql
CREATE TABLE routers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  api_port INT DEFAULT 8728,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_active (is_active),
  INDEX idx_last_sync (last_sync)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Fields Description

- `id`: Primary key
- `name`: Nama identifikasi router (contoh: "Router Utama", "Router Backup")
- `ip_address`: IP Address router MikroTik
- `api_port`: Port API MikroTik (default 8728, 8729 untuk SSL)
- `username`: Username untuk login API MikroTik
- `password`: Password API (disimpan terenkripsi)
- `is_active`: Status aktif/nonaktif router
- `last_sync`: Timestamp sinkronisasi terakhir
- `created_at`: Waktu pembuatan record
- `updated_at`: Waktu update terakhir