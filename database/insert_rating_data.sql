-- ==========================================
-- INSERT RATING DATA FOR ENRICHED TESTING
-- ==========================================
-- Thêm dữ liệu rating phong phú dựa trên đơn hàng thực tế đã mua thành công

-- Dựa vào dữ liệu đơn hàng có sẵn:
-- Order 1001: Customer 3, Đã thanh toán
-- Order 1002: Customer 4, Chưa thanh toán  
-- Order 1003: Customer 5, Chưa thanh toán
-- Order 1004: Customer 7, Chưa thanh toán
-- Order 1005: Customer 8, Chưa thanh toán

-- Chỉ thêm rating cho đơn hàng đã thanh toán (Order 1001 - Customer 3)
-- Cần thêm nhiều đơn hàng "Đã thanh toán" trước để có thể đánh giá

-- Cập nhật trạng thái thanh toán cho một số đơn hàng để có thể đánh giá
UPDATE `Order` SET payment_status = 'Đã thanh toán' WHERE id IN (1002, 1003, 1005);

-- Thêm thêm một số đơn hàng mới với trạng thái đã thanh toán
INSERT INTO `Order` (customer_id, address, date, payment_method, total_amount, total_cost, payment_status) VALUES
(3, '456 Phố Điện Tử, Hà Nội', '2025-09-15 10:30:00', 'Chuyển khoản ngân hàng', 2, 15000000.00, 'Đã thanh toán'),
(3, '456 Phố Điện Tử, Hà Nội', '2025-10-05 14:20:00', 'Chuyển khoản ngân hàng', 3, 25000000.00, 'Đã thanh toán'),
(4, '789 Hẻm Laptop, Đà Nẵng', '2025-09-20 16:45:00', 'Thanh toán khi nhận hàng', 2, 18000000.00, 'Đã thanh toán'),
(5, '101 Đường Gaming, Hải Phòng', '2025-10-10 11:15:00', 'Chuyển khoản ngân hàng', 1, 12000000.00, 'Đã thanh toán'),
(6, '202 Phố Máy Tính, TP.HCM', '2025-10-15 13:30:00', 'Thẻ tín dụng', 2, 20000000.00, 'Đã thanh toán'),
(7, '303 Phố Màn Hình, Bình Dương', '2025-10-08 09:45:00', 'Chuyển khoản ngân hàng', 1, 8000000.00, 'Đã thanh toán'),
(8, '404 Đường Bàn Phím, Đồng Nai', '2025-10-12 15:20:00', 'Thanh toán khi nhận hàng', 2, 16000000.00, 'Đã thanh toán'),
(9, '505 Khu Tản Nhiệt, Vũng Tàu', '2025-10-25 12:10:00', 'Chuyển khoản ngân hàng', 3, 35000000.00, 'Đã thanh toán'),
(10, '606 Lô Chip, Huế', '2025-11-02 14:30:00', 'Thẻ tín dụng', 1, 22000000.00, 'Đã thanh toán'),
(11, '707 Đường RAM, Nha Trang', '2025-11-08 16:45:00', 'Chuyển khoản ngân hàng', 2, 28000000.00, 'Đã thanh toán'),
(12, '808 Phố SSD, Cần Thơ', '2025-10-18 10:15:00', 'Thanh toán khi nhận hàng', 1, 15000000.00, 'Đã thanh toán');

-- Thêm Order_detail để xác định sản phẩm nào được mua trong mỗi đơn hàng
-- Cấu trúc: (id, order_id, product_variant_id, quantity)
-- price_at_order sẽ được trigger tự động set từ Product.cost_current

INSERT INTO Order_detail (order_id, product_variant_id, quantity) VALUES
-- Order 1002 (Customer 4) 
(1002, 3, 1),  -- Product variant 3 (Laptop Văn Phòng SlimBook Pro - Bạc Ánh Kim)
-- Order 1003 (Customer 5)
(1003, 7, 1),  -- Product variant 7 (Laptop Gaming giá rẻ RYZEN - Xám đậm)
(1003, 12, 1), -- Product variant 12 (SSD SATA 512GB - Đen)
-- Order 1005 (Customer 8)
(1005, 13, 1), -- Product variant 13 (Laptop Gaming Phổ Thông - Xám)

-- Đơn hàng mới thêm vào
-- Order 1006 (Customer 3)
(1006, 1, 1),  -- Product variant 1 (Legion 2024 - Xám Thiên Thạch)
(1006, 6, 1),  -- Product variant 6 (SSD NVMe Gen4 - Đen)
-- Order 1007 (Customer 3)
(1007, 7, 1),  -- Product variant 7 (Gaming giá rẻ RYZEN - Xám đậm)
(1007, 9, 1),  -- Product variant 9 (Laptop 2-in-1 Flex 14 - Bạc)
-- Order 1008 (Customer 4)
(1008, 8, 1),  -- Product variant 8 (PC Gaming i5 Gen 14th - Đen)
(1008, 10, 1), -- Product variant 10 (Ultrabook XPS 13 - Bạc Bạch Kim)
-- Order 1009 (Customer 5)
(1009, 10, 1), -- Product variant 10 (Ultrabook XPS 13 - Bạc Bạch Kim)
-- Order 1010 (Customer 6)
(1010, 11, 1), -- Product variant 11 (PC Văn Phòng Mini - Đen)
(1010, 12, 1), -- Product variant 12 (Card GTX 1650 - Đen)
-- Order 1011 (Customer 7)  
(1011, 13, 1), -- Product variant 13 (SSD SATA 512GB - Đen)
-- Order 1012 (Customer 8)
(1012, 14, 1), -- Product variant 14 (Laptop Gaming Phổ Thông - Xám)
(1012, 16, 1), -- Product variant 16 (Card RTX 4070Ti - Màu Trắng)
-- Order 1013 (Customer 9)
(1013, 1, 1),  -- Product variant 1 (Legion 2024 - Xám Thiên Thạch) 
(1013, 3, 1),  -- Product variant 3 (SlimBook Pro - Bạc Ánh Kim)
-- Order 1014 (Customer 10)
(1014, 8, 1),  -- Product variant 8 (PC Gaming i5 - Đen)
-- Order 1015 (Customer 11)
(1015, 10, 1), -- Product variant 10 (XPS 13 - Bạc Bạch Kim)
(1015, 6, 1),  -- Product variant 6 (SSD NVMe Gen4 - Đen)
-- Order 1016 (Customer 12)
(1016, 16, 1); -- Product variant 16 (Card RTX 4070Ti - Màu Trắng)

-- Thêm Order_status_log để đánh dấu các đơn hàng đã hoàn thành (cần thiết để đánh giá)
INSERT INTO Order_status_log (order_id, status, time) VALUES
-- Order 1006 (Customer 3)
(1006, 'Chờ xử lí', '2025-09-15 10:30:00'),
(1006, 'Đã xác nhận', '2025-09-15 12:00:00'),
(1006, 'Hoàn thành', '2025-09-18 15:00:00'),
-- Order 1007 (Customer 3)
(1007, 'Chờ xử lí', '2025-10-05 14:20:00'),
(1007, 'Đã xác nhận', '2025-10-05 16:00:00'),
(1007, 'Hoàn thành', '2025-10-08 10:00:00'),
-- Order 1008 (Customer 4)
(1008, 'Chờ xử lí', '2025-09-20 16:45:00'),
(1008, 'Đã xác nhận', '2025-09-21 09:00:00'),
(1008, 'Hoàn thành', '2025-09-25 14:00:00'),
-- Order 1009 (Customer 5)
(1009, 'Chờ xử lí', '2025-10-10 11:15:00'),
(1009, 'Đã xác nhận', '2025-10-10 13:00:00'),
(1009, 'Hoàn thành', '2025-10-15 16:00:00'),
-- Order 1010 (Customer 6)
(1010, 'Chờ xử lí', '2025-10-15 13:30:00'),
(1010, 'Đã xác nhận', '2025-10-15 15:00:00'),
(1010, 'Hoàn thành', '2025-10-20 12:00:00'),
-- Order 1011 (Customer 7)
(1011, 'Chờ xử lí', '2025-10-08 09:45:00'),
(1011, 'Đã xác nhận', '2025-10-08 11:00:00'),
(1011, 'Hoàn thành', '2025-10-12 10:00:00'),
-- Order 1012 (Customer 8)
(1012, 'Chờ xử lí', '2025-10-12 15:20:00'),
(1012, 'Đã xác nhận', '2025-10-12 17:00:00'),
(1012, 'Hoàn thành', '2025-10-18 09:00:00'),
-- Order 1013 (Customer 9)
(1013, 'Chờ xử lí', '2025-10-25 12:10:00'),
(1013, 'Đã xác nhận', '2025-10-25 14:00:00'),
(1013, 'Hoàn thành', '2025-10-30 11:00:00'),
-- Order 1014 (Customer 10)
(1014, 'Chờ xử lí', '2025-11-02 14:30:00'),
(1014, 'Đã xác nhận', '2025-11-02 16:00:00'),
(1014, 'Hoàn thành', '2025-11-08 13:00:00'),
-- Order 1015 (Customer 11)
(1015, 'Chờ xử lí', '2025-11-08 16:45:00'),
(1015, 'Đã xác nhận', '2025-11-08 18:00:00'),
(1015, 'Hoàn thành', '2025-11-15 10:00:00'),
-- Order 1016 (Customer 12)
(1016, 'Chờ xử lí', '2025-10-18 10:15:00'),
(1016, 'Đã xác nhận', '2025-10-18 12:00:00'),
(1016, 'Hoàn thành', '2025-10-25 14:00:00'),
-- Các đơn hàng cũ cần hoàn thành để đánh giá
(1002, 'Hoàn thành', '2025-10-28 15:00:00'),
(1003, 'Hoàn thành', '2025-10-30 16:00:00'),
(1005, 'Hoàn thành', '2025-11-01 14:00:00');

-- Bây giờ thêm rating cho các sản phẩm đã mua thành công
-- Cấu trúc Rating: (id, customer_id, product_id, comment_content, date, star)
-- PRIMARY KEY (id, product_id)

-- Customer 3 - VIP với nhiều đơn hàng và đánh giá cao
INSERT INTO Rating (customer_id, product_id, comment_content, date, star) VALUES
(3, 101, 'Sản phẩm tuyệt vời! Chất lượng xuất sắc, giao hàng nhanh.', '2025-09-20 10:30:00', 5),
(3, 104, 'SSD chạy cực nhanh, boot Windows chỉ mất 5 giây!', '2025-09-22 14:20:00', 5),
(3, 105, 'Gaming laptop giá rẻ mà chất lượng không thua kém gì hàng đắt tiền.', '2025-10-10 16:45:00', 4),
(3, 107, 'Laptop 2-in-1 rất tiện lợi cho công việc và giải trí.', '2025-10-12 09:15:00', 5);

-- Customer 4 - Đánh giá hỗn hợp
INSERT INTO Rating (customer_id, product_id, comment_content, date, star) VALUES
(4, 102, 'Laptop văn phòng ổn, thiết kế đẹp nhưng hơi nóng khi dùng lâu.', '2025-09-28 13:20:00', 3),
(4, 106, 'PC Gaming mạnh nhưng tiếng ồn fan hơi to.', '2025-09-30 15:45:00', 3),
(4, 108, 'Ultrabook premium, xứng đáng đồng tiền.', '2025-10-30 12:10:00', 4);

-- Customer 5 - Đánh giá tích cực
INSERT INTO Rating (customer_id, product_id, comment_content, date, star) VALUES
(5, 105, 'Gaming laptop AMD RYZEN chạy mượt mà, giá cả phải chăng.', '2025-10-28 12:30:00', 4),
(5, 111, 'SSD SATA tốc độ ổn định, nâng cấp máy cũ rất hiệu quả.', '2025-10-30 14:45:00', 4),
(5, 108, 'XPS 13 thiết kế đẹp, màn hình sắc nét, rất hài lòng!', '2025-11-02 16:20:00', 5);

-- Customer 6 - Đánh giá tiêu cực  
INSERT INTO Rating (customer_id, product_id, comment_content, date, star) VALUES
(6, 109, 'PC mini yếu hơn mong đợi, chạy chậm khi mở nhiều ứng dụng.', '2025-10-25 09:30:00', 2),
(6, 110, 'GTX 1650 cũ rồi, chơi game mới phải hạ setting thấp.', '2025-10-28 11:15:00', 2);

-- Customer 7 - Đánh giá bình thường
INSERT INTO Rating (customer_id, product_id, comment_content, date, star) VALUES
(7, 111, 'SSD SATA bình thường, không có gì đặc biệt nhưng làm việc ổn định.', '2025-10-15 15:20:00', 3);

-- Customer 8 - Đánh giá tích cực vừa phải
INSERT INTO Rating (customer_id, product_id, comment_content, date, star) VALUES
(8, 112, 'Laptop gaming tầm trung tốt, chơi game eSports mượt mà.', '2025-10-22 10:45:00', 4),
(8, 103, 'RTX 4070Ti mạnh mẽ, chạy game 4K rất tốt!', '2025-10-25 12:30:00', 5);

-- Customer 9 - Đánh giá xuất sắc
INSERT INTO Rating (customer_id, product_id, comment_content, date, star) VALUES
(9, 101, 'Legion 2024 đỉnh cao! i9 + RTX4080 quá mạnh mẽ.', '2025-11-02 14:15:00', 5),
(9, 102, 'SlimBook Pro làm việc văn phòng tuyệt vời, pin bền.', '2025-11-05 16:30:00', 5);

-- Customer 10 - Đánh giá tốt
INSERT INTO Rating (customer_id, product_id, comment_content, date, star) VALUES
(10, 106, 'PC Gaming build sẵn tiện lợi, hiệu năng tốt trong tầm giá.', '2025-11-12 13:45:00', 4);

-- Customer 11 - Đánh giá rất tích cực
INSERT INTO Rating (customer_id, product_id, comment_content, date, star) VALUES
(11, 108, 'Dell XPS 13 chất lượng cao, thiết kế sang trọng!', '2025-11-18 12:15:00', 5),
(11, 104, 'Samsung SSD NVMe Gen4 tốc độ đọc ghi cực nhanh.', '2025-11-20 14:40:00', 5);

-- Customer 12 - Đánh giá tiêu cực
INSERT INTO Rating (customer_id, product_id, comment_content, date, star) VALUES
(12, 103, 'Card RTX 4070Ti bị lỗi driver, hỗ trợ kỹ thuật kém.', '2025-10-28 08:30:00', 2);

-- Commit the transaction
COMMIT;

-- Kiểm tra kết quả với các function phân tích
SELECT 
    'Customer Analysis Results' as title,
    customer_id,
    Func_XepHangKhachHang(customer_id) as member_rank,
    Func_PhanTichHanhViKhachHang(customer_id) as behavior_analysis,
    COUNT(*) as total_ratings,
    AVG(star) as avg_rating
FROM Rating 
GROUP BY customer_id 
ORDER BY customer_id;