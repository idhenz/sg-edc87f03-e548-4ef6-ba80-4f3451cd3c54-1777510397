# PPPoE Secrets Schema

Tabel untuk menyimpan data akun PPPoE yang disinkronisasi dari MikroTik router.

## Table: pppoe_secrets

```sql
CREATE TABLE pppoe_secrets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  router_id INT NOT NULL,
  pppoe_id VARCHAR(50) NOT NULL,
  username VARCHAR(100) NOT NULL,
  service VARCHAR(20) DEFAULT 'pppoe',
  profile VARCHAR(50),
  local_address VARCHAR(45),
  remote_address VARCHAR(45),
  is_active BOOLEAN DEFAULT false,
  last_login DATETIME NULL,
  uptime VARCHAR(50),
  caller_id VARCHAR(100),
  customer_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (router_id) REFERENCES routers(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  UNIQUE KEY unique_router_username (router_id, username),
  INDEX idx_router_id (router_id),
  INDEX idx_customer_id (customer_id),
  INDEX idx_is_active (is_active),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Fields Description

- `id`: Primary key
- `router_id`: Foreign key ke tabel routers
- `pppoe_id`: ID unik dari MikroTik (internal ID)
- `username`: Username PPPoE
- `service`: Tipe service (pppoe, pptp, l2tp, etc)
- `profile`: Profile PPPoE yang digunakan
- `local_address`: IP Address gateway/local
- `remote_address`: IP Address yang diberikan ke client
- `is_active`: Status koneksi saat ini (online/offline)
- `last_login`: Waktu login terakhir
- `uptime`: Durasi koneksi terakhir
- `caller_id`: MAC Address atau caller ID client
- `customer_id`: Foreign key ke tabel customers (nullable)
- `created_at`: Waktu record pertama kali dibuat
- `updated_at`: Waktu update terakhir