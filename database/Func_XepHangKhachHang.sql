DELIMITER //

DROP FUNCTION IF EXISTS Func_XepHangKhachHang //

CREATE FUNCTION Func_XepHangKhachHang(p_customer_id INT) 
RETURNS VARCHAR(50)
DETERMINISTIC
READS SQL DATA
BEGIN
    -- Khai báo biến
    DECLARE v_total_spent DECIMAL(15, 2) DEFAULT 0;
    DECLARE v_order_value DECIMAL(15, 2) DEFAULT 0;
    DECLARE v_rank VARCHAR(50);
    DECLARE v_customer_exists INT;
    DECLARE done INT DEFAULT FALSE;

    -- 1. Kiểm tra tham số đầu vào (Khách hàng có tồn tại trong bảng Customer không)
    SELECT COUNT(*) INTO v_customer_exists 
    FROM Customer 
    WHERE id = p_customer_id;

    IF v_customer_exists = 0 THEN
        RETURN 'Lỗi: Khách hàng không tồn tại';
    END IF;

    -- 2. Khai báo Con trỏ (Cursor) lấy các đơn đã thanh toán của khách
    BEGIN
        DECLARE cur_orders CURSOR FOR 
            SELECT total_cost 
            FROM `Order` 
            WHERE customer_id = p_customer_id 
            AND payment_status = 'Đã thanh toán';

        -- Khai báo handler để thoát vòng lặp
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

        -- 3. Mở con trỏ và dùng vòng lặp (LOOP) để tính tổng
        OPEN cur_orders;

        read_loop: LOOP
            FETCH cur_orders INTO v_order_value;
            
            IF done THEN
                LEAVE read_loop;
            END IF;
            
            -- Cộng dồn doanh thu
            SET v_total_spent = v_total_spent + v_order_value;
        END LOOP;

        CLOSE cur_orders;
    END;

    -- 4. Sử dụng IF để phân loại hạng thành viên dựa trên tổng tiền
    IF v_total_spent < 5000000 THEN
        SET v_rank = 'Thành viên Mới';
    ELSEIF v_total_spent < 20000000 THEN
        SET v_rank = 'Thành viên Bạc';
    ELSEIF v_total_spent < 50000000 THEN
        SET v_rank = 'Thành viên Vàng';
    ELSE
        SET v_rank = 'Thành viên Kim Cương';
    END IF;

    RETURN v_rank;
END //

DELIMITER ;