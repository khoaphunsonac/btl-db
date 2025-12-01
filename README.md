# 🛒 NEMTHUNG E-commerce System

Hệ thống quản lý bán hàng công nghệ trực tuyến với đầy đủ tính năng CRUD cho sản phẩm, khách hàng, đơn hàng, và nhiều hơn nữa.

---

## 📋 Tính năng chính

- ✅ **Quản lý khách hàng** - CRUD đầy đủ với search, filter, pagination
- ✅ **Quản lý sản phẩm** - Sản phẩm, danh mục, biến thể
- ✅ **Quản lý đơn hàng** - Theo dõi đơn hàng, trạng thái
- ✅ **Dashboard thống kê** - Doanh thu, đơn hàng, khách hàng
- ✅ **Mã giảm giá** - Quản lý khuyến mãi
- ✅ **Đánh giá sản phẩm** - Rating và phản hồi
- ✅ **Liên hệ** - Quản lý yêu cầu từ khách hàng

---

## 🚀 Cài đặt nhanh

### 1. Yêu cầu hệ thống
- **XAMPP** (PHP 8.0+, MySQL 5.7+, Apache)
- **Browser** hiện đại (Chrome, Firefox, Edge)

### 2. Cài đặt

```bash
# Clone project
cd C:\xampp\htdocs
git clone <repository-url> btl-db
cd btl-db

# Copy config
copy backend\config\database.example.php backend\config\database.php

# Import database
# Mở phpMyAdmin: http://localhost/phpmyadmin
# Tạo database mới tên: nemthungdb
# Import 2 files SQL theo thứ tự:
#   1. database/nemthungdb.sql
#   2. database/initData.sql
```

### 3. Fix passwords (nếu cần)

Nếu gặp lỗi đăng nhập, chạy script để reset tất cả passwords:

```bash
# Truy cập URL:
http://localhost/btl-db/backend/fix-passwords.php

# Script sẽ:
# 1. Hiển thị tất cả admin accounts
# 2. Kiểm tra password có được hash đúng không
# 3. Click nút "Fix All Passwords" để update tất cả về: 123456
```

**Tài khoản admin mặc định:**
- Email: `admin1@nemthung.com` | Password: `123456` | Role: Quản trị viên
- Email: `admin2@nemthung.com` | Password: `123456` | Role: Quản trị viên

### 4. Chạy ứng dụng

```bash
# Start XAMPP Apache & MySQL

# Frontend Login
http://localhost/btl-db/frontend/

# Admin Dashboard
http://localhost/btl-db/frontend/admin/index.html

# Backend API
http://localhost/btl-db/backend/api/users
```

---

## 📁 Cấu trúc project

```
btl-db/
├── backend/                    # Backend API (PHP)
│   ├── config/                 # Database config
│   ├── controllers/            # Controllers (User, Product, Order...)
│   ├── models/                 # Models (BaseModel + entities)
│   ├── routes/                 # API routing
│   ├── index.php              # Entry point
│   └── fix-passwords.php      # Password reset utility
│
├── frontend/                   # Frontend (HTML/JS/CSS)
│   ├── admin/                  # Admin panel
│   │   ├── customers/         # Customer management
│   │   ├── products/          # Product management (TODO)
│   │   ├── orders/            # Order management (TODO)
│   │   └── index.html         # Dashboard
│   ├── components/            # Reusable components (Sidebar)
│   ├── css/                   # Styles
│   └── js/                    # Shared JS (api-client, utils, config)
│
└── database/                   # Database
    ├── nemthungdb.sql         # Schema
    └── initData.sql           # Sample data
```

---

## 🎯 Modules đã hoàn thành

### ✅ Customer Management
**Location:** `frontend/admin/customers/`

**Features:**
- List với search, filter, sort, pagination
- Thêm/Sửa khách hàng
- Xem chi tiết (thông tin + thống kê + đơn hàng)
- Vô hiệu hóa / Xóa

**Pages:**
- `index.html` - Danh sách
- `edit.html` - Thêm/Sửa
- `detail.html` - Chi tiết

**URL:**
```
http://localhost/btl-db/frontend/admin/customers/index.html
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register      # Đăng ký
POST   /api/auth/login         # Đăng nhập
POST   /api/auth/logout        # Đăng xuất
GET    /api/auth/me            # Thông tin user hiện tại
```

### Customers (Users)
```
GET    /api/users                      # List (với search, filter, sort)
GET    /api/users/statistics           # Thống kê
GET    /api/users/{id}                 # Chi tiết
POST   /api/users                      # Thêm mới
PUT    /api/users/{id}                 # Cập nhật
PUT    /api/users/{id}/status          # Đổi trạng thái
DELETE /api/users/{id}                 # Xóa
```

### Statistics
```
GET    /api/statistics/dashboard       # Dashboard stats
GET    /api/statistics/revenue         # Doanh thu
GET    /api/statistics/products        # Top sản phẩm
GET    /api/statistics/categories      # Theo danh mục
```

**Query Parameters (GET /api/users):**
```javascript
{
  page: 1,              // Trang hiện tại
  limit: 10,            // Số lượng/trang
  search: 'Le',         // Tìm kiếm (name/email/phone)
  status: 'Hoạt động',  // Lọc trạng thái
  sortBy: 'name-asc'    // Sắp xếp
}
```

---

## 🗄️ Database Schema

### Các bảng chính:
- `User_Account` - Tài khoản người dùng
- `Customer` - Khách hàng
- `Admin` - Quản trị viên
- `User` - Thông tin cá nhân
- `Product` - Sản phẩm
- `Product_variant` - Biến thể sản phẩm
- `Category` - Danh mục
- `Order` - Đơn hàng
- `Order_detail` - Chi tiết đơn hàng
- `Discount` - Mã giảm giá
- `Rating` - Đánh giá
- `Contact` - Liên hệ

### Ràng buộc quan trọng:
- Mỗi user phải là Customer HOẶC Admin (totality constraint)
- Password phải có ít nhất 8 ký tự, chữ hoa, chữ thường, số
- Product variant status tự động update dựa vào quantity

---

## 🧪 Testing

### Test API trực tiếp:
```javascript
// Mở Console (F12)
fetch('http://localhost/btl-db/backend/api/users')
  .then(r => r.json())
  .then(console.log)

fetch('http://localhost/btl-db/backend/api/users?search=Le&status=Hoạt động')
  .then(r => r.json())
  .then(console.log)
```

### Sample Data:
Database đã có 5 khách hàng mẫu, 15 sản phẩm, 5 đơn hàng sau khi import `initData.sql`

---

## 🔧 Configuration

### Backend Config
File: `backend/config/database.php`

```php
private $host = 'localhost';
private $dbname = 'nemthungdb';
private $username = 'root';
private $password = '';
```

### Frontend Config
File: `frontend/js/config.js`

```javascript
export const BASE_URL = 'http://localhost/btl-db/backend';
```

---

## 👥 Modules TODO

- [ ] Product Management (CRUD)
- [ ] Category Management
- [ ] Order Management
- [ ] Discount Management
- [ ] Rating Management
- [ ] Contact Management
- [ ] Reports & Analytics

---

## 🐛 Troubleshooting

### Lỗi: Login failed / Password không đúng
**Giải pháp:**
1. Truy cập: `http://localhost/btl-db/backend/fix-passwords.php`
2. Click nút **"Fix All Passwords"** để reset tất cả passwords về `123456`
3. Login lại với:
   - Email: `admin1@nemthung.com`
   - Password: `123456`

**Lưu ý:** Script này sẽ tự động hash password bằng bcrypt và update vào database.

### Lỗi: Cannot connect to database
**Giải pháp:**
1. Kiểm tra XAMPP MySQL đang chạy
2. Kiểm tra `backend/config/database.php` đã tạo chưa
3. Kiểm tra database `nemthungdb` đã import chưa

### Lỗi: API trả về HTML error
**Giải pháp:**
1. Check `backend/error.log`
2. Đảm bảo `display_errors = 0` trong `backend/index.php`
3. Check CORS headers

### Lỗi: Empty results khi search/filter
**Giải pháp:**
1. Mở Developer Tools (F12) → Network tab
2. Check request URL có params đúng không
3. Check response data
4. Verify database có data matching

### Lỗi: Frontend không load
**Giải pháp:**
1. Check Console (F12) có lỗi JavaScript không
2. Verify path đến `api-client.js`, `config.js` đúng
3. Check CORS settings

---

## 📚 Tech Stack

**Backend:**
- PHP 8.0+
- MySQL 5.7+
- PDO (Database access)
- REST API architecture
- MVC pattern

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Tabler UI framework
- Tabler Icons
- Fetch API
- Module imports

**Database:**
- MySQL
- InnoDB engine
- UTF-8 encoding
- Foreign key constraints
- Triggers

---

## 🎓 Best Practices

### Backend:
- ✅ Singleton Database connection
- ✅ BaseModel for common CRUD
- ✅ Prepared statements (SQL injection prevention)
- ✅ Password hashing
- ✅ Error logging (not display)
- ✅ JSON responses
- ✅ CORS handling

### Frontend:
- ✅ Centralized API client
- ✅ Reusable components
- ✅ Utility functions
- ✅ Toast notifications
- ✅ Loading states
- ✅ Form validation
- ✅ Responsive design

---

## 📝 Git Workflow

```bash
# Pull latest
git pull origin main

# Create feature branch
git checkout -b feature/product-management

# Make changes...

# Commit
git add .
git commit -m "feat: implement product CRUD"

# Push
git push origin feature/product-management

# Create Pull Request on GitHub
```

---

## 📄 License

Copyright © 2024 NEMTHUNG Team. All rights reserved.

---

## 👨‍💻 Team

Project developed for BTL Database Course.

---

## 📞 Support

Nếu gặp vấn đề:
1. Check các file log: `backend/error.log`
2. Check Console (F12) trong browser
3. Check Network tab để xem API requests
4. Xem phần **🐛 Troubleshooting** ở trên

---

**Version:** 1.0.0  
**Last Updated:** November 2024  
**Status:** ✅ Customer Management Complete | 🚧 Other modules in progress
