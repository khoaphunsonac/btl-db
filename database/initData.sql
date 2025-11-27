-- ============================================
-- NEMTHUNG E-commerce - Initial Sample Data
-- Database: nemthungdb
-- Description: Insert sample data for all tables
-- Minimum: 5 records per table
-- ============================================

USE nemthungdb;

-- Disable foreign key checks for easier insertion
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 1. USER ACCOUNTS (Base accounts)
-- Password: Admin@123 (hashed - meet policy requirements)
-- ============================================
INSERT INTO User_Account (id, email, password, status, last_login) VALUES
(1, 'admin1@nemthung.com', 'Admin@123', 'Hoạt động', '2024-11-27 08:00:00'),
(2, 'admin2@nemthung.com', 'Admin@123', 'Hoạt động', '2024-11-26 10:00:00'),
(3, 'customer1@gmail.com', 'Customer@123', 'Hoạt động', '2024-11-27 07:30:00'),
(4, 'customer2@gmail.com', 'Customer@123', 'Hoạt động', '2024-11-25 14:20:00'),
(5, 'customer3@gmail.com', 'Customer@123', 'Hoạt động', '2024-11-24 16:45:00'),
(6, 'customer4@gmail.com', 'Customer@123', 'Hoạt động', '2024-11-23 09:15:00'),
(7, 'customer5@gmail.com', 'Customer@123', 'Ngưng hoạt động', '2024-08-15 11:00:00'),
(8, 'warehousestaff@nemthung.com', 'Warehouse@123', 'Hoạt động', '2024-11-27 06:00:00');

-- ============================================
-- 2. ADMIN (Admins - id 1, 2, 8)
-- ============================================
INSERT INTO Admin (id, role) VALUES
(1, 'Quản trị viên'),
(2, 'Quản trị viên'),
(8, 'Nhân viên kho');

-- ============================================
-- 3. CUSTOMER (Customers - id 3, 4, 5, 6, 7)
-- ============================================
INSERT INTO Customer (id) VALUES
(3),
(4),
(5),
(6),
(7);

-- ============================================
-- 4. USER (User details for all accounts)
-- ============================================
INSERT INTO User (id, account_id, fname, lname, address, phone) VALUES
(1, 1, 'Nguyễn', 'Văn Admin', '123 Đường Láng, Đống Đa, Hà Nội', '0901234567'),
(2, 2, 'Trần', 'Thị Quản Lý', '456 Giải Phóng, Hai Bà Trưng, Hà Nội', '0902345678'),
(3, 3, 'Lê', 'Văn Khách', '789 Nguyễn Trãi, Thanh Xuân, Hà Nội', '0903456789'),
(4, 4, 'Phạm', 'Thị Hoa', '321 Cầu Giấy, Cầu Giấy, Hà Nội', '0904567890'),
(5, 5, 'Hoàng', 'Văn Nam', '654 Láng Hạ, Ba Đình, Hà Nội', '0905678901'),
(6, 6, 'Đặng', 'Thị Mai', '987 Xã Đàn, Đống Đa, Hà Nội', '0906789012'),
(7, 7, 'Vũ', 'Văn Inactive', '147 Kim Mã, Ba Đình, Hà Nội', '0907890123'),
(8, 8, 'Bùi', 'Văn Kho', '258 Tôn Đức Thắng, Đống Đa, Hà Nội', '0908901234');

-- ============================================
-- 5. CATEGORY (Hierarchical categories)
-- ============================================
INSERT INTO Category (id, name, parent_id) VALUES
-- Level 1: Main categories
(1, 'Laptop', NULL),
(2, 'PC - Máy tính bàn', NULL),
(3, 'Linh kiện máy tính', NULL),
(4, 'Thiết bị ngoại vi', NULL),
(5, 'Phụ kiện', NULL),

-- Level 2: Laptop subcategories
(6, 'Laptop Gaming', 1),
(7, 'Laptop Văn phòng', 1),
(8, 'Laptop Đồ họa', 1),

-- Level 2: PC subcategories
(9, 'PC Gaming', 2),
(10, 'PC Văn phòng', 2),

-- Level 2: Linh kiện subcategories
(11, 'CPU - Bộ vi xử lý', 3),
(12, 'VGA - Card màn hình', 3),
(13, 'RAM - Bộ nhớ', 3),
(14, 'SSD - Ổ cứng', 3),

-- Level 2: Ngoại vi subcategories
(15, 'Bàn phím', 4),
(16, 'Chuột', 4),
(17, 'Tai nghe', 4),
(18, 'Webcam', 4);

-- ============================================
-- 6. PRODUCT (Products - Laptops, Components, etc.)
-- ============================================
INSERT INTO Product (id, name, trademark, cost_current, cost_old, description, status, overall_rating_star, rating_count) VALUES
-- Laptops
(1, 'ASUS ROG Strix G15 G513', 'ASUS', 25990000, 29990000, 'Laptop gaming AMD Ryzen 7, RTX 3060, 15.6" 144Hz', 'Còn hàng', 4.5, 12),
(2, 'Dell Inspiron 15 3520', 'Dell', 14990000, 16990000, 'Laptop văn phòng Intel Core i5, 8GB RAM, 512GB SSD', 'Còn hàng', 4.2, 8),
(3, 'MSI Creator Z16P', 'MSI', 45990000, 49990000, 'Laptop đồ họa Intel Core i7, RTX 3080, 16" QHD+', 'Còn hàng', 4.8, 5),
(4, 'Lenovo ThinkPad E14', 'Lenovo', 18990000, 21990000, 'Laptop doanh nhân Intel Core i7, 16GB RAM', 'Còn hàng', 4.3, 15),
(5, 'Acer Nitro 5 AN515', 'Acer', 22990000, 25990000, 'Laptop gaming Intel Core i5, RTX 3050, 15.6" 144Hz', 'Còn hàng', 4.4, 20),

-- Components
(6, 'Intel Core i9-13900K', 'Intel', 14990000, 16990000, 'CPU Intel thế hệ 13, 24 nhân 32 luồng, 5.8GHz', 'Còn hàng', 4.9, 25),
(7, 'AMD Ryzen 9 7950X', 'AMD', 18990000, 20990000, 'CPU AMD Zen 4, 16 nhân 32 luồng, 5.7GHz', 'Còn hàng', 4.8, 18),
(8, 'NVIDIA RTX 4070 Ti', 'NVIDIA', 24990000, 27990000, 'VGA NVIDIA Ada Lovelace, 12GB GDDR6X', 'Còn hàng', 4.7, 30),
(9, 'Corsair Vengeance 32GB', 'Corsair', 3990000, 4590000, 'RAM DDR5 32GB (2x16GB) 6000MHz RGB', 'Còn hàng', 4.6, 22),
(10, 'Samsung 990 PRO 2TB', 'Samsung', 5990000, 6990000, 'SSD NVMe Gen4 2TB, đọc 7450MB/s', 'Còn hàng', 4.9, 40),

-- Peripherals
(11, 'Logitech G Pro X', 'Logitech', 2990000, 3490000, 'Bàn phím cơ gaming, switch GX Blue', 'Còn hàng', 4.5, 35),
(12, 'Razer DeathAdder V3', 'Razer', 1990000, 2490000, 'Chuột gaming không dây, 30K DPI', 'Còn hàng', 4.6, 28),
(13, 'HyperX Cloud III', 'HyperX', 2490000, 2990000, 'Tai nghe gaming 7.1 surround sound', 'Còn hàng', 4.4, 18),
(14, 'Logitech C920 HD Pro', 'Logitech', 1790000, 2190000, 'Webcam Full HD 1080p, autofocus', 'Còn hàng', 4.3, 12),
(15, 'ASUS TUF Gaming VG27AQ', 'ASUS', 7990000, 8990000, 'Màn hình gaming 27" 2K 165Hz IPS', 'Còn hàng', 4.7, 16);

-- ============================================
-- 7. PRODUCT_CATEGORIZE (Product-Category mapping)
-- ============================================
INSERT INTO Product_categorize (product_id, category_id) VALUES
-- Laptops
(1, 6),  -- ASUS ROG -> Laptop Gaming
(2, 7),  -- Dell Inspiron -> Laptop Văn phòng
(3, 8),  -- MSI Creator -> Laptop Đồ họa
(4, 7),  -- ThinkPad -> Laptop Văn phòng
(5, 6),  -- Acer Nitro -> Laptop Gaming

-- Components
(6, 11), -- Intel i9 -> CPU
(7, 11), -- AMD Ryzen -> CPU
(8, 12), -- RTX 4070 -> VGA
(9, 13), -- Corsair RAM -> RAM
(10, 14), -- Samsung SSD -> SSD

-- Peripherals
(11, 15), -- Logitech Keyboard -> Bàn phím
(12, 16), -- Razer Mouse -> Chuột
(13, 17), -- HyperX Headset -> Tai nghe
(14, 18), -- Webcam -> Webcam
(15, 4);  -- Monitor -> Thiết bị ngoại vi

-- ============================================
-- 8. PRODUCT_VARIANT (Product variants - colors)
-- ============================================
INSERT INTO Product_variant (id, product_id, quantity, color, status) VALUES
-- Laptop variants
(1, 1, 15, 'Đen', 'Còn hàng'),
(2, 1, 8, 'Xám', 'Còn hàng'),
(3, 2, 20, 'Bạc', 'Còn hàng'),
(4, 2, 12, 'Đen', 'Còn hàng'),
(5, 3, 5, 'Xám Titanium', 'Còn hàng'),

-- Component variants
(6, 6, 30, 'Box', 'Còn hàng'),
(7, 7, 25, 'Box', 'Còn hàng'),
(8, 8, 18, 'Đen', 'Còn hàng'),
(9, 9, 40, 'Đen RGB', 'Còn hàng'),
(10, 10, 35, 'Heatsink', 'Còn hàng'),

-- Peripheral variants
(11, 11, 22, 'Đen', 'Còn hàng'),
(12, 12, 28, 'Đen', 'Còn hàng'),
(13, 12, 15, 'Trắng', 'Còn hàng'),
(14, 13, 20, 'Đen/Đỏ', 'Còn hàng'),
(15, 14, 18, 'Đen', 'Còn hàng'),
(16, 15, 10, 'Đen', 'Còn hàng'),
(17, 4, 25, 'Đen', 'Còn hàng'),
(18, 5, 18, 'Đen', 'Còn hàng');

-- ============================================
-- 9. PRODUCT_VARIANT_PICTURE (Product images)
-- ============================================
INSERT INTO Product_variant_picture (id, product_variant_id, url_path) VALUES
-- ASUS ROG images
(1, 1, '/images/products/asus-rog-g15-black-1.jpg'),
(2, 1, '/images/products/asus-rog-g15-black-2.jpg'),
(3, 2, '/images/products/asus-rog-g15-gray-1.jpg'),

-- Dell Inspiron images
(1, 3, '/images/products/dell-inspiron-silver-1.jpg'),
(2, 3, '/images/products/dell-inspiron-silver-2.jpg'),
(1, 4, '/images/products/dell-inspiron-black-1.jpg'),

-- CPU images
(1, 6, '/images/products/intel-i9-13900k-1.jpg'),
(2, 6, '/images/products/intel-i9-13900k-2.jpg'),
(1, 7, '/images/products/amd-ryzen-7950x-1.jpg'),

-- VGA images
(1, 8, '/images/products/rtx-4070ti-1.jpg'),
(2, 8, '/images/products/rtx-4070ti-2.jpg'),

-- Peripheral images
(1, 11, '/images/products/logitech-gpro-1.jpg'),
(1, 12, '/images/products/razer-deathadder-black-1.jpg'),
(1, 13, '/images/products/razer-deathadder-white-1.jpg'),
(1, 14, '/images/products/hyperx-cloud3-1.jpg'),
(1, 15, '/images/products/logitech-c920-1.jpg');

-- ============================================
-- 10. PRODUCT_ATTRIBUTE (Product specifications)
-- ============================================
INSERT INTO Product_attribute (id, product_id, name, `value`) VALUES
-- ASUS ROG Strix attributes
(1, 1, 'CPU', 'AMD Ryzen 7 5800H'),
(2, 1, 'VGA', 'NVIDIA RTX 3060 6GB'),
(3, 1, 'RAM', '16GB DDR4'),
(4, 1, 'Storage', '512GB SSD'),
(5, 1, 'Display', '15.6" FHD 144Hz'),

-- Intel i9 attributes
(1, 6, 'Cores', '24 cores (8P + 16E)'),
(2, 6, 'Threads', '32 threads'),
(3, 6, 'Base Clock', '3.0 GHz'),
(4, 6, 'Boost Clock', '5.8 GHz'),
(5, 6, 'TDP', '125W'),

-- RTX 4070 Ti attributes
(1, 8, 'CUDA Cores', '7680'),
(2, 8, 'Memory', '12GB GDDR6X'),
(3, 8, 'Memory Bus', '192-bit'),
(4, 8, 'Boost Clock', '2610 MHz'),
(5, 8, 'TDP', '285W'),

-- Samsung SSD attributes
(1, 10, 'Capacity', '2TB'),
(2, 10, 'Interface', 'PCIe 4.0 x4 NVMe'),
(3, 10, 'Read Speed', '7450 MB/s'),
(4, 10, 'Write Speed', '6900 MB/s'),
(5, 10, 'Form Factor', 'M.2 2280'),

-- Logitech Keyboard attributes
(1, 11, 'Switch Type', 'GX Blue Clicky'),
(2, 11, 'Lighting', 'RGB per-key'),
(3, 11, 'Connection', 'Wired USB'),
(4, 11, 'Layout', 'TKL (Tenkeyless)'),
(5, 11, 'Keycaps', 'PBT Double-shot');

-- ============================================
-- 11. DISCOUNT (Discount codes)
-- ============================================
INSERT INTO Discount (id, `value`, `condition`, time_start, time_end, type) VALUES
(1, 500000, 'Đơn hàng từ 10.000.000đ', '2024-11-01 00:00:00', '2024-12-31 23:59:59', 'Giá trị'),
(2, 10, 'Đơn hàng từ 5.000.000đ', '2024-11-15 00:00:00', '2024-12-15 23:59:59', 'Phần trăm'),
(3, 1000000, 'Đơn hàng từ 20.000.000đ', '2024-11-20 00:00:00', '2024-12-20 23:59:59', 'Giá trị'),
(4, 15, 'Đơn hàng từ 15.000.000đ', '2024-11-01 00:00:00', '2024-11-30 23:59:59', 'Phần trăm'),
(5, 200000, 'Đơn hàng từ 3.000.000đ', '2024-11-25 00:00:00', '2024-12-25 23:59:59', 'Giá trị');

-- ============================================
-- 12. ORDER (Customer orders)
-- ============================================
INSERT INTO `Order` (id, customer_id, address, date, payment_method, total_amount, total_cost, payment_status) VALUES
(1, 3, '789 Nguyễn Trãi, Thanh Xuân, Hà Nội', '2024-11-20 10:30:00', 'Chuyển khoản', 1, 25990000, 'Đã thanh toán'),
(2, 4, '321 Cầu Giấy, Cầu Giấy, Hà Nội', '2024-11-22 14:15:00', 'COD', 2, 19980000, 'Chưa thanh toán'),
(3, 5, '654 Láng Hạ, Ba Đình, Hà Nội', '2024-11-23 16:45:00', 'Chuyển khoản', 1, 14990000, 'Đã thanh toán'),
(4, 6, '987 Xã Đàn, Đống Đa, Hà Nội', '2024-11-25 09:20:00', 'Ví điện tử', 3, 33970000, 'Đã thanh toán'),
(5, 3, '789 Nguyễn Trãi, Thanh Xuân, Hà Nội', '2024-11-26 11:00:00', 'Chuyển khoản', 2, 9980000, 'Chưa thanh toán');

-- ============================================
-- 13. ORDER_DETAIL (Order items)
-- ============================================
INSERT INTO Order_detail (id, order_id, product_variant_id, quantity, price_at_order) VALUES
-- Order 1: ASUS ROG
(1, 1, 1, 1, 25990000),

-- Order 2: Dell Inspiron x2
(1, 2, 3, 2, 14990000),

-- Order 3: Intel i9
(1, 3, 6, 1, 14990000),

-- Order 4: RTX 4070 Ti + RAM + SSD
(1, 4, 8, 1, 24990000),
(2, 4, 9, 1, 3990000),
(3, 4, 10, 1, 5990000),

-- Order 5: Keyboard + Mouse
(1, 5, 11, 1, 2990000),
(2, 5, 12, 2, 1990000);

-- ============================================
-- 14. ORDER_STATUS_LOG (Order status history)
-- ============================================
INSERT INTO Order_status_log (id, order_id, status, time) VALUES
-- Order 1
(1, 1, 'Chờ xử lí', '2024-11-20 10:30:00'),
(2, 1, 'Đã xác nhận', '2024-11-20 11:00:00'),
(3, 1, 'Đang xử lí', '2024-11-20 14:00:00'),
(4, 1, 'Hoàn thành', '2024-11-22 16:30:00'),

-- Order 2
(1, 2, 'Chờ xử lí', '2024-11-22 14:15:00'),
(2, 2, 'Đã xác nhận', '2024-11-22 15:00:00'),

-- Order 3
(1, 3, 'Chờ xử lí', '2024-11-23 16:45:00'),
(2, 3, 'Đã xác nhận', '2024-11-23 17:00:00'),
(3, 3, 'Hoàn thành', '2024-11-25 10:00:00'),

-- Order 4
(1, 4, 'Chờ xử lí', '2024-11-25 09:20:00'),
(2, 4, 'Đã xác nhận', '2024-11-25 10:00:00'),
(3, 4, 'Đang xử lí', '2024-11-25 14:00:00'),

-- Order 5
(1, 5, 'Chờ xử lí', '2024-11-26 11:00:00');

-- ============================================
-- 15. DISCOUNT_ORDER (Applied discounts)
-- ============================================
INSERT INTO Discount_order (order_id, discount_id) VALUES
(1, 1), -- Order 1 applied discount 1
(3, 1), -- Order 3 applied discount 1
(4, 3), -- Order 4 applied discount 3
(2, 2), -- Order 2 applied discount 2
(5, 5); -- Order 5 applied discount 5

-- ============================================
-- 16. RATING (Product ratings by customers)
-- ============================================
INSERT INTO Rating (id, customer_id, product_id, comment_content, date, star) VALUES
-- ASUS ROG ratings
(1, 3, 1, 'Laptop chơi game rất mượt, màn hình đẹp, hiệu năng tốt!', '2024-11-23 09:00:00', 5),
(2, 5, 1, 'Thiết kế đẹp, nhiệt độ ổn định khi chơi game nặng.', '2024-11-24 14:30:00', 4),

-- Dell Inspiron ratings
(1, 4, 2, 'Laptop văn phòng tốt, pin trâu, giá hợp lý.', '2024-11-23 10:15:00', 4),
(2, 6, 2, 'Màn hình hơi tối, nhưng cấu hình ổn cho công việc.', '2024-11-25 16:20:00', 4),

-- Intel i9 ratings
(1, 5, 6, 'CPU mạnh mẽ, đa nhiệm tốt, overclock dễ dàng!', '2024-11-24 11:00:00', 5),
(2, 3, 6, 'Hiệu năng cực khủng, render video nhanh gấp đôi.', '2024-11-25 13:45:00', 5),

-- RTX 4070 Ti ratings
(1, 6, 8, 'Card đồ họa tuyệt vời, chơi game 2K mượt 144fps!', '2024-11-26 10:30:00', 5),
(2, 4, 8, 'Thiết kế đẹp, hiệu năng tốt nhưng hơi nóng.', '2024-11-26 15:00:00', 4),

-- Samsung SSD ratings
(1, 3, 10, 'SSD siêu nhanh, boot Windows chỉ 5 giây!', '2024-11-24 08:00:00', 5),
(2, 5, 10, 'Tốc độ đọc ghi ấn tượng, đáng đồng tiền.', '2024-11-25 09:30:00', 5);

-- ============================================
-- 17. RATING_PICTURE (Rating images)
-- ============================================
INSERT INTO Rating_picture (id, rating_id, product_id, url_path) VALUES
-- ASUS ROG rating images
(1, 1, 1, '/images/ratings/asus-rog-rating-1-1.jpg'),
(2, 1, 1, '/images/ratings/asus-rog-rating-1-2.jpg'),
(1, 2, 1, '/images/ratings/asus-rog-rating-2-1.jpg'),

-- RTX 4070 Ti rating images
(1, 1, 8, '/images/ratings/rtx4070ti-rating-1-1.jpg'),
(2, 1, 8, '/images/ratings/rtx4070ti-rating-1-2.jpg'),

-- Samsung SSD rating images
(1, 1, 10, '/images/ratings/samsung-ssd-rating-1-1.jpg'),
(1, 2, 10, '/images/ratings/samsung-ssd-rating-2-1.jpg');

-- ============================================
-- 18. ADMIN_RATING_RESPONSE (Admin responses)
-- ============================================
INSERT INTO Admin_rating_response (rating_id, product_id, admin_id, response_content, date) VALUES
(1, 1, 1, 'Cảm ơn bạn đã tin tưởng NEMTHUNG! Chúc bạn có trải nghiệm gaming tuyệt vời!', '2024-11-23 10:00:00'),
(1, 6, 2, 'Rất vui khi sản phẩm đáp ứng được nhu cầu của bạn. Cảm ơn đã mua hàng!', '2024-11-24 12:00:00'),
(1, 8, 1, 'Cảm ơn review chi tiết! Chúng tôi sẽ cải thiện tản nhiệt ở phiên bản sau.', '2024-11-26 11:00:00'),
(1, 10, 2, 'Samsung 990 PRO thực sự là lựa chọn tốt nhất hiện nay. Cảm ơn bạn!', '2024-11-24 09:00:00'),
(2, 2, 1, 'Cảm ơn góp ý về màn hình. Bạn có thể điều chỉnh độ sáng trong settings nhé!', '2024-11-25 17:00:00');

-- ============================================
-- 19. CONTACT (Customer support requests)
-- ============================================
INSERT INTO Contact (id, customer_id, content, date) VALUES
(1, 3, 'Tôi muốn hỏi về chính sách bảo hành của laptop ASUS ROG?', '2024-11-20 09:00:00'),
(2, 4, 'Có thể đổi trả sản phẩm trong vòng bao lâu?', '2024-11-21 10:30:00'),
(3, 5, 'Khi nào có hàng RTX 4090? Tôi muốn đặt trước.', '2024-11-22 14:15:00'),
(4, 6, 'Tôi gặp lỗi khi thanh toán online, làm sao để khắc phục?', '2024-11-23 16:45:00'),
(5, 3, 'Có thể mua trả góp 0% không? Điều kiện như thế nào?', '2024-11-24 11:20:00');

-- ============================================
-- 20. ADMIN_CONTACT_RESPONSE (Admin replies)
-- ============================================
INSERT INTO Admin_contact_response (contact_id, admin_id, response_content, date) VALUES
(1, 1, 'Laptop ASUS ROG được bảo hành 24 tháng chính hãng. Linh kiện điện tử bảo hành 12 tháng.', '2024-11-20 10:00:00'),
(2, 2, 'Quý khách có thể đổi trả trong vòng 7 ngày nếu sản phẩm còn nguyên seal, đầy đủ phụ kiện.', '2024-11-21 11:00:00'),
(3, 1, 'RTX 4090 dự kiến về hàng cuối tháng 12. Quý khách để lại SĐT để được thông báo sớm nhất.', '2024-11-22 15:00:00'),
(4, 2, 'Vui lòng kiểm tra OTP và hạn mức thẻ. Nếu vẫn lỗi, hãy liên hệ hotline: 1900-xxxx.', '2024-11-23 17:00:00'),
(5, 1, 'NEMTHUNG hỗ trợ trả góp 0% qua các công ty tài chính. Điều kiện: CMND + hợp đồng lao động.', '2024-11-24 12:00:00');

-- ============================================
-- Re-enable foreign key checks
-- ============================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- Verification Queries
-- ============================================
SELECT 'Data insertion completed!' as Status;

SELECT 'User Accounts' as Table_Name, COUNT(*) as Record_Count FROM User_Account
UNION ALL
SELECT 'Admins', COUNT(*) FROM Admin
UNION ALL
SELECT 'Customers', COUNT(*) FROM Customer
UNION ALL
SELECT 'Users', COUNT(*) FROM User
UNION ALL
SELECT 'Categories', COUNT(*) FROM Category
UNION ALL
SELECT 'Products', COUNT(*) FROM Product
UNION ALL
SELECT 'Product Variants', COUNT(*) FROM Product_variant
UNION ALL
SELECT 'Product Images', COUNT(*) FROM Product_variant_picture
UNION ALL
SELECT 'Product Attributes', COUNT(*) FROM Product_attribute
UNION ALL
SELECT 'Discounts', COUNT(*) FROM Discount
UNION ALL
SELECT 'Orders', COUNT(*) FROM `Order`
UNION ALL
SELECT 'Order Details', COUNT(*) FROM Order_detail
UNION ALL
SELECT 'Order Status Logs', COUNT(*) FROM Order_status_log
UNION ALL
SELECT 'Discount Orders', COUNT(*) FROM Discount_order
UNION ALL
SELECT 'Ratings', COUNT(*) FROM Rating
UNION ALL
SELECT 'Rating Pictures', COUNT(*) FROM Rating_picture
UNION ALL
SELECT 'Admin Rating Responses', COUNT(*) FROM Admin_rating_response
UNION ALL
SELECT 'Contacts', COUNT(*) FROM Contact
UNION ALL
SELECT 'Admin Contact Responses', COUNT(*) FROM Admin_contact_response;

-- ============================================
-- END OF INITIAL DATA
-- ============================================
