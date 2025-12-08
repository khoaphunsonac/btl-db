-- ======================================
-- 2.2.2 DERIVED ATTRIBUTE  
-- ======================================
-- CALCULATE OVERALL RATING STAR
DELIMITER $$

DROP PROCEDURE IF EXISTS Update_Rating_Incremental$$

CREATE PROCEDURE Update_Rating_Incremental(
    IN p_product_id INT,
    IN p_new_star INT,
    IN p_old_star INT,
    IN p_action VARCHAR(10)
)
BEGIN
    -- INSERT
    IF p_action = 'INSERT' THEN
        UPDATE Product
        SET
            overall_rating_star = ((COALESCE(overall_rating_star,0) * rating_count) + p_new_star) / (rating_count + 1),
            rating_count = rating_count + 1
        WHERE id = p_product_id;

    -- UPDATE
    ELSEIF p_action = 'UPDATE' THEN
        IF p_new_star <> p_old_star THEN
            UPDATE Product
            SET
                overall_rating_star = CASE
                    WHEN rating_count > 0 THEN
                        ((COALESCE(overall_rating_star,0) * rating_count) - p_old_star + p_new_star) / rating_count
                    ELSE
                        p_new_star
                END
            WHERE id = p_product_id;
        END IF;

    -- DELETE
    ELSEIF p_action = 'DELETE' THEN
        UPDATE Product
        SET
            overall_rating_star = CASE
                WHEN rating_count > 1 THEN ((COALESCE(overall_rating_star,0) * rating_count) - p_old_star) / (rating_count - 1)
                ELSE 0
            END,
            rating_count = GREATEST(rating_count - 1, 0)
        WHERE id = p_product_id;
    END IF;
END$$

DELIMITER ;


DELIMITER //

DROP TRIGGER IF EXISTS Trg_Rating_Insert//
CREATE TRIGGER Trg_Rating_Insert
AFTER INSERT ON Rating
FOR EACH ROW
BEGIN
    CALL Update_Rating_Incremental(
        NEW.product_id,
        NEW.star,
        0,
        'INSERT'
    );
END//

DROP TRIGGER IF EXISTS Trg_Rating_Update//
CREATE TRIGGER Trg_Rating_Update
AFTER UPDATE ON Rating
FOR EACH ROW
BEGIN
    CALL Update_Rating_Incremental(
        NEW.product_id,
        NEW.star,
        OLD.star,
        'UPDATE'
    );
END//

DROP TRIGGER IF EXISTS Trg_Rating_Delete//
CREATE TRIGGER Trg_Rating_Delete
AFTER DELETE ON Rating
FOR EACH ROW
BEGIN
    CALL Update_Rating_Incremental(
        OLD.product_id,
        0,
        OLD.star,
        'DELETE'
    );
END//

DELIMITER ;

-- TEST

-------------- EMPTY RATING
-- DELETE FROM Rating
-- WHERE customer_id = 3 AND product_id = 101;

-------------- INSERT RATING
-- SELECT * FROM Product WHERE id = 101;
-- INSERT INTO Rating (customer_id, product_id, comment_content, star)
-- VALUES (3, 101, 'Sản phẩm tốt', 5);
-- SELECT * FROM Product WHERE id = 101;

-------------- UPDATE RATING
-- UPDATE Rating
-- SET comment_content = 'Đánh giá lại nek', star = 1
-- WHERE customer_id = 3 AND product_id = 101;
-- SELECT * FROM Product WHERE id = 101;

-------------- DELETE RATING
-- DELETE FROM Rating
-- WHERE customer_id = 3 AND product_id = 101;
-- SELECT * FROM Product WHERE id = 101;