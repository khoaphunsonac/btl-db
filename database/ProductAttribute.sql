-- CREATE
DELIMITER $$

CREATE PROCEDURE create_attribute_safe(
    IN p_product_id INT,
    IN p_name VARCHAR(255),
    IN p_value VARCHAR(255)
)
BEGIN
    DECLARE v_new_id INT;
    DECLARE v_exists INT;

    -- Validate input
    IF p_product_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm thuộc tính: product_id không được để trống.';
    END IF;

    IF p_name IS NULL OR LENGTH(TRIM(p_name)) = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm thuộc tính: name không được để trống.';
    END IF;

    IF p_value IS NULL OR LENGTH(TRIM(p_value)) = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm thuộc tính: value không được để trống.';
    END IF;

    -- Kiểm tra product tồn tại
    SELECT COUNT(*) INTO v_exists
    FROM Product
    WHERE id = p_product_id;

    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm thuộc tính: Sản phẩm không tồn tại.';
    END IF;

    -- Kiểm tra thuộc tính trùng
    SELECT COUNT(*) INTO v_exists
    FROM Product_attribute
    WHERE product_id = p_product_id
      AND name = p_name;

    IF v_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể thêm thuộc tính: Thuộc tính đã tồn tại cho sản phẩm.';
    END IF;

    -- Lấy id mới
    SELECT IFNULL(MAX(id),0) + 1
    INTO v_new_id
    FROM Product_attribute
    WHERE product_id = p_product_id;

    -- Thực hiện insert
    INSERT INTO Product_attribute(id, product_id, name, value)
    VALUES (v_new_id, p_product_id, p_name, p_value);

END$$

DELIMITER ;

-- UPDATE
DELIMITER $$

CREATE PROCEDURE update_attribute_safe(
    IN p_id INT,
    IN p_product_id INT,
    IN p_name VARCHAR(255),
    IN p_value VARCHAR(255)
)
BEGIN
    DECLARE v_old_name VARCHAR(255);
    DECLARE v_old_value VARCHAR(255);

    -- 0. Validate input
    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: name không được để trống.';
    END IF;

    IF p_value IS NULL OR TRIM(p_value) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: value không được để trống.';
    END IF;

    -- 1. Lấy dữ liệu cũ
    SELECT name, value
    INTO v_old_name, v_old_value
    FROM Product_attribute
    WHERE id = p_id AND product_id = p_product_id;

    IF v_old_name IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Thuộc tính không tồn tại.';
    END IF;

    -- 2. Nếu name mới khác name cũ → kiểm tra trùng
    IF p_name <> v_old_name THEN
        IF EXISTS (
            SELECT 1
            FROM Product_attribute
            WHERE product_id = p_product_id
              AND name = p_name
              AND id <> p_id
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Không thể cập nhật: Thuộc tính này đã tồn tại cho sản phẩm.';
        END IF;
    END IF;

    -- 3. Không cho update nếu không có gì thay đổi
    IF p_name = v_old_name AND p_value = v_old_value THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Dữ liệu mới phải khác dữ liệu cũ.';
    END IF;

    -- 4. Update
    UPDATE Product_attribute
    SET 
        name = p_name,
        value = p_value
    WHERE id = p_id
      AND product_id = p_product_id;

END$$

DELIMITER ;

-- DELETE
DELIMITER $$

CREATE PROCEDURE delete_attribute_safe(
    IN p_id INT,
    IN p_product_id INT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    -- 1. Kiểm tra thuộc tính tồn tại
    SELECT COUNT(*)
    INTO v_exists
    FROM Product_attribute
    WHERE id = p_id AND product_id = p_product_id;

    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể xoá: Thuộc tính không tồn tại.';
    END IF;

    -- 2. Xoá
    DELETE FROM Product_attribute
    WHERE id = p_id AND product_id = p_product_id;

END$$

DELIMITER ;
