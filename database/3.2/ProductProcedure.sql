-- ======================================
-- 2.1 PROCEDURE INSERT/UPDATE/DELETE product table
-- =======================================

-- INSERT
DELIMITER $$
CREATE PROCEDURE insert_product_safe(
    IN p_name VARCHAR(255),
    IN p_trademark VARCHAR(255),
    IN p_cost_current DECIMAL(10, 2),
    IN p_cost_old DECIMAL(10, 2),
    IN p_description VARCHAR(255),
    IN p_status ENUM('Còn hàng', 'Hết hàng', 'Chưa mở bán')
)
BEGIN
	DECLARE unq_name INT;
    SELECT COUNT(*) 
    INTO unq_name
    FROM product p 
    WHERE p.name = p_name;
    
    IF unq_name > 0 THEN
		SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm sản phẩm: Tên của sản phẩm không được trùng';
	END IF;
    
	IF p_name IS NULL THEN
		SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm sản phẩm: Tên của sản phẩm không được bỏ trống';
	END IF;
    IF p_trademark IS NULL THEN
		SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm sản phẩm: Tên nhãn hiệu của sản phẩm không được bỏ trống';
	END IF;
    
	IF p_cost_current IS NULL THEN
		SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm sản phẩm: Giá mới của sản phẩm không được bỏ trống';
	END IF;
    IF p_cost_current <= 0 THEN
		SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm sản phẩm: Giá mới của sản phẩm phải là số dương';
	END IF;
	IF p_cost_old IS NOT NULL THEN
		SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm sản phẩm: Giá cũ của sản phẩm khi mới thêm phải NULL';
	END IF;
	IF p_description IS NULL THEN
		SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm sản phẩm: Mô tả của sản phẩm không được bỏ trống';
	END IF;
	IF p_status = 'Còn hàng' OR p_status = 'Hết hàng' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm sản phẩm: Trạng thái khi thêm vào của sản phẩm mặc định là Chưa mở bán';
    END IF;
    
	INSERT INTO Product (name, trademark, cost_current, cost_old, description, status)
    VALUES (p_name, p_trademark, p_cost_current, p_cost_old, p_description, p_status);
END $$
DELIMITER;

-- UPDATE
DELIMITER $$

CREATE PROCEDURE update_product_safe(
    IN p_id INT,
    IN p_name VARCHAR(255),
    IN p_trademark VARCHAR(255),
    IN p_cost_current DECIMAL(10, 2),
    IN p_description VARCHAR(255),
    IN p_status ENUM('Còn hàng', 'Hết hàng', 'Chưa mở bán')
)
BEGIN
    DECLARE v_count INT;
    DECLARE v_old_cost DECIMAL(10,2);
    DECLARE v_old_name VARCHAR(255);
    DECLARE v_old_status ENUM('Còn hàng', 'Hết hàng', 'Chưa mở bán');

    -- 1. Kiểm tra sản phẩm tồn tại
    SELECT COUNT(*) INTO v_count FROM Product WHERE id = p_id;
    IF v_count = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Không tìm thấy sản phẩm.';
    END IF;

    -- Lấy dữ liệu cũ
    SELECT cost_current, name, status INTO 
        v_old_cost, v_old_name, v_old_status
    FROM Product WHERE id = p_id;

    -- 2. Validate trùng tên
    SELECT COUNT(*) INTO v_count 
    FROM Product 
    WHERE name = p_name AND id <> p_id;

    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Tên sản phẩm mới bị trùng.';
    END IF;

    -- 3. Cấm đổi tên nếu đã từng bán
    IF p_name <> v_old_name THEN
        SELECT COUNT(*) INTO v_count
        FROM Order_detail od
        JOIN Product_variant pv ON od.product_variant_id = pv.id
        WHERE pv.product_id = p_id;

        IF v_count > 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Không thể cập nhật: Sản phẩm đã từng bán nên không thể đổi tên.';
        END IF;
    END IF;

    -- 4. Không cho đổi trạng thái
    IF p_status <> v_old_status THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Không được phép thay đổi trạng thái sản phẩm.';
    END IF;

    -- 5. Validate giá > 0
    IF p_cost_current <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Giá mới phải > 0.';
    END IF;

    -- 6. Nếu giá mới = giá cũ → update các field khác, KHÔNG đổi giá
    IF p_cost_current = v_old_cost THEN
        -- Không đổi giá → chỉ update khi các trường khác thực sự thay đổi
        IF p_name <> v_old_name
            OR p_trademark <> (SELECT trademark FROM Product WHERE id = p_id)
            OR p_description <> (SELECT description FROM Product WHERE id = p_id)
        THEN
            UPDATE Product
            SET 
                name = p_name,
                trademark = p_trademark,
                description = p_description
            WHERE id = p_id;
        END IF;

    ELSE
        -- Giá thay đổi → cập nhật cả cost_old & cost_current
        UPDATE Product
        SET 
            name = p_name,
            trademark = p_trademark,
            cost_old = v_old_cost,
            cost_current = p_cost_current,
            description = p_description
        WHERE id = p_id;
    END IF;

END $$

DELIMITER ;

-- DELETE

DELIMITER $$

CREATE PROCEDURE delete_product_safe(IN p_id INT)
BEGIN
    DECLARE count_ref INT DEFAULT 0;

    -- 1. Kiểm tra Product Variant
    SELECT COUNT(*)
    INTO count_ref
    FROM Product_variant
    WHERE product_id = p_id;

    IF count_ref > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể xoá: Sản phẩm vẫn còn biến thể.';
    END IF;

    -- 2. Kiểm tra Order_detail → chỉ cần product đã từng có order là KHÔNG được xoá
    SELECT COUNT(*)
    INTO count_ref
    FROM Order_detail od
    JOIN Product_variant pv ON od.product_variant_id = pv.id
    WHERE pv.product_id = p_id;

    IF count_ref > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể xoá: Sản phẩm đã từng được đặt hàng.';
    END IF;

    -- 3. Kiểm tra categorize
    SELECT COUNT(*)
    INTO count_ref
    FROM Product_categorize
    WHERE product_id = p_id;

    IF count_ref > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể xoá: Sản phẩm còn thuộc danh mục.';
    END IF;

    -- 4. Nếu không còn ràng buộc → XÓA
    DELETE FROM Product WHERE id = p_id;

END $$

DELIMITER ;
