-- ==========================================
-- INSERT DATA
-- ==========================================

-- Account
INSERT INTO User_Account (id, email, password, status) VALUES
(1, 'admin.gear@shop.vn', '123456', 'Hoạt động'),        
(2, 'stock.staff@shop.vn', 'Staff456', 'Hoạt động'),       
(3, 'khachhang.vip@gmail.com', 'KhachHang789', 'Hoạt động'), 
(4, 'tranvanduy@gmail.com', 'Duy900123', 'Hoạt động'),    
(5, 'lenguyenthao@gmail.com', 'Thao333333', 'Hoạt động'), 
(6, 'phamanh@hotmail.com', 'PhamAnh99', 'Ngưng hoạt động'),
(7, 'ngocnguyen@gmail.com', 'Ngoc000000', 'Hoạt động'),    
(8, 'hoangthien@yahoo.com', 'Thien11111', 'Hoạt động'),  
(9, 'maivan@gmail.com', 'MaiVan222', 'Hoạt động'),        
(10, 'truonggiang@gmail.com', 'Giang3333', 'Hoạt động'),
(11, 'thanhdat@gmail.com', 'ThanhDat4', 'Hoạt động'),     
(12, 'huyenmy@gmail.com', 'Huyen5555', 'Hoạt động'),    
(13, 'vietanh@gmail.com', 'VietAnh66', 'Hoạt động'),    
(14, 'phuonglinh@gmail.com', 'Linh77777', 'Hoạt động'),  
(15, 'baotran@gmail.com', 'BaoTran888', 'Hoạt động'),
(16, 'admin2.gear@shop.vn', 'Admin123', 'Hoạt động'), 
(17, 'admin3.gear@shop.vn', 'Admin123', 'Hoạt động'), 
(18, 'stock2.staff@shop.vn', 'Staff456', 'Hoạt động'); 

-- Admin
INSERT INTO Admin (id, role) VALUES
(1, 'Quản trị viên'),
(2, 'Nhân viên kho'),
(16, 'Quản trị viên'),
(17, 'Quản trị viên'),
(18, 'Nhân viên kho');
-- Customer
INSERT INTO Customer (id) VALUES
(3), (4), (5), (6), (7), (8), (9), (10), (11), (12), (13), (14), (15);

-- User
INSERT INTO User (account_id, fname, lname, address, phone) VALUES
(1, 'Nguyễn', 'Thanh', '123 Đường Công Nghệ, TP.HCM', '0901234567'), 
(3, 'Lê', 'Hoàng', '456 Phố Điện Tử, Hà Nội', '0912345678'), 
(4, 'Trần', 'Duy', '789 Hẻm Laptop, Đà Nẵng', '0987654321'),
(5, 'Lê', 'Thảo', '101 Đường Gaming, Hải Phòng', '0976543210'),
(6, 'Phạm', 'Anh', '202 Ngõ Chuột, Cần Thơ', '0965432109'),
(7, 'Nguyễn', 'Ngọc', '303 Phố Màn Hình, Bình Dương', '0954321098'),
(8, 'Hoàng', 'Thiện', '404 Đường Bàn Phím, Đồng Nai', '0943210987'),
(9, 'Mai', 'Vân', '505 Khu Tản Nhiệt, Vũng Tàu', '0932109876'),
(10, 'Trường', 'Giang', '606 Lô Chip, Huế', '0921098765'),
(11, 'Thanh', 'Đạt', '707 Đường RAM, Nha Trang', '0910987654');

-- Category 
INSERT INTO Category (id, name, parent_id) VALUES
(1, 'Laptop Gaming', NULL),           
(2, 'Laptop Văn Phòng', NULL),       
(3, 'Linh Kiện PC', NULL),            
(4, 'Laptop Gaming MSI', 1),      
(5, 'Laptop Gaming Lenovo', 1),   
(6, 'Case PC', 3),                  
(7, 'Card Màn Hình', 3),             
(8, 'Laptop Ultrabook', 2),          
(9, 'Laptop Macbook', 2),             
(10, 'Ổ Cứng SSD', 3);                

-- Product
INSERT INTO Product (id, name, trademark, cost_current, cost_old, description) VALUES
(101, 'Laptop Gaming Legion 2024 (i9/RTX4080)', 'Lenovo', 65000000.00, 70000000.00, 'Mẫu laptop gaming flagship với hiệu năng tuyệt đối.'),
(102, 'Laptop Văn Phòng SlimBook Pro', 'Dell', 18500000.00, 20000000.00, 'Thiết kế mỏng nhẹ, pin trâu, phù hợp cho công việc văn phòng.'),
(103, 'Card Đồ Họa RTX 4070Ti Ultimate', 'GIGABYTE', 25000000.00, NULL, 'Card đồ họa hiệu suất cao cho game thủ và creator.'),
(104, 'SSD NVMe Gen4 1TB tốc độ cao', 'Samsung', 2100000.00, 2500000.00, 'Ổ cứng tốc độ đọc/ghi cực nhanh.'),
(105, 'Laptop Gaming giá rẻ RYZEN', 'Lenovo', 16000000.00, 17500000.00, 'Hiệu năng gaming tốt trong tầm giá phổ thông.'),
(106, 'PC Gaming i5 Gen 14th', 'Custom GearVN', 28000000.00, 30000000.00, 'Máy bộ đã tối ưu sẵn cho chơi game và stream.'),
(107, 'Laptop 2-in-1 Flex 14', 'HP', 15500000.00, NULL, 'Laptop xoay gập linh hoạt, cảm ứng.'),
(108, 'Laptop Ultrabook XPS 13', 'Dell', 32000000.00, 35000000.00, 'Màn hình vô cực, thiết kế sang trọng, pin bền.'),
(109, 'PC Văn Phòng Mini', 'ACER', 9000000.00, NULL, 'Máy tính để bàn nhỏ gọn, tiết kiệm không gian.'),
(110, 'Card Màn Hình GTX 1650', 'MSI', 4500000.00, 5000000.00, 'Card màn hình cơ bản cho eSports.'),
(111, 'SSD SATA 512GB', 'Kingston', 800000.00, NULL, 'Ổ cứng SSD dung lượng vừa phải, tốc độ ổn định.'),
(112, 'Laptop Gaming Phổ Thông (i5/RTX3050)', 'Acer Nitro', 21000000.00, 23000000.00, 'Laptop gaming tầm trung, hiệu năng cân bằng.');

INSERT INTO Product (id, name, trademark, cost_current, cost_old, description, status) VALUES
(113, 'Laptop Gaming (i4/RTX1080)', 'Acer Nitro', 21000000.00, 23000000.00, 'Laptop gaming tầm trung, hiệu năng cân bằng.', 'Còn hàng');

-- Product Variants
INSERT INTO Product_variant (product_id, quantity, color) VALUES
(101, 5, 'Xám Thiên Thạch'),    
(101, 2, 'Đen Obsidian'),       
(102, 10, 'Bạc Ánh Kim'),       
(102, 0, 'Xám Than'),            
(103, 0, 'Màu Đen'),             
(104, 20, 'Đen'),                
(105, 3, 'Xám đậm'),             
(106, 4, 'Đen'),                 
(107, 7, 'Bạc'),                 
(108, 6, 'Bạc Bạch Kim'),       
(109, 15, 'Đen'),                
(110, 8, 'Đen'),                 
(111, 25, 'Đen'),                
(112, 12, 'Xám'),                
(112, 0, 'Đen'),                 
(103, 5, 'Màu Trắng');           

-- Product Categorize
INSERT INTO Product_categorize (product_id, category_id) VALUES
(101, 4), 
(102, 8), 
(103, 7), 
(104, 10),
(105, 5), 
(106, 6), 
(107, 9), 
(108, 8), 
(109, 6), 
(110, 7), 
(111, 10),
(112, 5); 

-- Product Attribute
INSERT INTO Product_attribute (id, product_id, name, value) VALUES
(1, 101, 'CPU', 'Intel Core i9-14900HX'),
(2, 101, 'GPU', 'NVIDIA GeForce RTX 4080'),
(3, 102, 'RAM', '16GB LPDDR5'),
(4, 102, 'Màn hình', '14 inch OLED 2.8K'),
(5, 103, 'VRAM', '12GB GDDR6X'),
(6, 106, 'Mainboard', 'B760M'),
(7, 105, 'CPU', 'AMD Ryzen 7 7840HS'),
(8, 108, 'Hệ điều hành', 'Windows 11 Pro'),
(9, 112, 'Tần số quét', '144Hz'),
(10, 104, 'Tốc độ đọc', '7000MB/s');

-- Order
INSERT INTO `Order` (id, customer_id, address, date, payment_method, total_cost) VALUES
(1001, 3, '456 Phố Điện Tử, Hà Nội', '2025-10-20 10:00:00', 'Chuyển khoản ngân hàng', 0.00),
(1002, 4, '789 Hẻm Laptop, Đà Nẵng', '2025-10-21 15:30:00', 'Thanh toán khi nhận hàng', 0.00),
(1003, 5, '101 Đường Gaming, Hải Phòng', '2025-10-22 11:45:00', 'Chuyển khoản ngân hàng', 0.00),
(1004, 7, '303 Phố Màn Hình, Bình Dương', '2025-10-23 09:10:00', 'Thẻ tín dụng', 0.00),
(1005, 8, '404 Đường Bàn Phím, Đồng Nai', '2025-10-24 14:00:00', 'Thanh toán khi nhận hàng', 0.00);

UPDATE `Order`
SET payment_status = 'Đã thanh toán'
WHERE id = 1001;

-- Order Detail
INSERT INTO Order_detail (id, order_id, product_variant_id, quantity) VALUES
(1, 1001, 1, 1), 
(2, 1001, 6, 2), 
(1, 1002, 3, 1), 
(1, 1003, 8, 1), 
(2, 1003, 6, 1), 
(1, 1004, 10, 1), 
(1, 1005, 14, 3), 
(2, 1005, 12, 1), 
(3, 1005, 13, 2); 

-- Order Status Log
INSERT INTO Order_status_log (id, order_id, status, time) VALUES
(1, 1001, 'Chờ xử lí', '2025-10-20 10:00:00'),
(2, 1001, 'Đã xác nhận', '2025-10-20 11:30:00'),
(3, 1001, 'Hoàn thành', '2025-10-25 14:00:00'),
(1, 1002, 'Chờ xử lí', '2025-10-21 15:30:00'),
(2, 1002, 'Đang xử lí', '2025-10-22 09:00:00'),
(1, 1005, 'Chờ xử lí', '2025-10-24 14:00:00'),
(2, 1005, 'Đã hủy', '2025-10-24 16:00:00'),
(1, 1003, 'Chờ xử lí', '2025-10-20 10:00:00'),
(2, 1003, 'Đã xác nhận', '2025-10-20 11:30:00'),
(1, 1004, 'Chờ xử lí', '2025-10-20 10:00:00'),
(2, 1004, 'Đã xác nhận', '2025-10-22 11:30:00');

-- Rating
INSERT INTO Rating (id, customer_id, product_id, comment_content, date, star) VALUES
(1, 3, 101, 'Máy quá mạnh, chạy game AAA mượt mà không nóng.', '2025-10-26 10:00:00', 5),
(1, 3, 104, 'SSD chạy nhanh hơn nhiều so với HDD cũ, đáng tiền.', '2025-10-26 15:00:00', 5);

-- Admin Response
INSERT INTO Admin_rating_response (rating_id, product_id, admin_id, response_content, date) VALUES
(1, 101, 1, 'Cảm ơn phản hồi của quý khách. Hân hạnh được phục vụ.', '2025-10-26 16:00:00');

-- Contact
INSERT INTO Contact (id, customer_id, content, date) VALUES
(1, 4, 'Tôi muốn hỏi về chính sách bảo hành mở rộng cho laptop Dell.', '2025-10-25 09:00:00'),
(2, 5, 'Làm thế nào để kiểm tra trạng thái đơn hàng 1003?', '2025-10-25 10:00:00'),
(3, 10, 'Tôi có thể mua trả góp qua thẻ tín dụng được không?', '2025-10-25 11:00:00');

-- Admin Contact Response
INSERT INTO Admin_contact_response (contact_id, admin_id, response_content, date) VALUES
(1, 1, 'Chào bạn, chúng tôi đã gửi chi tiết chính sách bảo hành mở rộng qua email.', '2025-10-25 12:00:00'),
(2, 2, 'Bạn vui lòng kiểm tra mục "Theo dõi đơn hàng" trên website, đơn hàng 1003 đang ở trạng thái đã xác nhận.', '2025-10-25 13:00:00');

-- Discount
INSERT INTO Discount (id, `value`, `condition`, time_start, time_end, type) VALUES
(1, 500000.00, 'Đơn hàng trên 20,000,000 VND', '2025-10-01 00:00:00', '2025-11-30 23:59:59', 'Giá trị'),
(2, 0.10, 'Áp dụng cho Laptop Gaming', '2025-11-01 00:00:00', '2025-11-07 23:59:59', 'Phần trăm'),
(3, 100000.00, 'Dành cho khách hàng mới', '2025-01-01 00:00:00', '2025-12-31 23:59:59', 'Giá trị');

-- Discount Order
INSERT INTO Discount_order (order_id, discount_id) VALUES
(1001, 1), 
(1003, 3);