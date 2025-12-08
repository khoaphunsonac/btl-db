-- Product - Product Attribute - Product Variant
-- DELIMITER $$

-- CREATE PROCEDURE get_product_full(IN p_id INT)
-- BEGIN
--     -- 1. Kiểm tra product có tồn tại hay không
--     IF NOT EXISTS (SELECT 1 FROM Product WHERE id = p_id) THEN
--         SIGNAL SQLSTATE '45000'
--             SET MESSAGE_TEXT = 'Sản phẩm không tồn tại.';
--     END IF;

--     -- 2. Lấy thông tin chính của sản phẩm
--     SELECT *
--     FROM Product
--     WHERE id = p_id;

--     -- 3. Lấy toàn bộ thuộc tính của sản phẩm
--     SELECT id, name, `value`
--     FROM Product_attribute
--     WHERE product_id = p_id
--     ORDER BY id ASC;

--     -- 4. Lấy toàn bộ biến thể (variant) của sản phẩm
--     SELECT id, color, quantity, status
--     FROM Product_variant
--     WHERE product_id = p_id
--     ORDER BY id ASC;

-- END$$

-- DELIMITER ;

-- 
DELIMITER $$

CREATE PROCEDURE get_product(IN p_product_id INT)
BEGIN
    SELECT 
        -- Product
        P.id AS product_id,
        P.name AS product_name,
        P.trademark AS product_trademark,
        P.cost_current AS product_cost_current,
        P.cost_old AS product_cost_old,
        P.description AS product_description,
        P.status AS product_status,
        P.overall_rating_star AS product_rating_star,
        P.rating_count AS product_rating_count,

        -- Variant
        PV.id AS variant_id,
        PV.color AS variant_color,
        PV.quantity AS variant_quantity,
        PV.status AS variant_status,

        -- Attribute
        PA.id AS attribute_id,
        PA.name AS attribute_name,
        PA.value AS attribute_value

    FROM Product P
    LEFT JOIN Product_variant PV ON P.id = PV.product_id
    LEFT JOIN Product_attribute PA ON P.id = PA.product_id

    WHERE P.id = p_product_id

    ORDER BY P.id ASC;
END $$

DELIMITER ;

----
DELIMITER $$

CREATE PROCEDURE get_all_products(
    IN p_search VARCHAR(200),
    IN p_status VARCHAR(50),
    IN p_sort VARCHAR(50)
)
BEGIN
    SELECT 
        -- Product
        P.id AS product_id,
        P.name AS product_name,
        P.trademark AS product_trademark,
        P.cost_current AS product_cost_current,
        P.cost_old AS product_cost_old,
        P.description AS product_description,
        P.status AS product_status,
        P.overall_rating_star AS product_rating_star,
        P.rating_count AS product_rating_count,

        -- Variant
        PV.id AS variant_id,
        PV.color AS variant_color

    FROM Product P
    LEFT JOIN Product_variant PV ON P.id = PV.product_id
    
    -- WHERE
    WHERE 
        (p_search IS NULL 
            OR p_search = '' 
            OR P.name LIKE CONCAT('%', p_search, '%') 
            OR P.trademark LIKE CONCAT('%', p_search, '%'))
        AND (p_status IS NULL 
            OR p_status = '' 
            OR P.status = p_status)

    -- ORDER BY
    ORDER BY
        -- ID
        (CASE WHEN p_sort = 'id-asc'  THEN P.id END) ASC,
        (CASE WHEN p_sort = 'id-desc' THEN P.id END) DESC,

        -- COST
        (CASE WHEN p_sort = 'cost_current-asc'  THEN P.cost_current END) ASC,
        (CASE WHEN p_sort = 'cost_current-desc' THEN P.cost_current END) DESC,

        -- RATING
        (CASE WHEN p_sort = 'overall_rating_star-asc'  THEN P.overall_rating_star END) ASC,
        (CASE WHEN p_sort = 'overall_rating_star-desc' THEN P.overall_rating_star END) DESC;

END$$

DELIMITER ;