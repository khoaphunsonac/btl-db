# 📦 Postman - Insert Contacts Package

## 📁 Danh Sách Files

| File | Mô Tả | Dùng Để |
|------|-------|---------|
| 🎯 **QUICK_START.md** | Hướng dẫn bắt đầu nhanh | Bắt đầu trong 3 bước |
| 📖 **README_INSERT_CONTACTS.md** | Hướng dẫn chi tiết đầy đủ | Tìm hiểu sâu hơn |
| 📦 **Insert_Contacts_Collection.json** | Postman Collection chính (20 requests) | Import vào Postman |
| 🌍 **BTL_DB_Environment.postman_environment.json** | Environment variables | Import vào Postman |
| 💻 **Postman_Scripts.js** | Scripts mẫu (Tests, Pre-request) | Copy vào Postman |
| 📋 **INDEX.md** | File này - Tổng quan | Tìm hiểu cấu trúc |

---

## 🚀 Bắt Đầu Nhanh

### **Lần Đầu Sử Dụng?**
👉 Đọc file: **`QUICK_START.md`**

### **Muốn Hiểu Rõ Hơn?**
👉 Đọc file: **`README_INSERT_CONTACTS.md`**

### **Muốn Tùy Chỉnh?**
👉 Xem file: **`Postman_Scripts.js`**

---

## 📦 Files Cần Import

### **1. Collection (BẮT BUỘC)**
```
Insert_Contacts_Collection.json
```
- Chứa 20 requests INSERT mẫu
- Chứa 1 request GET để kiểm tra
- Sẵn sàng sử dụng ngay

### **2. Environment (KHUYẾN NGHỊ)**
```
BTL_DB_Environment.postman_environment.json
```
- Chứa base_url và variables
- Dễ dàng chuyển đổi môi trường
- Không cần sửa URL trong từng request

---

## 🎯 Cấu Trúc Collection

```
Insert Contacts - BTL Database/
├── 1. Insert Contact - Sản phẩm balo
├── 2. Insert Contact - Màu sắc túi xách
├── 3. Insert Contact - Đổi size
├── 4. Insert Contact - Khuyến mãi
├── 5. Insert Contact - Bảo hành
├── 6. Insert Contact - Giao hàng
├── 7. Insert Contact - Đổi địa chỉ
├── 8. Insert Contact - Phí ship
├── 9. Insert Contact - Thanh toán
├── 10. Insert Contact - Hoàn tiền
├── 11. Insert Contact - Đổi trả sản phẩm lỗi
├── 12. Insert Contact - Đánh giá tích cực
├── 13. Insert Contact - Chống nước
├── 14. Insert Contact - Tư vấn balo học sinh
├── 15. Insert Contact - Túi công sở
├── 16. Insert Contact - Đặt hàng theo yêu cầu
├── 17. Insert Contact - Mua số lượng lớn
├── 18. Insert Contact - Gói quà
├── 19. Insert Contact - Sản phẩm mới
├── 20. Insert Contact - Showroom
└── BONUS - Get All Contacts (kiểm tra)
```

---

## 🌍 Environment Variables

| Variable | Default Value | Mô Tả |
|----------|---------------|-------|
| `base_url` | http://localhost/btl-db/backend/routes/api.php | Base API URL |
| `api_contacts` | {{base_url}}/contacts | Contacts endpoint |
| `current_customer_id` | 1 | Customer ID hiện tại |
| `last_contact_id` | - | ID contact vừa tạo |
| `timestamp` | - | Timestamp động |
| `random_customer_id` | - | Random customer ID |
| `random_content` | - | Random content |
| `avg_response_time` | - | Response time trung bình |

---

## 💻 Scripts Có Sẵn

File `Postman_Scripts.js` chứa:

1. ✅ **Pre-request Script** - Chạy trước khi gửi request
2. ✅ **Tests Script** - Validate response tự động
3. ✅ **Collection Script** - Áp dụng cho toàn bộ collection
4. ✅ **Dynamic Data Generator** - Tạo dữ liệu ngẫu nhiên
5. ✅ **Bulk Insert Script** - Insert hàng loạt
6. ✅ **Error Handling** - Xử lý lỗi tự động
7. ✅ **Data Validation** - Validate dữ liệu
8. ✅ **Performance Monitoring** - Theo dõi hiệu suất
9. ✅ **Auto Increment** - Tự động tăng ID
10. ✅ **Console Logging** - Log đẹp và chi tiết

---

## 📊 API Endpoints

### **POST /contacts** - Tạo contact mới
```http
POST http://localhost/btl-db/backend/routes/api.php/contacts
Content-Type: application/json

{
  "customer_id": 1,
  "content": "Nội dung liên hệ"
}
```

### **GET /contacts** - Lấy danh sách contacts
```http
GET http://localhost/btl-db/backend/routes/api.php/contacts
```

---

## 🔧 Cấu Hình Hệ Thống

### **Yêu Cầu**
- ✅ XAMPP (Apache + MySQL)
- ✅ Postman Desktop hoặc Web
- ✅ Database đã import

### **Optional**
- 💡 Newman CLI (chạy từ command line)
- 💡 Git (quản lý version)

---

## 📝 Data Format

### **Trường Bắt Buộc**
- ✅ `content` (VARCHAR 255) - Nội dung liên hệ

### **Trường Tùy Chọn**
- 🔹 `customer_id` (INT) - ID khách hàng

### **Trường Tự Động**
- ⚙️ `id` (AUTO_INCREMENT) - Tự động tạo
- ⚙️ `date` (DATETIME) - Tự động NOW()

---

## 🎓 Các Cách Sử Dụng

### **1. Manual Testing (Cơ Bản)**
- Chạy từng request một
- Kiểm tra response
- Phù hợp: Development, Debug

### **2. Collection Runner (Tự Động)**
- Chạy tất cả 20 requests cùng lúc
- Tự động validate
- Phù hợp: Testing, Data seeding

### **3. Newman CLI (CI/CD)**
```bash
newman run Insert_Contacts_Collection.json -e BTL_DB_Environment.postman_environment.json
```
- Chạy từ command line
- Tích hợp CI/CD
- Phù hợp: Automation, DevOps

---

## 📚 Hướng Dẫn Học

### **Level 1: Beginner** 🟢
1. Import Collection và Environment
2. Chạy 1 request thử
3. Xem response

### **Level 2: Intermediate** 🟡
1. Chạy Collection Runner
2. Xem Tests results
3. Sửa body request

### **Level 3: Advanced** 🔴
1. Thêm Pre-request Scripts
2. Thêm Tests Scripts
3. Tạo Environment mới (Staging, Production)
4. Dùng Newman CLI

---

## 🐛 Common Issues

| Error | Fix |
|-------|-----|
| Connection refused | Bật XAMPP |
| 404 Not Found | Check URL |
| 400 Bad Request | Check body JSON |
| 500 Server Error | Check database |

👉 Xem chi tiết trong **README_INSERT_CONTACTS.md**

---

## 🎯 Best Practices

1. ✅ Luôn dùng Environment Variables
2. ✅ Thêm Tests cho mỗi request
3. ✅ Validate dữ liệu trong Pre-request
4. ✅ Log kết quả để debug
5. ✅ Sử dụng Collection Runner cho bulk operations

---

## 📞 Support

Có thắc mắc? Đọc theo thứ tự:

1. **QUICK_START.md** - Bắt đầu nhanh
2. **README_INSERT_CONTACTS.md** - Chi tiết đầy đủ
3. **Postman_Scripts.js** - Code examples
4. **INDEX.md** - Tổng quan (file này)

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12-09 | Initial release với 20 requests |

---

## 📝 License

Free to use for BTL Database project

---

**Happy Testing! 🚀**

Made with ❤️ for BTL Database Project
