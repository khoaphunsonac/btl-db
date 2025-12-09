# 📦 Postman Insert Contacts - Ready to Use

## ✅ **Package Đã Sẵn Sàng**

Insert contacts đã hoạt động thành công! Package này chứa:

---

## 📁 **Files Chính**

### **1. Insert_Contacts_Collection.json**
- Postman Collection với 20 requests INSERT mẫu
- Tự động xử lý customer_id
- Sẵn sàng import và sử dụng

### **2. BTL_DB_Environment.postman_environment.json**
- Environment variables cho Postman
- Base URL và các biến cần thiết

### **3. QUICK_START.md**
- Hướng dẫn bắt đầu nhanh trong 3 bước
- Dành cho người mới

### **4. README_INSERT_CONTACTS.md**
- Hướng dẫn chi tiết đầy đủ
- Format dữ liệu, troubleshooting, Newman CLI

### **5. Postman_Scripts.js**
- 10+ scripts mẫu
- Tests, validation, monitoring
- Copy vào Postman để tự động hóa

### **6. INDEX.md**
- Tổng quan về package
- Cấu trúc và cách sử dụng

---

## 🚀 **Quick Start**

### **Import vào Postman:**
1. File → Import
2. Chọn `Insert_Contacts_Collection.json`
3. Chọn `BTL_DB_Environment.postman_environment.json`

### **Sử dụng:**
```json
POST http://localhost/btl-db/backend/routes/api.php/contacts
Content-Type: application/json

{
  "content": "Nội dung liên hệ"
}
```

**Không cần gửi customer_id** - tự động xử lý!

---

## 📊 **Features**

- ✅ **20 requests INSERT** đa dạng
- ✅ **Auto customer_id** - không cần lo về foreign key
- ✅ **Environment variables** - dễ chuyển đổi môi trường
- ✅ **Tests tự động** - validate response
- ✅ **Error handling** - xử lý lỗi rõ ràng
- ✅ **Newman support** - chạy từ command line

---

## 🎯 **Request Format**

**Tối thiểu:**
```json
{
  "content": "Nội dung liên hệ"
}
```

**Với customer_id:**
```json
{
  "customer_id": 101,
  "content": "Nội dung liên hệ"
}
```

**Với message field (alias):**
```json
{
  "message": "Nội dung liên hệ"
}
```

---

## 📝 **Response Format**

**Success (201 Created):**
```json
{
  "success": true,
  "message": "Gửi yêu cầu liên hệ thành công",
  "data": {
    "id": 4,
    "customer_id": 101,
    "content": "Nội dung liên hệ",
    "date": "2024-12-09 11:43:00"
  }
}
```

---

## 🛠️ **Troubleshooting**

### **Connection refused**
→ Bật XAMPP (Apache + MySQL)

### **404 Not Found**
→ Check URL trong Environment

### **400 Bad Request**
→ Thiếu trường `content`

### **500 Server Error**
→ Check error log: `C:\xampp\apache\logs\error.log`

---

## 📚 **Documentation**

- **Beginner:** Đọc `QUICK_START.md`
- **Advanced:** Đọc `README_INSERT_CONTACTS.md`
- **Scripts:** Xem `Postman_Scripts.js`
- **Overview:** Xem `INDEX.md`

---

## 🎉 **Ready to Go!**

Package đã được dọn dẹp và sẵn sàng sử dụng production.

**Happy Testing! 🚀**
