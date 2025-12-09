# Hướng Dẫn Insert Contacts Bằng Postman

## 📋 Mô Tả
Script Postman để insert contacts vào database qua API **KHÔNG CẦN TRƯỜNG ID** (ID tự động tăng).

---

## 🚀 Cách Sử Dụng

### **Bước 1: Import Collection vào Postman**

1. Mở Postman
2. Click **Import** ở góc trên bên trái
3. Chọn file `Insert_Contacts_Collection.json`
4. Click **Import**

### **Bước 2: Kiểm Tra URL**

Đảm bảo URL đúng với cấu hình local của bạn:
```
http://localhost/btl-db/backend/routes/api.php/contacts
```

Nếu khác, hãy sửa trong từng request hoặc dùng **Environment Variables**.

### **Bước 3: Chạy Từng Request**

Có 20 requests mẫu, mỗi request insert 1 contact:
- Click vào request
- Click **Send**
- Xem kết quả trả về

### **Bước 4: Chạy Hàng Loạt (Collection Runner)**

1. Click vào **Collection** "Insert Contacts - BTL Database"
2. Click **Run** (hoặc ba chấm → Run collection)
3. Chọn các requests muốn chạy (hoặc chọn tất cả)
4. Click **Run Insert Contacts...**
5. Xem kết quả trong bảng Summary

---

## 📊 Format Dữ Liệu

### **Request Body (JSON)**
```json
{
  "customer_id": 1,
  "content": "Nội dung liên hệ"
}
```

### **Response Success (201)**
```json
{
  "success": true,
  "message": "Gửi yêu cầu liên hệ thành công",
  "data": {
    "id": 1,
    "customer_id": 1,
    "content": "Nội dung liên hệ",
    "date": "2024-12-09 10:43:00"
  }
}
```

### **Response Error (400)**
```json
{
  "success": false,
  "errors": {
    "message": "Nội dung không được để trống"
  }
}
```

---

## 📝 Trường Dữ Liệu

| Trường | Kiểu | Bắt buộc | Mô tả |
|--------|------|----------|-------|
| `customer_id` | INT | Tùy chọn | ID khách hàng (foreign key) |
| `content` | STRING | **Bắt buộc** | Nội dung liên hệ (max 255 ký tự) |

**Lưu ý:** 
- ❌ **KHÔNG CẦN** trường `id` (tự động tăng)
- ❌ **KHÔNG CẦN** trường `date` (tự động NOW())

---

## 🎯 Các Request Có Sẵn

Collection bao gồm **20 requests** insert mẫu:

1. **Liên hệ về sản phẩm** (5 requests)
   - Hỏi về chất liệu balo
   - Hỏi về màu sắc
   - Đổi size
   - Khuyến mãi
   - Bảo hành

2. **Liên hệ về giao hàng** (3 requests)
   - Kiểm tra đơn hàng
   - Đổi địa chỉ
   - Phí ship

3. **Liên hệ về thanh toán** (2 requests)
   - Phương thức thanh toán
   - Hoàn tiền

4. **Liên hệ về chất lượng** (3 requests)
   - Đổi trả sản phẩm lỗi
   - Đánh giá tích cực
   - Hỏi về tính năng

5. **Liên hệ tư vấn** (4 requests)
   - Tư vấn sản phẩm
   - Hỏi về loại túi
   - Đặt hàng theo yêu cầu
   - Mua số lượng lớn

6. **Liên hệ khác** (3 requests)
   - Dịch vụ gói quà
   - Sản phẩm mới
   - Showroom

7. **BONUS: Get All Contacts** (kiểm tra kết quả)

---

## 🔧 Tùy Chỉnh

### **Thêm Contact Mới**

1. Duplicate một request có sẵn
2. Đổi tên request
3. Sửa body JSON:
```json
{
  "customer_id": 11,
  "content": "Nội dung mới của bạn"
}
```

### **Thay Đổi URL**

Nếu dùng port khác hoặc virtual host:
```
http://localhost:8080/btl-db/backend/routes/api.php/contacts
http://nemthung.local/backend/routes/api.php/contacts
```

---

## 🧪 Kiểm Tra Kết Quả

### **Option 1: Dùng Postman**
Chạy request **"BONUS - Get All Contacts"** để xem tất cả contacts đã insert.

### **Option 2: Dùng SQL**
```sql
SELECT * FROM Contact ORDER BY date DESC LIMIT 20;
```

### **Option 3: Dùng phpMyAdmin**
Truy cập: `http://localhost/phpmyadmin`
- Chọn database
- Mở bảng `Contact`
- Xem dữ liệu vừa insert

---

## ⚡ Script Tự Động (Newman CLI)

Nếu muốn chạy bằng command line:

### **Cài đặt Newman**
```bash
npm install -g newman
```

### **Chạy Collection**
```bash
newman run Insert_Contacts_Collection.json
```

### **Chạy với Reporter**
```bash
newman run Insert_Contacts_Collection.json -r cli,html
```

---

## 🐛 Xử Lý Lỗi

| Lỗi | Nguyên nhân | Giải pháp |
|-----|-------------|-----------|
| Connection refused | Server chưa chạy | Khởi động XAMPP |
| 404 Not Found | URL sai | Kiểm tra lại đường dẫn |
| 400 Bad Request | Thiếu content | Thêm trường content vào body |
| 500 Internal Error | Lỗi database | Kiểm tra kết nối DB |
| Foreign key constraint | customer_id không tồn tại | Dùng customer_id hợp lệ hoặc NULL |

---

## 📌 Lưu Ý Quan Trọng

✅ **KHÔNG CẦN** trường `id` - tự động tăng  
✅ **KHÔNG CẦN** trường `date` - tự động NOW()  
✅ Trường `customer_id` có thể NULL hoặc là ID hợp lệ  
✅ Trường `content` BẮT BUỘC và max 255 ký tự  
✅ Header `Content-Type: application/json` là bắt buộc  

---

## 🎓 Ví Dụ Nâng Cao

### **Insert với customer_id = NULL**
```json
{
  "customer_id": null,
  "content": "Liên hệ từ khách vãng lai"
}
```

### **Insert với trường message (alias cho content)**
```json
{
  "customer_id": 1,
  "message": "Nội dung (dùng message thay vì content)"
}
```

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. ✅ XAMPP đã chạy (Apache + MySQL)
2. ✅ Database đã import
3. ✅ URL đúng với cấu hình local
4. ✅ Content-Type header = application/json
5. ✅ Body format là raw JSON

---

**Chúc bạn insert thành công! 🚀**
