DELIMITER //

DROP FUNCTION IF EXISTS Func_PhanTichHanhViKhachHang //

CREATE FUNCTION Func_PhanTichHanhViKhachHang(p_customer_id INT) 
RETURNS VARCHAR(100)
DETERMINISTIC
READS SQL DATA
BEGIN
    -- Khai báo biến
    DECLARE v_star INT;
    DECLARE v_total_stars INT DEFAULT 0;
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_avg_star DECIMAL(4, 2);
    DECLARE v_behavior VARCHAR(100);
    DECLARE v_check_exists INT;
    DECLARE done INT DEFAULT FALSE;

    -- 1. Kiểm tra đầu vào
    SELECT COUNT(*) INTO v_check_exists FROM Customer WHERE id = p_customer_id;
    IF v_check_exists = 0 THEN
        RETURN 'Không tìm thấy khách hàng';
    END IF;

    -- 2. Khai báo Con trỏ lấy số sao của các đánh giá từ khách này
    BEGIN
        DECLARE cur_ratings CURSOR FOR 
            SELECT star FROM Rating WHERE customer_id = p_customer_id;
        
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

        OPEN cur_ratings;

        read_loop: LOOP
            FETCH cur_ratings INTO v_star;
            
            IF done THEN
                LEAVE read_loop;
            END IF;

            SET v_total_stars = v_total_stars + v_star;
            SET v_count = v_count + 1;
        END LOOP;

        CLOSE cur_ratings;
    END;

    -- 3. Xử lý logic IF/ELSE
    IF v_count = 0 THEN
        SET v_behavior = 'Chưa có đánh giá nào';
    ELSE
        SET v_avg_star = v_total_stars / v_count;

        IF v_avg_star >= 4.5 THEN
            SET v_behavior = 'Khách hàng thân thiện (Rất hài lòng)';
        ELSEIF v_avg_star >= 3.0 THEN
            SET v_behavior = 'Khách hàng trung tính';
        ELSE
            SET v_behavior = 'Khách hàng khó tính (Cần chú ý chăm sóc)';
        END IF;
    END IF;

    RETURN v_behavior;
END //

DELIMITER ;