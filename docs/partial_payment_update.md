# Partial Payment System Update

## Database Schema Update

### 1. Add paid_amount column to invoices_outgoing

```sql
ALTER TABLE invoices_outgoing 
ADD COLUMN paid_amount DECIMAL(15,2) DEFAULT 0.00 AFTER amount;
```

### 2. Update status enum to include 'partial'

```sql
ALTER TABLE invoices_outgoing 
MODIFY COLUMN status VARCHAR(20) DEFAULT 'pending';
```

Status options:
- `pending` - Belum bayar sama sekali
- `partial` - Lunas sebagian (paid_amount < amount)
- `paid` - Lunas penuh (paid_amount >= amount)

## Payment Logic

1. Saat konfirmasi pembayaran:
   - paid_amount += payment.amount
   - if paid_amount >= amount → status = 'paid'
   - if paid_amount > 0 && paid_amount < amount → status = 'partial'

2. Multiple payments per invoice diperbolehkan sampai lunas

3. Payment history tracked via payment_confirmations (multiple records per invoice)

## UI Changes

- Badge colors:
  - Pending: gray
  - Partial: orange/warning
  - Paid: green/success

- Show remaining balance for partial payments
- Payment history dialog shows all payments for an invoice