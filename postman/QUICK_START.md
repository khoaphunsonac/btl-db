# 🚀 Quick Start - Insert Contacts với Postman

## ⚡ 3 Bước Để Bắt Đầu

### **Bước 1: Import vào Postman** (30 giây)

1. Mở **Postman**
2. Click **Import** (góc trên trái)
3. Kéo thả 2 files vào:
   - ✅ `Insert_Contacts_Collection.json`
   - ✅ `BTL_DB_Environment.postman_environment.json`

### **Bước 2: Chọn Environment** (5 giây)

1. Góc phải trên Postman
2. Dropdown chọn: **"BTL-DB Local Environment"**

### **Bước 3: Test Ngay!** (10 giây)

1. Mở collection **"Insert Contacts - BTL Database"**
2. Click request đầu tiên
3. Click **Send**
4. ✅ Done! Contact đã được insert

---

## 🎯 Chạy Tất Cả 20 Contacts

1. Click vào **Collection** name
2. Click nút **Run** bên phải
3. Chọn tất cả requests (hoặc bỏ chọn BONUS request)
4. Click **Run Insert Contacts...**
5. ⏱️ Chờ vài giây
6. ✅ Xem kết quả: 20/20 passed

---

## 📋 Format Request

**URL:**
```
POST http://localhost/btl-db/backend/routes/api.php/contacts
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "customer_id": 1,
  "content": "Nội dung liên hệ của bạn"
}
```

**Lưu ý:**
- ❌ KHÔNG cần trường `id` (auto increment)
- ❌ KHÔNG cần trường `date` (tự động NOW())
- ✅ CHỈ CẦN: `customer_id` (optional) và `content` (required)

---

## ✅ Kiểm Tra Kết Quả

### **Option 1: Dùng Postman**
Chạy request **"BONUS - Get All Contacts"**

### **Option 2: Dùng SQL**
```sql
SELECT * FROM Contact ORDER BY id DESC LIMIT 20;
```

### **Option 3: Dùng phpMyAdmin**
```
http://localhost/phpmyadmin
→ Chọn database
→ Bảng Contact
→ Xem dữ liệu
```

---

## 🛠️ Tùy Chỉnh URL

Nếu bạn dùng cấu hình khác:

1. Mở **Environments** (góc trái)
2. Chọn **"BTL-DB Local Environment"**
3. Sửa `base_url`:
   ```
   http://localhost:8080/btl-db/backend/routes/api.php
   hoặc
   http://nemthung.local/backend/routes/api.php
   ```

---

## 📚 Tài Liệu Chi Tiết

Đọc file `README_INSERT_CONTACTS.md` để biết:
- Scripts tự động (Tests, Pre-request)
- Error handling
- Bulk insert
- Newman CLI
- Và nhiều hơn nữa...

---

## 🐛 Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| Connection refused | ✅ Bật XAMPP (Apache + MySQL) |
| 404 Not Found | ✅ Kiểm tra lại URL trong Environment |
| 400 Bad Request | ✅ Thêm trường `content` vào body |
| 500 Server Error | ✅ Kiểm tra kết nối database |

---

## 💡 Tips

1. **Sử dụng Environment Variables** để dễ chuyển đổi giữa Local/Staging/Production
2. **Collection Runner** để insert hàng loạt nhanh chóng
3. **Tests Scripts** để tự động validate response
4. **Newman CLI** để chạy từ command line

---

**Chúc bạn thành công! 🎉**

Có vấn đề? Đọc `README_INSERT_CONTACTS.md` hoặc check file `Postman_Scripts.js`
