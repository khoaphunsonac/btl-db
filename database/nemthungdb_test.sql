-- DROP PROCEDURES
DROP PROCEDURE IF EXISTS Update_Product_Status_Procedure;
DROP PROCEDURE IF EXISTS Update_Order_Totals;
DROP PROCEDURE IF EXISTS Decrease_Product_Inventory;
DROP PROCEDURE IF EXISTS Increase_Product_Inventory;
DROP PROCEDURE IF EXISTS change_status_product;
DROP PROCEDURE IF EXISTS insert_product_safe;
DROP PROCEDURE IF EXISTS update_product_safe;
DROP PROCEDURE IF EXISTS delete_product_safe;
-- DROP TRIGGERS
DROP TRIGGER IF EXISTS trg_check_disjoint_customer;
DROP TRIGGER IF EXISTS trg_check_disjoint_admin;
DROP TRIGGER IF EXISTS trg_set_product_variant_status_insert;
DROP TRIGGER IF EXISTS trg_set_product_variant_status_update;
DROP TRIGGER IF EXISTS Trg_Update_Product_Status;
DROP TRIGGER IF EXISTS Trg_Update_Product_Status_Update;
DROP TRIGGER IF EXISTS Trg_Update_Product_Status_Delete;
DROP TRIGGER IF EXISTS Trg_Set_Order_Price_Insert;
DROP TRIGGER IF EXISTS Trg_Set_Order_Price_Update;
DROP TRIGGER IF EXISTS Trg_Update_Order_Totals_Insert;
DROP TRIGGER IF EXISTS Trg_Update_Order_Totals_Update;
DROP TRIGGER IF EXISTS Trg_Update_Order_Totals_Delete;
DROP TRIGGER IF EXISTS Trg_Check_Completion_Status;
DROP TRIGGER IF EXISTS Trg_Decrease_Inventory;
DROP TRIGGER IF EXISTS Trg_Increase_Inventory;
DROP TRIGGER IF EXISTS Trg_Check_Review_Purchase;
DROP TRIGGER IF EXISTS Trg_Prevent_Customer_Deletion;
DROP TRIGGER IF EXISTS Trg_check_status_product;
DROP TRIGGER IF EXISTS trg_check_user_totality;
DROP TRIGGER IF EXISTS Trg_Rating_Delete;
DROP TRIGGER IF EXISTS Trg_Rating_Update;
DROP TRIGGER IF EXISTS Trg_Rating_Insert;
DROP TRIGGER IF EXISTS trg_check_leaf_category_insert;
-- DROP EVENTS
DROP EVENT IF EXISTS Evt_Inactivate_Inactive_Users;

-- ==========================================
-- 3. PROCEDURES AND TRIGGERS (With Correct Delimiters)
-- ==========================================

-- TRIGGER: Disjointness Customer
DELIMITER //
CREATE TRIGGER trg_check_disjoint_customer
BEFORE INSERT ON Customer
FOR EACH ROW
BEGIN
    DECLARE admin_exists INT;
    
    SELECT COUNT(*) INTO admin_exists
    FROM Admin
    WHERE id = NEW.id;

    IF admin_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Disjointness Constraint Violation: A User_Account cannot be both a Customer and an Admin.';
    END IF;
END //
DELIMITER ;
-- =============================
-- TRIGGER CHECK ERD
-- ============================
-- TRIGGER: Disjointness Admin
DELIMITER //
CREATE TRIGGER trg_check_disjoint_admin
BEFORE INSERT ON Admin
FOR EACH ROW
BEGIN
    DECLARE customer_exists INT;
    
    SELECT COUNT(*) INTO customer_exists
    FROM Customer
    WHERE id = NEW.id;

    IF customer_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Disjointness Constraint Violation: A User_Account cannot be both a Customer and an Admin.';
    END IF;
END //
DELIMITER ;
-- ================================
-- TRIGGER CHECK OTHER DERIVED ATTRIBUTE
-- =================================

-- STATUS OF PRODUCT VARIANT
DELIMITER //
CREATE TRIGGER trg_set_product_variant_status_insert
BEFORE INSERT ON Product_variant
FOR EACH ROW
BEGIN
    IF NEW.quantity = 0 THEN
        SET NEW.status = 'Hết hàng';
    ELSE
        SET NEW.status = 'Còn hàng';
    END IF;
END //
DELIMITER ;

-- TRIGGER: Product Variant Status (Update)
DELIMITER //
CREATE TRIGGER trg_set_product_variant_status_update
BEFORE UPDATE ON Product_variant
FOR EACH ROW
BEGIN
    IF NEW.quantity <> OLD.quantity THEN
        IF NEW.quantity = 0 THEN
            SET NEW.status = 'Hết hàng';
        ELSE
            SET NEW.status = 'Còn hàng';
        END IF;
    END IF;
END //
DELIMITER ;
-- ==============================
-- STATUS OF PRODUCT
-- PROCEDURE: Update Product Status
DELIMITER //
CREATE PROCEDURE Update_Product_Status_Procedure(IN p_product_id INT)
BEGIN
    DECLARE v_new_status ENUM('Còn hàng', 'Hết hàng');

    SELECT 
        CASE
            WHEN COUNT(*) > 0 THEN 'Còn hàng'
            ELSE 'Hết hàng'
        END
    INTO v_new_status
    FROM Product_variant
    WHERE product_id = p_product_id
    AND status = 'Còn hàng';

    UPDATE Product
    SET status = v_new_status
    WHERE id = p_product_id
    AND status <> v_new_status;
    
END //
DELIMITER ;

-- TRIGGERS calling Update_Product_Status_Procedure
DELIMITER //
CREATE TRIGGER Trg_Update_Product_Status
AFTER INSERT ON Product_variant
FOR EACH ROW
BEGIN
    CALL Update_Product_Status_Procedure(NEW.product_id);
END //

CREATE TRIGGER Trg_Update_Product_Status_Update
AFTER UPDATE ON Product_variant
FOR EACH ROW
BEGIN
    IF NEW.status <> OLD.status THEN
        CALL Update_Product_Status_Procedure(NEW.product_id);
    END IF;
END //

CREATE TRIGGER Trg_Update_Product_Status_Delete
AFTER DELETE ON Product_variant
FOR EACH ROW
BEGIN
    CALL Update_Product_Status_Procedure(OLD.product_id);
END //
DELIMITER ;

-- ===================================
-- TOTAL COST OF ORDER
-- TRIGGER: Set Order Price (Insert)
DELIMITER //
CREATE TRIGGER Trg_Set_Order_Price_Insert
BEFORE INSERT ON Order_detail
FOR EACH ROW
BEGIN
    DECLARE v_current_price DECIMAL(10, 2);
    SELECT p.cost_current
    INTO v_current_price
    FROM Product p
    JOIN Product_variant pv ON p.id = pv.product_id
    WHERE pv.id = NEW.product_variant_id;

    SET NEW.price_at_order = v_current_price;
END //
DELIMITER ;

-- TRIGGER: Prevent Price Change (Update)
DELIMITER //
CREATE TRIGGER Trg_Set_Order_Price_Update
BEFORE UPDATE ON Order_detail
FOR EACH ROW
BEGIN
    IF NEW.product_variant_id <> OLD.product_variant_id OR NEW.price_at_order <> OLD.price_at_order THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'CANNOT CHANGE PRICE OR COST THAT SAVED IN ORDER_DETAIL';
    END IF;
END //
DELIMITER ;

-- PROCEDURE: Update Order Totals
DELIMITER //
CREATE PROCEDURE Update_Order_Totals(IN p_order_id INT)
BEGIN
    DECLARE v_total_amount_new INT;
    DECLARE v_total_cost_new DECIMAL(10, 2);

    SELECT
        COALESCE(SUM(od.quantity), 0),
        COALESCE(SUM(od.total_cost), 0.00)
    INTO
        v_total_amount_new,
        v_total_cost_new
    FROM
        Order_detail od
    WHERE
        od.order_id = p_order_id;

    UPDATE `Order`
    SET
        total_amount = v_total_amount_new,
        total_cost = v_total_cost_new
    WHERE
        id = p_order_id;
END //
DELIMITER ;

-- TRIGGERS for Order Totals
DELIMITER //
CREATE TRIGGER Trg_Update_Order_Totals_Insert
AFTER INSERT ON Order_detail
FOR EACH ROW
BEGIN
    CALL Update_Order_Totals(NEW.order_id);
END //

CREATE TRIGGER Trg_Update_Order_Totals_Update
AFTER UPDATE ON Order_detail
FOR EACH ROW
BEGIN
    IF NEW.quantity <> OLD.quantity OR NEW.total_cost <> OLD.total_cost THEN
        CALL Update_Order_Totals(NEW.order_id);
    END IF;
END //

CREATE TRIGGER Trg_Update_Order_Totals_Delete
AFTER DELETE ON Order_detail
FOR EACH ROW
BEGIN
    CALL Update_Order_Totals(OLD.order_id);
END //
DELIMITER ;
-- =======================================
-- SEMATIC CONSTRAINTS (TRIGGER)
-- =======================================

-- ========================================
-- SEMATIC 11
DELIMITER //
CREATE EVENT Evt_Inactivate_Inactive_Users
ON SCHEDULE EVERY 1 DAY 
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    UPDATE User_Account
    SET status = 'Ngưng hoạt động'
    WHERE status = 'Hoạt động'
    AND last_login < DATE_SUB(NOW(), INTERVAL 90 DAY); 
END //
DELIMITER ;

-- =============================================
-- SEMATIC 3
DELIMITER //
CREATE TRIGGER Trg_Check_Completion_Status
BEFORE INSERT ON Order_status_log
FOR EACH ROW
BEGIN
    DECLARE v_payment_status ENUM('Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền');
    IF NEW.status = 'Hoàn thành' THEN
        SELECT payment_status
        INTO v_payment_status
        FROM `Order`
        WHERE id = NEW.order_id;

        IF v_payment_status <> 'Đã thanh toán' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Ràng buộc hoàn thành: Đơn hàng chỉ có thể được đánh dấu là "Hoàn thành" khi trạng thái thanh toán là "Đã thanh toán".';
        END IF;
    END IF;
END //
DELIMITER ;
-- =====================================
-- SEMATIC 5
DELIMITER //
CREATE PROCEDURE Decrease_Product_Inventory(IN p_order_id INT)
BEGIN
    DECLARE variant_id_val INT; 
    DECLARE quantity_val INT;
    DECLARE current_stock INT;
    DECLARE done BOOLEAN DEFAULT FALSE;

    DECLARE cur CURSOR FOR
        SELECT od.product_variant_id, od.quantity
        FROM Order_detail od
        WHERE od.order_id = p_order_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO variant_id_val, quantity_val;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        SELECT quantity INTO current_stock
        FROM Product_variant
        WHERE id = variant_id_val;

        IF current_stock < quantity_val THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Lỗi tồn kho';
        END IF;

        UPDATE Product_variant pv
        SET pv.quantity = pv.quantity - quantity_val
        WHERE pv.id = variant_id_val;

    END LOOP;
    
    CLOSE cur;
END //
DELIMITER ;

-- TRIGGER: Decrease Inventory
DELIMITER //
CREATE TRIGGER Trg_Decrease_Inventory
AFTER INSERT ON Order_status_log
FOR EACH ROW
BEGIN
    DECLARE v_already_confirmed INT DEFAULT 0;
    
    IF NEW.status IN ('Đang xử lí', 'Đã xác nhận') THEN
        
        SELECT COUNT(*)
        INTO v_already_confirmed
        FROM Order_status_log osl
        WHERE osl.order_id = NEW.order_id
          AND osl.status IN ('Đang xử lí', 'Đã xác nhận')
          AND osl.time < NEW.time; 
        
        IF v_already_confirmed = 0 THEN
            CALL Decrease_Product_Inventory(NEW.order_id);
        END IF;
    END IF;
END //
DELIMITER ;

-- ======================================
-- SEMATIC 6
DELIMITER //
CREATE PROCEDURE Increase_Product_Inventory(IN p_order_id INT)
BEGIN
    DECLARE variant_id_val INT; 
    DECLARE quantity_val INT;
    DECLARE done BOOLEAN DEFAULT FALSE;

    DECLARE cur CURSOR FOR
        SELECT product_variant_id, quantity
        FROM Order_detail
        WHERE order_id = p_order_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO variant_id_val, quantity_val;
        IF done THEN
            LEAVE read_loop;
        END IF;

        UPDATE Product_variant pv
        SET pv.quantity = pv.quantity + quantity_val
        WHERE pv.id = variant_id_val;
        
    END LOOP;
    
    CLOSE cur;
END //
DELIMITER ;

DELIMITER //
CREATE TRIGGER Trg_Increase_Inventory
AFTER INSERT ON Order_status_log
FOR EACH ROW
BEGIN
    DECLARE v_is_confirmed_before INT DEFAULT 0;
    
    IF NEW.status = 'Đã hủy' THEN
        
        SELECT COUNT(*)
        INTO v_is_confirmed_before
        FROM Order_status_log osl
        WHERE osl.order_id = NEW.order_id
          AND osl.status IN ('Đang xử lí', 'Đã xác nhận');
          
        IF v_is_confirmed_before > 0 THEN
            CALL Increase_Product_Inventory(NEW.order_id);
        END IF;
    END IF;
END //
DELIMITER ;

-- ===============================
-- SEMATIC 7
DELIMITER //
CREATE TRIGGER Trg_Prevent_Customer_Deletion
BEFORE DELETE ON Customer
FOR EACH ROW
BEGIN
    DECLARE ongoing_orders INT DEFAULT 0;

    SELECT 
        COUNT(o.id)
    INTO 
        ongoing_orders
    FROM 
        `Order` o
    WHERE 
        o.customer_id = OLD.id
        AND (
            o.payment_status <> 'Đã thanh toán' 
            OR EXISTS (
                SELECT 1 
                FROM Order_status_log osl
                WHERE osl.order_id = o.id
                AND osl.status IN ('Chờ xử lí', 'Đang xử lí', 'Đã xác nhận')
                ORDER BY osl.time DESC LIMIT 1
            )
        );

    IF ongoing_orders > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ràng buộc toàn vẹn: Không thể xóa tài khoản khách hàng khi còn các đơn hàng chưa thanh toán hoặc đang được xử lý.';
    END IF;
END //
DELIMITER ;
-- ========================================
-- SEMATIC 8
DELIMITER //

CREATE TRIGGER trg_check_leaf_category_insert
BEFORE INSERT ON Product_categorize
FOR EACH ROW
BEGIN
    DECLARE child_count INT;
    
    -- Kiểm tra xem danh mục được chọn có danh mục con nào không
    SELECT COUNT(*) INTO child_count
    FROM Category
    WHERE parent_id = NEW.category_id;

    -- Nếu có con (> 0), nghĩa là đây là danh mục cha/gốc -> Báo lỗi
    IF child_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ràng buộc danh mục: Sản phẩm chỉ được phép gán vào danh mục lá (danh mục chi tiết nhất, không có danh mục con).';
    END IF;
END //


CREATE TRIGGER trg_check_leaf_category_update
BEFORE UPDATE ON Product_categorize
FOR EACH ROW
BEGIN
    DECLARE child_count INT;
    
    IF NEW.category_id <> OLD.category_id THEN
        SELECT COUNT(*) INTO child_count
        FROM Category
        WHERE parent_id = NEW.category_id;

        IF child_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Ràng buộc danh mục: Sản phẩm chỉ được phép gán vào danh mục lá (danh mục chi tiết nhất, không có danh mục con).';
        END IF;
    END IF;
END //

DELIMITER ;

-- =========================================
-- OTHER TRIGGER
-- =========================================
-- TRIGGER: Check Status Product
DELIMITER //
CREATE TRIGGER Trg_check_status_product
BEFORE INSERT ON Product
FOR EACH ROW
BEGIN
    IF NEW.status = 'Còn hàng' THEN
        SET NEW.status = 'Chưa mở bán';
    END IF;
END //
DELIMITER ;

-- ======================================
-- 2.4 DERIVED ATTRIBUTE  
-- ======================================

-- ======================================
-- RANKING CUSTOMER
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

-- ==========================================
-- CUSTOMER RESEARCH

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