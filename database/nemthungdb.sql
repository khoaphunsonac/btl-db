CREATE DATABASE IF NOT EXISTS nemthungdb;
USE nemthungdb;

-- DISABLE FOREIGN KEYS
SET FOREIGN_KEY_CHECKS = 0;

-- DROP ALL TABLES 
DROP TABLE IF EXISTS Discount_order;
DROP TABLE IF EXISTS Discount;
DROP TABLE IF EXISTS Product_categorize;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS Order_detail;
DROP TABLE IF EXISTS Product_variant_picture;
DROP TABLE IF EXISTS Product_variant;
DROP TABLE IF EXISTS Product_attribute;
DROP TABLE IF EXISTS Order_status_log;
DROP TABLE IF EXISTS `Order`;
DROP TABLE IF EXISTS Admin_rating_response;
DROP TABLE IF EXISTS Rating_picture;
DROP TABLE IF EXISTS Rating;
DROP TABLE IF EXISTS Admin_contact_response;
DROP TABLE IF EXISTS Contact;
DROP TABLE IF EXISTS Product;
DROP TABLE IF EXISTS User;
DROP TABLE IF EXISTS Admin;
DROP TABLE IF EXISTS Customer;
DROP TABLE IF EXISTS User_Account;
-- DROP TRIGGER & PROCEDURE & FUNCTION
DROP PROCEDURE IF EXISTS Update_Product_Status_Procedure;
DROP TRIGGER IF EXISTS Trg_Update_Product_Status_Insert;
DROP TRIGGER IF EXISTS Trg_Update_Product_Status_Update;
DROP TRIGGER IF EXISTS Trg_Update_Product_Status_Delete;
DROP TRIGGER IF EXISTS Trg_Set_Order_Price_Insert;
DROP TRIGGER IF EXISTS Trg_Set_Order_Price_Update;
DROP PROCEDURE IF EXISTS Update_Order_Totals;
DROP TRIGGER IF EXISTS Trg_Update_Order_Totals_Insert;
DROP TRIGGER IF EXISTS Trg_Update_Order_Totals_Update;
DROP TRIGGER IF EXISTS Trg_Update_Order_Totals_Delete;
DROP TRIGGER IF EXISTS Trg_Check_Completion_Status;
DROP TRIGGER IF EXISTS Trg_Decrease_Inventory;
-- DROP EVENT 
DROP EVENT IF EXISTS Evt_Inactivate_Inactive_Users;
-- CREATE CORE TABLES
CREATE TABLE User_Account (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  status ENUM('Hoạt động', 'Ngưng hoạt động') 
    DEFAULT 'Hoạt động' NOT NULL,
  last_login DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT chk_password_policy
    CHECK (password REGEXP '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}$')
);

CREATE TABLE Product (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  trademark VARCHAR(255) NOT NULL,
  cost_current DECIMAL NOT NULL
    CHECK (cost_current > 0),
  cost_old DECIMAL
    CHECK (cost_old > 0),
  description VARCHAR(255) NOT NULL,
  status ENUM('Còn hàng', 'Hết hàng')
    DEFAULT 'Còn hàng' NOT NULL,
  overall_rating_star DECIMAL NOT NULL DEFAULT 0.0,
  rating_count INT NOT NULL DEFAULT 0
);

CREATE TABLE Category (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id INT,
  CONSTRAINT FK_Category_Category
    FOREIGN KEY (parent_id)
    REFERENCES Category(id) ON DELETE CASCADE
);

CREATE TABLE Discount (
  id INT AUTO_INCREMENT PRIMARY KEY,
  `value` DECIMAL NOT NULL,
  `condition` VARCHAR(255) NOT NULL,
  time_start DATETIME NOT NULL,
  time_end DATETIME NOT NULL,
  type ENUM('Phần trăm', 'Giá trị') 
    DEFAULT 'Giá trị' NOT NULL,
  CONSTRAINT CK_time_start_end
    CHECK (time_start < time_end)
);

-- CREATE USER & ROLE TABLES 
CREATE TABLE Customer (
  id INT PRIMARY KEY,
  CONSTRAINT FK_Customer_User_Account
    FOREIGN KEY (id)
    REFERENCES User_Account(id) ON DELETE CASCADE
);

CREATE TABLE Admin (
  id INT PRIMARY KEY,
  role ENUM('Quản trị viên', 'Nhân viên kho') 
    DEFAULT 'Quản trị viên' NOT NULL,
  CONSTRAINT FK_Admin_User_Account
    FOREIGN KEY (id)
    REFERENCES User_Account(id) ON DELETE CASCADE
);

CREATE TABLE User (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT UNIQUE NOT NULL,
  fname VARCHAR(150) NOT NULL,
  lname VARCHAR(150) NOT NULL,
  address VARCHAR(255) NOT NULL,
  phone VARCHAR(255) NOT NULL,
  CONSTRAINT FK_User_User_Account
    FOREIGN KEY (account_id)
    REFERENCES User_Account(id) ON DELETE CASCADE
);

-- 5. CREATE PRODUCT ECOSYSTEM (Depend on Product & Category)
CREATE TABLE Product_attribute (
  id INT NOT NULL,
  product_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  `value` VARCHAR(255) NOT NULL,
  CONSTRAINT PK_Product_attribute
    PRIMARY KEY (id, product_id),
  CONSTRAINT FK_Product_attribute_Product
    FOREIGN KEY (product_id)
    REFERENCES Product(id) ON DELETE CASCADE
);

CREATE TABLE Product_variant (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  quantity INT NOT NULL 
    CHECK (quantity >= 0),
  color VARCHAR(150) NOT NULL,
  status ENUM('Còn hàng', 'Hết hàng') DEFAULT 'Còn Hàng' NOT NULL,
  CONSTRAINT FK_Product_variant
    FOREIGN KEY (product_id)
    REFERENCES Product(id) ON DELETE CASCADE
);

CREATE TABLE Product_variant_picture (
  id INT NOT NULL,
  product_variant_id INT NOT NULL,
  url_path VARCHAR(255) NOT NULL,
  CONSTRAINT PK_Product_variant_picture
    PRIMARY KEY (id, product_variant_id),
  CONSTRAINT FK_Product_variant_picture_Product_variant
    FOREIGN KEY (product_variant_id)
    REFERENCES Product_variant(id) ON DELETE CASCADE
);

CREATE TABLE Product_categorize (
  product_id INT NOT NULL,
  category_id INT NOT NULL,
  CONSTRAINT PK_Product_categorize
    PRIMARY KEY (product_id, category_id),
  CONSTRAINT FK_Product_categorize_Product
    FOREIGN KEY (product_id)
    REFERENCES Product(id) ON DELETE CASCADE,
  CONSTRAINT FK_Product_categorize_Category
    FOREIGN KEY (category_id)
    REFERENCES Category(id) ON DELETE CASCADE
);

-- 6. CREATE INTERACTION TABLES (Rating & Contact)
CREATE TABLE Rating (
  id INT NOT NULL,
  customer_id INT NOT NULL,
  product_id INT NOT NULL,
  comment_content VARCHAR(255) NOT NULL,
  date DATETIME NOT NULL,
  star INT NOT NULL 
    CHECK (star >= 1 AND star <=5),
  CONSTRAINT PK_Rating
    PRIMARY KEY (id, product_id),
  CONSTRAINT FK_Rating_Customer
    FOREIGN KEY (customer_id)
    REFERENCES Customer(id) ON DELETE CASCADE,
  CONSTRAINT FK_Rating_Product
    FOREIGN KEY (product_id)
    REFERENCES Product(id) ON DELETE CASCADE
);

CREATE TABLE Rating_picture (
  id INT NOT NULL,
  rating_id INT NOT NULL,
  product_id INT NOT NULL,
  url_path VARCHAR(255) NOT NULL,
  CONSTRAINT PK_Rating_picture
    PRIMARY KEY(id, rating_id, product_id),
  CONSTRAINT FK_Rating_picture_Rating
    FOREIGN KEY (rating_id, product_id)
    REFERENCES Rating(id, product_id) ON DELETE CASCADE
);

CREATE TABLE Admin_rating_response (
  rating_id INT NOT NULL,
  product_id INT NOT NULL,
  admin_id INT NOT NULL,
  response_content VARCHAR(255) NOT NULL,
  date DATETIME NOT NULL,
  CONSTRAINT PK_Admin_rating_response
    PRIMARY KEY (rating_id, product_id),
  CONSTRAINT FK_Admin_rating_response_Admin
    FOREIGN KEY (admin_id)
    REFERENCES Admin(id),
  CONSTRAINT FK_Admin_rating_response_Rating
    FOREIGN KEY (rating_id, product_id)
    REFERENCES Rating(id, product_id) ON DELETE CASCADE
);

CREATE TABLE Contact (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  content VARCHAR(255) NOT NULL,
  date DATETIME NOT NULL,
  CONSTRAINT FK_Contact_Customer
    FOREIGN KEY (customer_id)
    REFERENCES Customer(id) ON DELETE CASCADE
);

CREATE TABLE Admin_contact_response (
  contact_id INT PRIMARY KEY,
  admin_id INT NOT NULL,
  response_content VARCHAR(255) NOT NULL,
  date DATETIME NOT NULL,
  CONSTRAINT FK_Admin_contact_response_Contact
    FOREIGN KEY (contact_id)
    REFERENCES Contact(id) ON DELETE CASCADE,
  CONSTRAINT FK_Admin_contact_response_Admin
    FOREIGN KEY (admin_id)
    REFERENCES Admin(id) ON DELETE CASCADE
);

-- 7. CREATE ORDER TABLES (Depend on Customer & Product)
CREATE TABLE `Order` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  address VARCHAR(255) NOT NULL,
  date DATETIME NOT NULL,
  payment_method VARCHAR(255) NOT NULL,
  total_amount INT NOT NULL DEFAULT 0,
  total_cost DECIMAL NOT NULL,
  payment_status ENUM('Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền') DEFAULT 'Chưa thanh toán' NOT NULL,
  CONSTRAINT FK_Order_User_Account
    FOREIGN KEY (customer_id)
    REFERENCES User_Account(id) ON DELETE CASCADE
);

CREATE TABLE Order_status_log (
  id INT NOT NULL,
  order_id INT NOT NULL,
  status ENUM('Chờ xử lí', 'Đang xử lí', 'Đã xác nhận', 'Hoàn thành', 'Đã hủy') DEFAULT 'Chờ xử lí' NOT NULL,
  time DATETIME NOT NULL,
  CONSTRAINT PK_Order_status_log
    PRIMARY KEY (id, order_id),
  CONSTRAINT FK_Order_status_log_Order
    FOREIGN KEY (order_id)
    REFERENCES `Order`(id) ON DELETE CASCADE
);

CREATE TABLE Order_detail (
  id INT NOT NULL,
  order_id INT NOT NULL,
  product_variant_id INT NOT NULL,
  quantity INT NOT NULL
    CHECK (quantity > 0),
  price_at_order DECIMAL NOT NULL
    CHECK (price_at_order > 0),
  total_cost DECIMAL AS (quantity * price_at_order) STORED,
  CONSTRAINT PK_Order_detail
    PRIMARY KEY (id, order_id),
  CONSTRAINT FK_Order_detail_Order
    FOREIGN KEY (order_id)
    REFERENCES `Order`(id) ON DELETE CASCADE,
  CONSTRAINT FK_Order_detail_Product
    FOREIGN KEY (product_variant_id)
    REFERENCES Product_variant(id) ON DELETE CASCADE
);

CREATE TABLE Discount_order (
  order_id INT NOT NULL,
  discount_id INT NOT NULL,
  CONSTRAINT PK_Discount_order
    PRIMARY KEY (order_id, discount_id),
  CONSTRAINT FK_Discount_order_Discount
    FOREIGN KEY (discount_id)
    REFERENCES Discount(id) ON DELETE CASCADE,
  CONSTRAINT FK_Discount_order_Order
    FOREIGN KEY (order_id)
    REFERENCES `Order`(id) ON DELETE CASCADE
);

-- 8. RE-ENABLE FOREIGN KEYS
SET FOREIGN_KEY_CHECKS = 1;

-- TRIGGER CHECKING DISJOINTNESS SPECIALIZATION
CREATE TRIGGER trg_check_disjoint_customer
BEFORE INSERT ON Customer
FOR EACH ROW
BEGIN
    DECLARE admin_exists INT;
    
    -- IF id already in Admin.id
    SELECT COUNT(*) INTO admin_exists
    FROM Admin
    WHERE id = NEW.id;

    IF admin_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Disjointness Constraint Violation: A User_Account cannot be both a Customer and an Admin.';
    END IF;
END;

CREATE TRIGGER trg_check_disjoint_admin
BEFORE INSERT ON Admin
FOR EACH ROW
BEGIN
    DECLARE customer_exists INT;
    
    -- IF id already in Admin.id
    SELECT COUNT(*) INTO customer_exists
    FROM Customer
    WHERE id = NEW.id;

    IF customer_exists > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Disjointness Constraint Violation: A User_Account cannot be both a Customer and an Admin.';
    END IF;
END;

-- TRIGGER CHECKING STATUS OF PRODUCT VARIANT
CREATE TRIGGER trg_set_product_variant_status_insert
BEFORE INSERT ON Product_variant
FOR EACH ROW
BEGIN
    -- If quantity is 0, set status to 'Hết hàng' (Out of Stock)
    IF NEW.quantity = 0 THEN
        SET NEW.status = 'Hết hàng';
    ELSE
        -- If quantity is > 0, ensure status is 'Còn hàng' (In Stock)
        SET NEW.status = 'Còn hàng';
    END IF;
END;

CREATE TRIGGER trg_set_product_variant_status_update
BEFORE UPDATE ON Product_variant
FOR EACH ROW
BEGIN
    -- Check if quantity is being changed and apply the logic
    IF NEW.quantity <> OLD.quantity THEN
        IF NEW.quantity = 0 THEN
            SET NEW.status = 'Hết hàng';
        ELSE
            SET NEW.status = 'Còn hàng';
        END IF;
    END IF;
END;
-- TRIGGER CHECKING STATUS OF PRODUCT

-- PROCEDURE HELPER
CREATE PROCEDURE Update_Product_Status_Procedure(IN p_product_id INT)
BEGIN
    DECLARE v_new_status ENUM('Còn hàng', 'Hết hàng');

    -- Check if ANY of the product's variants are 'Còn hàng' (In Stock)
    -- If count > 0, the product is 'Còn hàng'. If count = 0, the product is 'Hết hàng'.
    SELECT 
        CASE
            WHEN COUNT(*) > 0 THEN 'Còn hàng'
            ELSE 'Hết hàng'
        END
    INTO v_new_status
    FROM Product_variant
    WHERE product_id = p_product_id
    AND status = 'Còn hàng';

    -- Update the parent Product table only if the status has changed
    UPDATE Product
    SET status = v_new_status
    WHERE id = p_product_id
    AND status <> v_new_status; -- Optimization: prevent unnecessary updates
    
END;

CREATE TRIGGER Trg_Update_Product_Status
AFTER INSERT ON Product_variant
FOR EACH ROW
BEGIN
    CALL Update_Product_Status_Procedure(NEW.product_id);
END;

CREATE TRIGGER Trg_Update_Product_Status_Update
AFTER UPDATE ON Product_variant
FOR EACH ROW
BEGIN
    IF NEW.status <> OLD.status THEN
        CALL Update_Product_Status_Procedure(NEW.product_id);
    END IF;
END;

CREATE TRIGGER Trg_Update_Product_Status_Delete
AFTER DELETE ON Product_variant
FOR EACH ROW
BEGIN
    CALL Update_Product_Status_Procedure(OLD.product_id);
END;

-- TRIGGER GENERATED COLUMN IN ORDER_DETAIL
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

END;

CREATE TRIGGER Trg_Set_Order_Price_Update
BEFORE UPDATE ON Order_detail
FOR EACH ROW
BEGIN

    IF NEW.product_variant_id <> OLD.product_variant_id OR NEW.price_at_order <> OLD.price_at_order THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'CANNOT CHANGE PRICE OR COST THAT SAVED IN ORDER_DETAIL';
    END IF;
END;

-- TRIGGER & PROCEDURE FOR GENERATED COLUMN IN ORDER
CREATE PROCEDURE Update_Order_Totals(IN p_order_id INT)
BEGIN
    DECLARE v_total_amount_new INT;
    DECLARE v_total_cost_new DECIMAL;

    -- CALCULATE ALL COLUMN NEEDED
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

   -- UPDATE ORDER TABLE
    UPDATE `Order`
    SET
        total_amount = v_total_amount_new,
        total_cost = v_total_cost_new
    WHERE
        id = p_order_id;
END;

CREATE TRIGGER Trg_Update_Order_Totals_Insert
AFTER INSERT ON Order_detail
FOR EACH ROW
BEGIN
    -- UPDATE FOR NEW ORDER_DETAIL
    CALL Update_Order_Totals(NEW.order_id);
END;

CREATE TRIGGER Trg_Update_Order_Totals_Update
AFTER UPDATE ON Order_detail
FOR EACH ROW
BEGIN
    -- IF QUANTITY OR TOTAL_COST HAVE BEEN CHANGED
    IF NEW.quantity <> OLD.quantity OR NEW.total_cost <> OLD.total_cost THEN
       -- CALL PROCEDURE TO TRIGG
        CALL Update_Order_Totals(NEW.order_id);
    END IF;
END;

CREATE TRIGGER Trg_Update_Order_Totals_Delete
AFTER DELETE ON Order_detail
FOR EACH ROW
BEGIN
    -- UPDATE IF ORDER_DETAIL HAVE BEEN DELETED
    CALL Update_Order_Totals(OLD.order_id);
END;
-- CHECKING SEMATIC 11 (90 DAYS NOT ACTIVE)
CREATE EVENT Evt_Inactivate_Inactive_Users
ON SCHEDULE EVERY 1 DAY 
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    UPDATE User_Account
    SET status = 'Ngưng hoạt động'
    WHERE status = 'Hoạt động'
    AND last_login < DATE_SUB(NOW(), INTERVAL 90 DAY); 
END;
-- CHECKING SEMATIC 3 (CANNOT CHANGE TO COMPLETED IF NOT PAY YET)
CREATE TRIGGER Trg_Check_Completion_Status
BEFORE INSERT ON Order_status_log
FOR EACH ROW
BEGIN
    -- Chỉ kiểm tra nếu trạng thái mới là 'Hoàn thành'
    DECLARE v_payment_status ENUM('Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền');
    IF NEW.status = 'Hoàn thành' THEN
        -- Lấy trạng thái thanh toán hiện tại của đơn hàng
        SELECT payment_status
        INTO v_payment_status
        FROM `Order`
        WHERE id = NEW.order_id;

        -- Nếu trạng thái thanh toán không phải là 'Đã thanh toán', thì không cho phép chuyển sang 'Hoàn thành'
        IF v_payment_status <> 'Đã thanh toán' THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Ràng buộc hoàn thành: Đơn hàng chỉ có thể được đánh dấu là "Hoàn thành" khi trạng thái thanh toán là "Đã thanh toán".';
        END IF;
    END IF;
END;
-- CHEKING SEMATIC 5 (IF ORDER IS CONFIRMED MINUS QUANTITY RIGHT AWAY)
DROP PROCEDURE IF EXISTS Decrease_Product_Inventory;
CREATE PROCEDURE Decrease_Product_Inventory(IN p_order_id INT)
BEGIN
    -- KHAI BÁO BIẾN
    DECLARE variant_id_val INT; 
    DECLARE quantity_val INT;
    DECLARE current_stock INT;
    DECLARE done BOOLEAN DEFAULT FALSE;

    -- KHAI BÁO CURSOR
    DECLARE cur CURSOR FOR
        SELECT od.product_variant_id, od.quantity
        FROM Order_detail od
        WHERE od.order_id = p_order_id;

    -- KHAI BÁO HANDLER (LUÔN ĐẶT SAU CURSOR)
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- Xử lý lỗi nếu tồn kho bị âm (do CHECK constraint sẽ bị kích hoạt)
    -- Nếu bạn muốn xử lý lỗi cụ thể ở đây:
    /* DECLARE EXIT HANDLER FOR 1690 
    BEGIN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Lỗi tồn kho: Không thể trừ kho vì số lượng tồn kho sẽ bị âm.';
    END;
    */

    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO variant_id_val, quantity_val;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Thêm kiểm tra tồn kho trước khi UPDATE để báo lỗi cụ thể hơn
        SELECT quantity INTO current_stock
        FROM Product_variant
        WHERE id = variant_id_val;

        IF current_stock < quantity_val THEN
            -- Nếu thiếu tồn kho, báo lỗi và ROLLBACK (Transaction cần được bọc ở cấp ngoài)
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Lỗi tồn kho';
        END IF;

        -- Cập nhật tồn kho của variant cụ thể
        UPDATE Product_variant pv
        SET pv.quantity = pv.quantity - quantity_val
        WHERE pv.id = variant_id_val;

        -- Sau khi trừ kho, các Trigger khác sẽ cập nhật trạng thái
    END LOOP;
    
    CLOSE cur;
END;

CREATE TRIGGER Trg_Decrease_Inventory
AFTER INSERT ON Order_status_log
FOR EACH ROW
BEGIN
    DECLARE v_already_confirmed INT DEFAULT 0;
    
    -- 1. Chỉ kiểm tra nếu trạng thái mới là 'Đang xử lí' hoặc 'Đã xác nhận'
    IF NEW.status IN ('Đang xử lí', 'Đã xác nhận') THEN
        
        -- 2. Kiểm tra xem đã có bản ghi trạng thái xác nhận nào trước đó chưa
        SELECT COUNT(*)
        INTO v_already_confirmed
        FROM Order_status_log osl
        WHERE osl.order_id = NEW.order_id
          AND osl.status IN ('Đang xử lí', 'Đã xác nhận')
          AND osl.time < NEW.time; -- Chỉ kiểm tra các log trước thời điểm hiện tại
        
        -- 3. Nếu chưa có log xác nhận nào (tức là đây là log xác nhận đầu tiên)
        IF v_already_confirmed = 0 THEN
            CALL Decrease_Product_Inventory(NEW.order_id);
        END IF;
    END IF;
END;
-- CHECKING SEMATIC 6 (IF ORDER HAVE BEEN CANCEL ADD QUANTITY RIGHT AWAY)
DROP PROCEDURE IF EXISTS Increase_Product_Inventory;
CREATE PROCEDURE Increase_Product_Inventory(IN p_order_id INT)
BEGIN
    -- KHAI BÁO BIẾN
    DECLARE variant_id_val INT; 
    DECLARE quantity_val INT;
    DECLARE done BOOLEAN DEFAULT FALSE;

    -- KHAI BÁO CURSOR
    DECLARE cur CURSOR FOR
        SELECT product_variant_id, quantity
        FROM Order_detail
        WHERE order_id = p_order_id;

    -- KHAI BÁO HANDLER
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;
    
    read_loop: LOOP
        FETCH cur INTO variant_id_val, quantity_val;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- Cập nhật tồn kho của variant cụ thể
        UPDATE Product_variant pv
        SET pv.quantity = pv.quantity + quantity_val
        WHERE pv.id = variant_id_val;
        
        -- Sau khi cộng kho, các Trigger khác sẽ cập nhật trạng thái
    END LOOP;
    
    CLOSE cur;
END;

DROP TRIGGER IF EXISTS Trg_Increase_Inventory;
CREATE TRIGGER Trg_Increase_Inventory
AFTER INSERT ON Order_status_log
FOR EACH ROW
BEGIN
    DECLARE v_is_confirmed_before INT DEFAULT 0;
    
    -- 1. Chỉ hoàn kho nếu trạng thái mới được chèn là 'Đã hủy'
    IF NEW.status = 'Đã hủy' THEN
        
        -- 2. Kiểm tra xem đơn hàng ĐÃ TỪNG được xác nhận (Đang xử lí HOẶC Đã xác nhận) chưa
        SELECT COUNT(*)
        INTO v_is_confirmed_before
        FROM Order_status_log osl
        WHERE osl.order_id = NEW.order_id
          AND osl.status IN ('Đang xử lí', 'Đã xác nhận');
          
        -- 3. Nếu đơn hàng đã từng được xác nhận (tức là đã bị trừ kho), thì hoàn kho.
        IF v_is_confirmed_before > 0 THEN
            -- **Lưu ý:** Cần thêm logic để đảm bảo việc hoàn kho chỉ xảy ra 1 lần duy nhất cho mỗi đơn hàng.
            -- Trong bối cảnh này, ta chấp nhận gọi thủ tục hoàn kho.
            CALL Increase_Product_Inventory(NEW.order_id);
        END IF;
    END IF;
END;
-- CHECKING SEMATIC 9 (CUSTOMER CANNOT RATING IF NOT BUYING THEM)
DROP TRIGGER IF EXISTS Trg_Check_Review_Purchase;
CREATE TRIGGER Trg_Check_Review_Purchase
BEFORE INSERT ON Rating
FOR EACH ROW
BEGIN
    DECLARE v_is_purchased_successfully INT DEFAULT 0;

    -- Kiểm tra xem có đơn hàng nào của khách hàng này chứa sản phẩm này
    -- VÀ đơn hàng đó phải có log trạng thái cuối cùng là "Hoàn thành"
    
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
            -- Lấy tất cả variant_id thuộc product_id đang được đánh giá
            SELECT id FROM Product_variant WHERE product_id = NEW.product_id
        )
        AND EXISTS (
            -- Kiểm tra sự tồn tại của log trạng thái "Hoàn thành"
            SELECT 1 
            FROM Order_status_log osl
            WHERE osl.order_id = o.id 
            AND osl.status = 'Hoàn thành'
        )
        LIMIT 1; 

    -- Nếu không tìm thấy bằng chứng mua hàng thành công
    IF v_is_purchased_successfully = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ràng buộc đánh giá: Khách hàng chỉ được phép đánh giá sản phẩm sau khi đã mua sản phẩm đó thành công (Đơn hàng phải có trạng thái "Hoàn thành").';
    END IF;
END;
-- CHECKING SEMATIC 7
DROP TRIGGER IF EXISTS Trg_Prevent_Customer_Deletion;
CREATE TRIGGER Trg_Prevent_Customer_Deletion
BEFORE DELETE ON Customer
FOR EACH ROW
BEGIN
    DECLARE ongoing_orders INT DEFAULT 0;

    -- Kiểm tra các đơn hàng chưa thanh toán HOẶC đang xử lý
    SELECT 
        COUNT(o.id)
    INTO 
        ongoing_orders
    FROM 
        `Order` o
    WHERE 
        o.customer_id = OLD.id
        AND (
            o.payment_status <> 'Đã thanh toán' -- Chưa thanh toán hoặc đã hoàn tiền
            OR EXISTS (
                -- Kiểm tra log trạng thái cuối cùng là đang xử lý
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
END;
-- INSERT VALUE

-- Account
INSERT INTO User_Account (id, email, password, status) VALUES
(1, 'admin.gear@shop.vn', 'Admin123', 'Hoạt động'),       -- 1: Admin (Mật khẩu hợp lệ)
(2, 'stock.staff@shop.vn', 'Staff456', 'Hoạt động'),      -- 2: Nhân viên kho (Mật khẩu hợp lệ)
(3, 'khachhang.vip@gmail.com', 'KhachHang789', 'Hoạt động'), -- 3: Customer VIP (Mật khẩu hợp lệ)
(4, 'tranvanduy@gmail.com', 'Duy900123', 'Hoạt động'),    -- 4: Customer (Mật khẩu hợp lệ)
(5, 'lenguyenthao@gmail.com', 'Thao333333', 'Hoạt động'), -- 5: Customer (Mật khẩu hợp lệ)
(6, 'phamanh@hotmail.com', 'PhamAnh99', 'Ngưng hoạt động'),-- 6: Customer (Ngừng HĐ) (Mật khẩu hợp lệ)
(7, 'ngocnguyen@gmail.com', 'Ngoc000000', 'Hoạt động'),   -- 7: Customer (Mật khẩu hợp lệ)
(8, 'hoangthien@yahoo.com', 'Thien11111', 'Hoạt động'),  -- 8: Customer (Mật khẩu hợp lệ)
(9, 'maivan@gmail.com', 'MaiVan222', 'Hoạt động'),       -- 9: Customer (Mật khẩu hợp lệ)
(10, 'truonggiang@gmail.com', 'Giang3333', 'Hoạt động'),-- 10: Customer (Mật khẩu hợp lệ)
(11, 'thanhdat@gmail.com', 'ThanhDat4', 'Hoạt động'),     -- 11: Customer (Mật khẩu hợp lệ)
(12, 'huyenmy@gmail.com', 'Huyen5555', 'Hoạt động'),    -- 12: Customer (Mật khẩu hợp lệ)
(13, 'vietanh@gmail.com', 'VietAnh66', 'Hoạt động'),    -- 13: Customer (Mật khẩu hợp lệ)
(14, 'phuonglinh@gmail.com', 'Linh77777', 'Hoạt động'),  -- 14: Customer (Mật khẩu hợp lệ)
(15, 'baotran@gmail.com', 'BaoTran888', 'Hoạt động');   -- 15: Customer (Mật khẩu hợp lệ)

-- Admin
INSERT INTO Admin (id, role) VALUES
(1, 'Quản trị viên'),
(2, 'Nhân viên kho');

-- Customer
INSERT INTO Customer (id) VALUES
(3), (4), (5), (6), (7), (8), (9), (10), (11), (12), (13), (14), (15);

-- User
INSERT INTO User (account_id, fname, lname, address, phone) VALUES
(1, 'Nguyễn', 'Thanh', '123 Đường Công Nghệ, TP.HCM', '0901234567'), -- Admin user detail
(3, 'Lê', 'Hoàng', '456 Phố Điện Tử, Hà Nội', '0912345678'), -- Customer 3
(4, 'Trần', 'Duy', '789 Hẻm Laptop, Đà Nẵng', '0987654321'),
(5, 'Lê', 'Thảo', '101 Đường Gaming, Hải Phòng', '0976543210'),
(6, 'Phạm', 'Anh', '202 Ngõ Chuột, Cần Thơ', '0965432109'),
(7, 'Nguyễn', 'Ngọc', '303 Phố Màn Hình, Bình Dương', '0954321098'),
(8, 'Hoàng', 'Thiện', '404 Đường Bàn Phím, Đồng Nai', '0943210987'),
(9, 'Mai', 'Vân', '505 Khu Tản Nhiệt, Vũng Tàu', '0932109876'),
(10, 'Trường', 'Giang', '606 Lô Chip, Huế', '0921098765'),
(11, 'Thanh', 'Đạt', '707 Đường RAM, Nha Trang', '0910987654');

-- --------------------------------------------------------------------------------------
-- 2. CHÈN DỮ LIỆU VÀO BẢNG PRODUCT & CATEGORY
-- --------------------------------------------------------------------------------------

-- Category 
INSERT INTO Category (id, name, parent_id) VALUES
(1, 'Laptop Gaming', NULL),          -- Cấp 1
(2, 'Laptop Văn Phòng', NULL),       -- Cấp 1
(3, 'Linh Kiện PC', NULL),           -- Cấp 1
(4, 'Laptop Gaming MSI', 1),     -- Cấp 2 (Lá)
(5, 'Laptop Gaming Lenovo', 1),   -- Cấp 2 (Lá)
(6, 'Case PC', 3),                 -- Cấp 2 (Lá)
(7, 'Card Màn Hình', 3),             -- Cấp 2 (Lá)
(8, 'Laptop Ultrabook', 2),          -- Cấp 2 (Lá)
(9, 'Laptop Macbook', 2),             -- Cấp 2 (Lá)
(10, 'Ổ Cứng SSD', 3);               -- Cấp 2 (Lá)

-- BẢNG: Product (12 records)
-- overall_rating_star và rating_count sẽ là 0.0 và 0 ban đầu.
INSERT INTO Product (id, name, trademark, cost_current, cost_old, description) VALUES
(101, 'Laptop Gaming Legion 2024 (i9/RTX4080)', 'Lenovo', 65000000.00, 70000000.00, 'Mẫu laptop gaming flagship với hiệu năng tuyệt đối.'),
(102, 'Laptop Văn Phòng SlimBook Pro', 'Dell', 18500000.00, 20000000.00, 'Thiết kế mỏng nhẹ, pin trâu, phù hợp cho công việc văn phòng.'),
(103, 'Card Đồ Họa RTX 4070Ti Ultimate', 'GIGABYTE', 25000000.00, NULL, 'Card đồ họa hiệu suất cao cho game thủ và creator.'),
(104, 'SSD NVMe Gen4 1TB tốc độ cao', 'Samsung', 2100000.00, 2500000.00, 'Ổ cứng tốc độ đọc/ghi cực nhanh.'),
(105, 'Laptop Gaming giá rẻ RYZEN', 'Lenovo', 16000000.00, 17500000.00, 'Hiệu năng gaming tốt trong tầm giá phổ thông.'),
(106, 'PC Gaming i5 Gen 14th', 'Custom GearVN', 28000000.00, 30000000.00, 'Máy bộ đã tối ưu sẵn cho chơi game và stream.'),
(107, 'Laptop 2-in-1 Flex 14', 'HP', 15500000.00, NULL, 'Laptop xoay gập linh hoạt, cảm ứng.'),
(108, 'Laptop Ultrabook XPS 13', 'Dell', 32000000.00, 35000000.00, 'Màn hình vô cực, thiết kế sang trọng, pin bền.'),
(109, 'PC Văn Phòng Mini', 'ACER', 9000000.00, NULL, 'Máy tính để bàn nhỏ gọn, tiết kiệm không gian.'),
(110, 'Card Màn Hình GTX 1650', 'MSI', 4500000.00, 5000000.00, 'Card màn hình cơ bản cho eSports.'),
(111, 'SSD SATA 512GB', 'Kingston', 800000.00, NULL, 'Ổ cứng SSD dung lượng vừa phải, tốc độ ổn định.'),
(112, 'Laptop Gaming Phổ Thông (i5/RTX3050)', 'Acer Nitro', 21000000.00, 23000000.00, 'Laptop gaming tầm trung, hiệu năng cân bằng.');

-- --------------------------------------------------------------------------------------
-- 3. CHÈN DỮ LIỆU VÀO BẢNG PRODUCT ECOSYSTEM
-- Các Trigger sẽ tự động cập nhật status của variant và product.
-- --------------------------------------------------------------------------------------

-- BẢNG: Product_variant (15 records)
-- Ghi chú: Product 103 (RTX 4070Ti) có variant Hết hàng để test trigger
INSERT INTO Product_variant (product_id, quantity, color) VALUES
(101, 5, 'Xám Thiên Thạch'),    -- Laptop Gaming XYZ (Còn hàng)
(101, 2, 'Đen Obsidian'),       -- Laptop Gaming XYZ (Còn hàng)
(102, 10, 'Bạc Ánh Kim'),       -- Laptop VP SlimBook (Còn hàng)
(102, 0, 'Xám Than'),           -- Laptop VP SlimBook (Hết hàng - Trigger)
(103, 0, 'Màu Đen'),            -- RTX 4070Ti (Hết hàng - Trigger -> Product 103 status: Hết hàng)
(104, 20, 'Đen'),               -- SSD 1TB (Còn hàng)
(105, 3, 'Xám đậm'),            -- Laptop Gaming Ryzen (Còn hàng)
(106, 4, 'Đen'),                -- PC Gaming i5 (Còn hàng)
(107, 7, 'Bạc'),                -- Laptop Flex 14 (Còn hàng)
(108, 6, 'Bạc Bạch Kim'),       -- Laptop XPS 13 (Còn hàng)
(109, 15, 'Đen'),               -- PC VP Mini (Còn hàng)
(110, 8, 'Đen'),                -- GTX 1650 (Còn hàng)
(111, 25, 'Đen'),               -- SSD SATA 512GB (Còn hàng)
(112, 12, 'Xám'),               -- Laptop Gaming phổ thông (Còn hàng)
(112, 0, 'Đen'),                -- Laptop Gaming phổ thông (Hết hàng)
(103, 5, 'Màu Trắng');          -- RTX 4070Ti (Màu Trắng, SỐ LƯỢNG > 0 -> Product 103 status: Còn hàng)

-- BẢNG: Product_categorize (Liên kết chỉ với danh mục LÁ)
INSERT INTO Product_categorize (product_id, category_id) VALUES
(101, 4), -- Laptop Gaming XYZ -> Gaming Cao Cấp
(102, 8), -- Laptop SlimBook -> Laptop Ultrabook
(103, 7), -- RTX 4070Ti -> Card Màn Hình
(104, 10),-- SSD 1TB -> Ổ Cứng SSD
(105, 5), -- Laptop Gaming Ryzen -> Gaming Phổ Thông
(106, 6), -- PC Gaming -> Máy Bộ PC
(107, 9), -- Laptop Flex 14 -> Laptop 2-in-1
(108, 8), -- Laptop XPS 13 -> Laptop Ultrabook
(109, 6), -- PC VP Mini -> Máy Bộ PC
(110, 7), -- GTX 1650 -> Card Màn Hình
(111, 10),-- SSD SATA -> Ổ Cứng SSD
(112, 5); -- Laptop Gaming Phổ Thông -> Gaming Phổ Thông

-- BẢNG: Product_attribute
INSERT INTO Product_attribute (id, product_id, name, value) VALUES
(1, 101, 'CPU', 'Intel Core i9-14900HX'),
(2, 101, 'GPU', 'NVIDIA GeForce RTX 4080'),
(3, 102, 'RAM', '16GB LPDDR5'),
(4, 102, 'Màn hình', '14 inch OLED 2.8K'),
(5, 103, 'VRAM', '12GB GDDR6X'),
(6, 106, 'Mainboard', 'B760M'),
(7, 105, 'CPU', 'AMD Ryzen 7 7840HS'),
(8, 108, 'Hệ điều hành', 'Windows 11 Pro'),
(9, 112, 'Tần số quét', '144Hz'),
(10, 104, 'Tốc độ đọc', '7000MB/s');

-- --------------------------------------------------------------------------------------
-- 4. CHÈN DỮ LIỆU VÀO BẢNG ORDER (Giao dịch)
-- Các cột total_amount/total_cost sẽ được Trigger tự động cập nhật sau khi insert Order_detail.
-- --------------------------------------------------------------------------------------

-- BẢNG: Order (5 records)
INSERT INTO `Order` (id, customer_id, address, date, payment_method, total_cost) VALUES
(1001, 3, '456 Phố Điện Tử, Hà Nội', '2025-10-20 10:00:00', 'Chuyển khoản ngân hàng', 0.00),
(1002, 4, '789 Hẻm Laptop, Đà Nẵng', '2025-10-21 15:30:00', 'Thanh toán khi nhận hàng', 0.00),
(1003, 5, '101 Đường Gaming, Hải Phòng', '2025-10-22 11:45:00', 'Chuyển khoản ngân hàng', 0.00),
(1004, 7, '303 Phố Màn Hình, Bình Dương', '2025-10-23 09:10:00', 'Thẻ tín dụng', 0.00),
(1005, 8, '404 Đường Bàn Phím, Đồng Nai', '2025-10-24 14:00:00', 'Thanh toán khi nhận hàng', 0.00);

UPDATE `Order`
SET payment_status = 'Đã thanh toán'
WHERE id = 1001;
-- BẢNG: Order_detail (Chi tiết đơn hàng)
-- price_at_order tự lấy từ Product.cost_current. total_cost tự tính.
INSERT INTO Order_detail (id, order_id, product_variant_id, quantity) VALUES
(1, 1001, 1, 1), -- Laptop Gaming XYZ (Giá 65,000,000)
(2, 1001, 6, 2), -- SSD 1TB (Giá 2,100,000)
(1, 1002, 3, 1), -- Laptop VP SlimBook (Giá 18,500,000)
(1, 1003, 8, 1), -- PC Gaming i5 (Giá 28,000,000)
(2, 1003, 6, 1), -- SSD 1TB (Giá 2,100,000)
(1, 1004, 10, 1), -- Laptop XPS 13 (Giá 32,000,000)
(1, 1005, 14, 3), -- Laptop Gaming phổ thông (Giá 21,000,000)
(2, 1005, 12, 1), -- GTX 1650 (Giá 4,500,000)
(3, 1005, 13, 2); -- SSD SATA 512GB (Giá 800,000)

-- BẢNG: Order_status_log (Log trạng thái đơn hàng)
INSERT INTO Order_status_log (id, order_id, status, time) VALUES
(1, 1001, 'Chờ xử lí', '2025-10-20 10:00:00'),
(2, 1001, 'Đã xác nhận', '2025-10-20 11:30:00'),
(3, 1001, 'Hoàn thành', '2025-10-25 14:00:00'),
(1, 1002, 'Chờ xử lí', '2025-10-21 15:30:00'),
(2, 1002, 'Đang xử lí', '2025-10-22 09:00:00'),
(1, 1005, 'Chờ xử lí', '2025-10-24 14:00:00'),
(2, 1005, 'Đã hủy', '2025-10-24 16:00:00'),
(1, 1003, 'Chờ xử lí', '2025-10-20 10:00:00'),
(2, 1003, 'Đã xác nhận', '2025-10-20 11:30:00'),
(1, 1004, 'Chờ xử lí', '2025-10-20 10:00:00'),
(2, 1004, 'Đã xác nhận', '2025-10-22 11:30:00');



-- --------------------------------------------------------------------------------------
-- 5. CHÈN DỮ LIỆU VÀO BẢNG INTERACTION (Rating & Contact)
-- --------------------------------------------------------------------------------------

-- BẢNG: Rating (Đánh giá)
INSERT INTO Rating (id, customer_id, product_id, comment_content, date, star) VALUES
(1, 3, 101, 'Máy quá mạnh, chạy game AAA mượt mà không nóng.', '2025-10-26 10:00:00', 5),
(1, 3, 104, 'SSD chạy nhanh hơn nhiều so với HDD cũ, đáng tiền.', '2025-10-26 15:00:00', 5);
-- Ghi chú: Product 101 (Laptop Gaming XYZ) có 1 đánh giá 5 sao -> overall_rating_star = 5.0

-- BẢNG: Admin_rating_response (Phản hồi đánh giá)
INSERT INTO Admin_rating_response (rating_id, product_id, admin_id, response_content, date) VALUES
(1, 101, 1, 'Cảm ơn phản hồi của quý khách. Hân hạnh được phục vụ.', '2025-10-26 16:00:00');

-- BẢNG: Contact (Liên hệ)
INSERT INTO Contact (id, customer_id, content, date) VALUES
(1, 4, 'Tôi muốn hỏi về chính sách bảo hành mở rộng cho laptop Dell.', '2025-10-25 09:00:00'),
(2, 5, 'Làm thế nào để kiểm tra trạng thái đơn hàng 1003?', '2025-10-25 10:00:00'),
(3, 10, 'Tôi có thể mua trả góp qua thẻ tín dụng được không?', '2025-10-25 11:00:00');

-- BẢNG: Admin_contact_response (Phản hồi liên hệ)
INSERT INTO Admin_contact_response (contact_id, admin_id, response_content, date) VALUES
(1, 1, 'Chào bạn, chúng tôi đã gửi chi tiết chính sách bảo hành mở rộng qua email.', '2025-10-25 12:00:00'),
(2, 2, 'Bạn vui lòng kiểm tra mục "Theo dõi đơn hàng" trên website, đơn hàng 1003 đang ở trạng thái đã xác nhận.', '2025-10-25 13:00:00');

-- BẢNG: Discount (Mã giảm giá)
INSERT INTO Discount (id, `value`, `condition`, time_start, time_end, type) VALUES
(1, 500000.00, 'Đơn hàng trên 20,000,000 VND', '2025-10-01 00:00:00', '2025-11-30 23:59:59', 'Giá trị'),
(2, 0.10, 'Áp dụng cho Laptop Gaming', '2025-11-01 00:00:00', '2025-11-07 23:59:59', 'Phần trăm'),
(3, 100000.00, 'Dành cho khách hàng mới', '2025-01-01 00:00:00', '2025-12-31 23:59:59', 'Giá trị');

-- BẢNG: Discount_order (Áp dụng mã giảm giá)
INSERT INTO Discount_order (order_id, discount_id) VALUES
(1001, 1), -- Đơn 1001 (65M + 4.2M = 69.2M > 20M) áp dụng giảm 500k
(1003, 3); -- Đơn 1003 (Khách hàng mới) áp dụng giảm 100k

-- TRIGGER CHECKING TOTALITY SPECIALIZATION
CREATE TRIGGER trg_check_user_totality
AFTER INSERT ON User_Account
FOR EACH ROW
BEGIN
    DECLARE subclass_count INT DEFAULT 0;

    -- IF NEW ID EXIST EITHER ADMIN OR CUSTOMER
    SELECT
        COUNT(*)
    INTO
        subclass_count
    FROM
        (
            SELECT id FROM Customer WHERE id = NEW.id
            UNION ALL
            SELECT id FROM Admin WHERE id = NEW.id
        ) AS subclasses;

    IF subclass_count = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Totality Constraint Violation: A User_Account must be either a Customer or an Admin.';
    END IF;
END;

SELECT * FROM `order`