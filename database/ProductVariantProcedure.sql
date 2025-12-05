-- ======================================
-- 2.1 PROCEDURE INSERT/UPDATE/DELETE product variant table
-- =======================================

-- INSERT
DELIMITER $$

CREATE PROCEDURE create_variant_safe(
    IN p_product_id INT,
    IN p_color VARCHAR(150),
    IN p_quantity INT
)
BEGIN
    -- Check product_id không được null
    IF p_product_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm biến thể: product_id không được để trống.';
    END IF;

    -- Kiểm tra product tồn tại
    IF NOT EXISTS (SELECT 1 FROM Product WHERE id = p_product_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm biến thể: Sản phẩm không tồn tại.';
    END IF;

    -- Check color không được null hoặc rỗng
    IF p_color IS NULL OR LENGTH(TRIM(p_color)) = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm biến thể: Màu không được để trống.';
    END IF;

    -- Check quantity không được null
    IF p_quantity IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm biến thể: Số lượng không được để trống.';
    END IF;

    -- Check quantity >= 0
    IF p_quantity < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm biến thể: Số lượng phải >= 0.';
    END IF;

    -- Kiểm tra trùng màu trong cùng sản phẩm
    IF EXISTS (
        SELECT 1 FROM Product_variant 
        WHERE product_id = p_product_id AND color = p_color
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm biến thể: Biến thể màu này đã tồn tại cho sản phẩm.';
    END IF;

    -- Insert
    INSERT INTO Product_variant(product_id, quantity, color, status)
    VALUES (
        p_product_id,
        p_quantity,
        p_color,
        CASE 
            WHEN p_quantity > 0 THEN 'Còn hàng'
            ELSE 'Hết hàng'
        END
    );

END$$

DELIMITER ;

-- UPDATE
DELIMITER $$

CREATE PROCEDURE update_variant_safe(
    IN p_id INT,
    IN p_quantity INT,
    IN p_color VARCHAR(150)
)
BEGIN
    DECLARE v_old_color VARCHAR(150);
    DECLARE v_old_quantity INT;
    DECLARE v_product_id INT;
    DECLARE v_exists_order INT DEFAULT 0;
    DECLARE v_new_status ENUM('Còn hàng', 'Hết hàng');

    -- 0. Kiểm tra input hợp lệ
    IF p_color IS NULL OR TRIM(p_color) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Màu không được để trống.';
    END IF;

    IF p_quantity IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Số lượng không được để trống.';
    END IF;

    IF p_quantity < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Số lượng phải >= 0.';
    END IF;

    -- 1. Lấy dữ liệu cũ
    SELECT color, quantity, product_id 
    INTO v_old_color, v_old_quantity, v_product_id
    FROM Product_variant
    WHERE id = p_id;

    IF v_old_color IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Biến thể không tồn tại.';
    END IF;

    -- 1.1 Nếu số lượng mới = số lượng cũ → không cho cập nhật
    IF p_quantity = v_old_quantity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Số lượng mới phải khác số lượng cũ.';
    END IF;

    -- 2. Kiểm tra biến thể đã có trong Order_detail chưa
    SELECT COUNT(*)
    INTO v_exists_order
    FROM Order_detail
    WHERE product_variant_id = p_id;

    -- 3. Nếu đã có Order_detail → KHÔNG cho đổi màu
    IF v_exists_order > 0 AND p_color <> v_old_color THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Biến thể đã được bán nên không thể đổi màu.';
    END IF;

    -- 4. Kiểm tra trùng màu với biến thể khác cùng sản phẩm
    IF p_color <> v_old_color THEN
        IF EXISTS (
            SELECT 1 
            FROM Product_variant
            WHERE product_id = v_product_id
              AND color = p_color
              AND id <> p_id
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Không thể cập nhật: Biến thể màu này đã tồn tại cho sản phẩm.';
        END IF;
    END IF;

    -- 5. Xác định status dựa trên quantity
    IF p_quantity > 0 THEN
        SET v_new_status = 'Còn hàng';
    ELSE
        SET v_new_status = 'Hết hàng';
    END IF;

    -- 6. Cập nhật
    UPDATE Product_variant
    SET 
        quantity = p_quantity,
        color = p_color,
        status = v_new_status
    WHERE id = p_id;

END$$

DELIMITER ;

-- DELETE
DELIMITER $$

CREATE PROCEDURE delete_variant_safe(IN p_id INT)
BEGIN
    DECLARE v_quantity INT DEFAULT NULL;

    -- 1. Kiểm tra biến thể tồn tại
    SELECT quantity 
    INTO v_quantity
    FROM Product_variant
    WHERE id = p_id;

    IF v_quantity IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể xoá: Biến thể không tồn tại.';
    END IF;

    -- 2. Không cho xoá nếu quantity > 0
    IF v_quantity > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể xoá: Số lượng phải bằng 0.';
    END IF;

    -- 3. Không cho xoá nếu đã được dùng trong Order_detail
    IF EXISTS (
        SELECT 1 FROM Order_detail
        WHERE product_variant_id = p_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể xoá: Biến thể đã được sử dụng trong đơn hàng.';
    END IF;

    -- 4. Cho phép xoá
    DELETE FROM Product_variant WHERE id = p_id;

END$$

DELIMITER ;
