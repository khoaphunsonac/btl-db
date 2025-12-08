DELIMITER //
CREATE TRIGGER Trg_Check_Review_Purchase
BEFORE INSERT ON Rating
FOR EACH ROW
BEGIN
    DECLARE v_is_purchased_successfully INT DEFAULT 0;
    DECLARE v_is_reviewed_before INT DEFAULT 0;
    DECLARE v_next_id INT DEFAULT 0;

    -- 1. CHECK KHÁCH ĐÃ MUA THÀNH CÔNG SẢN PHẨM CHƯA?
    SELECT 
        COUNT(DISTINCT od.order_id)
    INTO 
        v_is_purchased_successfully
    FROM 
        Order_detail od
    JOIN 
        `Order` o ON od.order_id = o.id 
    WHERE 
        o.customer_id = NEW.customer_id
        AND od.product_variant_id IN (
            SELECT id FROM Product_variant WHERE product_id = NEW.product_id
        )
        AND EXISTS (
            SELECT 1 
            FROM Order_status_log osl
            WHERE osl.order_id = o.id 
            AND osl.status = 'Hoàn thành'
        );

    IF v_is_purchased_successfully = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Khách chưa mua sản phẩm nên không thể đánh giá.';
    END IF;

    -- 2. CHECK KHÁCH ĐÃ ĐÁNH GIÁ SẢN PHẨM NÀY TRƯỚC CHƯA?
    SELECT 
        COUNT(*)
    INTO 
        v_is_reviewed_before
    FROM 
        Rating
    WHERE 
        customer_id = NEW.customer_id
        AND product_id = NEW.product_id;

    IF v_is_reviewed_before > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Mỗi khách hàng chỉ được đánh giá một lần cho mỗi sản phẩm.';
    END IF;

    -- 3. AUTO-GENERATE ID SAU KHI QUA HẾT CÁC CHECK
    SELECT 
        IFNULL(MAX(id), 0) + 1
    INTO 
        v_next_id
    FROM Rating
    WHERE product_id = NEW.product_id;

    SET NEW.id = v_next_id;

    -- 4. NẾU KHÔNG TRUYỀN date → GÁN NOW()
    IF NEW.date IS NULL OR NEW.date = '' THEN
        SET NEW.date = NOW();
    END IF;

END //
DELIMITER ;


-- TEST 
-- DELETE FROM rating WHERE `rating`.`id` = 1 AND `rating`.`product_id` = 101

------------ Khách hàng chưa mua sản phẩm
-- INSERT INTO Rating (customer_id, product_id, comment_content, star)
-- VALUES (5, 101, 'Sản phẩm tốt', 5);

------------ Oke
-- INSERT INTO Rating (customer_id, product_id, comment_content, star)
-- VALUES (3, 101, 'Sản phẩm tốt', 5);

------------- TEST LỖI: Đánh giá rồi còn đánh giá tiếp
-- INSERT INTO Rating (customer_id, product_id, comment_content, star)
-- VALUES (3, 101, 'Sản phẩm tệ', 4);