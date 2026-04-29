# Skema Database Riwayat MOU Vendor

Untuk mendukung fitur riwayat kerjasama dan upload file dokumen kesepakatan (MOU), silakan jalankan perintah SQL di bawah ini pada database MySQL Anda:

```sql
CREATE TABLE vendor_mous (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    mou_number VARCHAR(100) NOT NULL,
    mou_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    mou_file VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);
```

**Penjelasan Kolom:**
- `mou_number`: Nomor surat kesepakatan / kontrak
- `mou_date`: Tanggal surat MOU dikeluarkan
- `start_date`: Tanggal mulai bekerjasama (berlakunya MOU)
- `end_date`: Tanggal berakhirnya MOU (digunakan untuk menghitung status Expired/Aktif)
- `mou_file`: Path file dokumen yang diupload (menyimpan format PDF/JPG/PNG)