# Daftar API Endpoints - ISP Management

## Authentication
- **POST** `/api/auth/login` - Login user dengan email & password (no auth required)
- **GET** `/api/auth/me` - Get current user info (requires auth)
- **POST** `/api/auth/logout` - Logout user (client-side only)

## Customers (Pelanggan)
- **GET** `/api/customers` - Get all customers (support `?search=` dan `?id=`)
- **POST** `/api/customers` - Create new customer
- **PUT** `/api/customers` - Update customer
- **POST** `/api/customers/upload` - Upload customer files (KTP, NPWP, etc)

## Resellers
- **GET** `/api/resellers` - Get all resellers
- **POST** `/api/resellers` - Create new reseller
- **PUT** `/api/resellers` - Update reseller
- **DELETE** `/api/resellers` - Delete reseller

## Invoices
### Incoming (Pengeluaran)
- **GET** `/api/invoices/incoming` - Get all incoming invoices
- **POST** `/api/invoices/incoming` - Create new incoming invoice
- **PUT** `/api/invoices/incoming` - Update incoming invoice
- **DELETE** `/api/invoices/incoming` - Delete incoming invoice

### Outgoing (Tagihan Pelanggan)
- **GET** `/api/invoices/outgoing` - Get all outgoing invoices (support `?month=` `?year=` `?id=`)
- **POST** `/api/invoices/outgoing` - Create new outgoing invoice
- **PUT** `/api/invoices/outgoing` - Update outgoing invoice
- **DELETE** `/api/invoices/outgoing` - Delete outgoing invoice

## Mails (Surat)
### Incoming (Surat Masuk)
- **GET** `/api/mails/incoming` - Get all incoming mails
- **POST** `/api/mails/incoming` - Create new incoming mail
- **PUT** `/api/mails/incoming` - Update incoming mail
- **DELETE** `/api/mails/incoming` - Delete incoming mail

### Outgoing (Surat Keluar)
- **GET** `/api/mails/outgoing` - Get all outgoing mails
- **POST** `/api/mails/outgoing` - Create new outgoing mail
- **PUT** `/api/mails/outgoing` - Update outgoing mail
- **DELETE** `/api/mails/outgoing` - Delete outgoing mail

## Products (Paket Internet)
- **GET** `/api/products` - Get all products
- **POST** `/api/products` - Create new product
- **PUT** `/api/products` - Update product
- **DELETE** `/api/products` - Delete product

## Settings (Pengaturan)
- **GET** `/api/settings` - Get company settings
- **POST** `/api/settings` - Create/Update settings
- **POST** `/api/settings/upload-logo` - Upload company logo

## Vendors
- **GET** `/api/vendors` - Get all vendors
- **POST** `/api/vendors` - Create new vendor
- **PUT** `/api/vendors` - Update vendor
- **DELETE** `/api/vendors` - Delete vendor

### Vendor MOU
- **GET** `/api/vendors/mous` - Get all vendor MOUs (support `?vendor_id=`)
- **POST** `/api/vendors/mous` - Create new MOU
- **PUT** `/api/vendors/mous` - Update MOU
- **DELETE** `/api/vendors/mous` - Delete MOU
- **POST** `/api/vendors/mous/upload` - Upload MOU file

## Activations (Aktivasi Pelanggan)
- **GET** `/api/activations` - Get all activations (support `?customer_id=`)
- **POST** `/api/activations` - Create new activation
- **PUT** `/api/activations` - Update activation
- **DELETE** `/api/activations` - Delete activation

## Banks (Rekening Bank)
- **GET** `/api/banks` - Get all bank accounts
- **POST** `/api/banks` - Create new bank account
- **PUT** `/api/banks` - Update bank account
- **DELETE** `/api/banks` - Delete bank account

## Payments (Konfirmasi Pembayaran)
- **POST** `/api/payments/confirm` - Submit payment confirmation with proof
- **GET** `/api/payments/history?invoice_id=` - Get payment history for an invoice

## Routers (MikroTik)
- **GET** `/api/routers` - Get all routers (support `?id=`)
- **POST** `/api/routers` - Create new router
- **PUT** `/api/routers` - Update router
- **DELETE** `/api/routers` - Delete router
- **POST** `/api/routers/test` - Test router connection (no auth required)

## PPPoE Secrets
- **GET** `/api/pppoe` - Get all PPPoE secrets (support `?router_id=` `?available=true`)
- **POST** `/api/pppoe/sync` - Sync PPPoE secrets from MikroTik router

## Regions (Wilayah Indonesia)
- **GET** `/api/regions/provinces` - Get all provinces (no auth required - public data)
- **GET** `/api/regions/regencies?province_id=` - Get regencies by province (no auth required)
- **GET** `/api/regions/districts?regency_id=` - Get districts by regency (no auth required)
- **GET** `/api/regions/villages?district_id=` - Get villages by district (no auth required)

## Test Endpoint
- **GET** `/api/hello` - Health check endpoint (no auth required)

---

## Auth Requirements

**Session-Based Authentication:**
- Login via `/api/auth/login` returns user object
- User data stored in localStorage on client
- All protected endpoints require header:
  ```
  X-User-Session: {"id":1,"name":"Admin","email":"admin@admin.com","role":"admin"}
  ```
- Server reads `X-User-Session` header and validates user data
- No JWT/tokens - pure session-based auth from database

**Endpoints WITHOUT auth requirement:**
- `/api/auth/login` - public endpoint for login
- `/api/auth/logout` - client-side only
- `/api/routers/test` - test connection before saving
- `/api/regions/*` - public location data
- `/api/hello` - health check

**All other endpoints require valid session header.**

## Query Parameters Support
- `?id=` - Get single record by ID
- `?search=` - Search by name/email/phone (customers)
- `?month=&year=` - Filter by date (invoices)
- `?customer_id=` - Filter by customer (activations)
- `?vendor_id=` - Filter by vendor (mous)
- `?router_id=` - Filter by router (pppoe)
- `?available=true` - Get unassigned records (pppoe)
- `?province_id=` - Get by province (regions)
- `?regency_id=` - Get by regency (regions)
- `?district_id=` - Get by district (regions)
- `?invoice_id=` - Get payment history (payments)