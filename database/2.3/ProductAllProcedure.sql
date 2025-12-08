-- Product - Product Attribute - Product Variant

---- Specific
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

---- All
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

-- Tính số lượng product bán ra trung bình hàng tháng.
DELIMITER $$

CREATE PROCEDURE sp_avgMonthlySalesCompletedProducts (
    IN p_year INT
)
BEGIN
    -- Tính số tháng để chia
    DECLARE months_passed INT;
    
    IF p_year < YEAR(CURDATE()) THEN
        SET months_passed = 12; -- Năm trước → đủ 12 tháng
    ELSE
        SET months_passed = MONTH(CURDATE()); -- Năm hiện tại → tính đến tháng hiện tại
    END IF;
    
    SELECT 
        p.name AS product_name,
        COALESCE(SUM(od.quantity) / months_passed, 0) AS avg_quantity_per_month
    FROM Product p
    LEFT JOIN Product_variant pv ON pv.product_id = p.id
    LEFT JOIN Order_detail od 
           ON od.product_variant_id = pv.id
    LEFT JOIN `Order` o 
           ON od.order_id = o.id
    LEFT JOIN Order_status_log osl 
           ON osl.order_id = o.id 
           AND osl.time = (SELECT MAX(time) 
                           FROM Order_status_log 
                           WHERE order_id = o.id)
    WHERE osl.status = 'Hoàn thành' OR osl.status IS NULL
      AND (YEAR(o.date) = p_year OR o.date IS NULL)
    GROUP BY p.id, p.name
    ORDER BY avg_quantity_per_month DESC;
END $$

DELIMITER ;

-- TEST
-- call get_all_products(null, null, null); -- Mặc định
-- call get_all_products('Lenovo', null, null); -- Thương hiệu 
-- call get_all_products(null, 'Còn hàng', null); -- Tinh trang
-- call get_all_products(null, null, 'id-asc');


-- SELECT id FROM Product_variant
-- WHERE product_id = 101;
-- INSERT INTO `Order` (id, customer_id, address, date, payment_method, total_cost) VALUES
-- (8888, 3, '456 Phố Điện Tử, Hà Nội', '2023-10-20 10:00:00', 'Chuyển khoản ngân hàng', 0.00);
-- INSERT INTO Order_detail (id, order_id, product_variant_id, quantity) VALUES
-- (1, 8888, id, 1); 
-- call sp_avgMonthlySalesCompletedProducts(2023);