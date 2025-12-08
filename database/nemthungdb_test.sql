DROP DATABASE IF EXISTS nemthungdb;
CREATE DATABASE IF NOT EXISTS nemthungdb;
USE nemthungdb;

-- DISABLE FOREIGN KEYS TO ALLOW DROPPING TABLES FREELY
SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- 1. DROP ALL TABLES & OBJECTS
-- ==========================================
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
-- 2. CREATE CORE TABLES
-- ==========================================

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
  cost_current DECIMAL(10, 2) NOT NULL
    CHECK (cost_current > 0),
  cost_old DECIMAL(10, 2)
    CHECK (cost_old > 0),
  description VARCHAR(255) NOT NULL,
  status ENUM('Còn hàng', 'Hết hàng')
    DEFAULT 'Còn hàng' NOT NULL,
  overall_rating_star DECIMAL NOT NULL DEFAULT 0.0,
  rating_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
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
  `value` DECIMAL(10, 2) NOT NULL
    CHECK (`value` > 0.0),
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

-- CREATE PRODUCT ECOSYSTEM
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
  status ENUM('Còn hàng', 'Hết hàng') DEFAULT 'Hết hàng' NOT NULL,
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

-- CREATE INTERACTION TABLES
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

-- CREATE ORDER TABLES
CREATE TABLE `Order` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  address VARCHAR(255) NOT NULL,
  date DATETIME NOT NULL,
  payment_method VARCHAR(255) NOT NULL,
  total_amount INT NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 2) NOT NULL,
  payment_status ENUM('Chưa thanh toán', 'Đã thanh toán', 'Hoàn tiền') DEFAULT 'Chưa thanh toán' NOT NULL,
  CONSTRAINT FK_Order_User_Account
    FOREIGN KEY (customer_id)
    REFERENCES User_Account(id) ON DELETE CASCADE
);

CREATE TABLE Order_status_log (
  id INT NOT NULL,
  order_id INT NOT NULL,
  status ENUM('Chờ xử lí', 'Đang xử lí', 'Đã xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy') DEFAULT 'Chờ xử lí' NOT NULL,
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
  price_at_order DECIMAL(10, 2) NOT NULL
    CHECK (price_at_order > 0),
  total_cost DECIMAL(10, 2) AS (quantity * price_at_order) STORED,
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

-- RE-ENABLE FOREIGN KEYS
SET FOREIGN_KEY_CHECKS = 1;


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
    DECLARE v_variant_count INT;
    DECLARE v_old_cost DECIMAL(10,2);
    DECLARE v_old_name VARCHAR(255);
    DECLARE v_old_status ENUM('Còn hàng', 'Hết hàng', 'Chưa mở bán');

    -- 1. Sản phẩm tồn tại
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

    -- 2b. Cấm đổi tên nếu đã có đơn hàng
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

    -- 2c. Không cho đổi trạng thái
    IF p_status <> v_old_status THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Không được phép thay đổi trạng thái sản phẩm.';
    END IF;

    -- 3. Validate giá tiền
    IF p_cost_current <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Giá mới phải > 0.';
    END IF;

    -- Giá mới phải khác giá cũ
    IF p_cost_current = v_old_cost THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Không thể cập nhật: Giá mới phải khác giá cũ.';
    END IF;

    -- 4. Update (không update status)
    UPDATE Product
    SET 
        name = p_name,
        trademark = p_trademark,
        cost_old = v_old_cost,
        cost_current = p_cost_current,
        description = p_description
    WHERE id = p_id;

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
            SET MESSAGE_TEXT = 'Không thể xoá: Sản phẩm vẫn còn biến thể (Product_variant).';
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

-- ======================================
-- 2.2.1 BUSSINESS 
-- ======================================

-- TRIGGER: CHECK IF CUSTOMER ALREADY BUY BEFORE RATING
DELIMITER //
CREATE TRIGGER Trg_Check_Review_Purchase
BEFORE INSERT ON Rating
FOR EACH ROW
BEGIN
    DECLARE v_is_purchased_successfully INT DEFAULT 0;

    SELECT 
        COUNT(DISTINCT od.order_id)
    INTO 
        v_is_purchased_successfully
    FROM 
        Order_detail od
    JOIN 
		-- Get customer id
        `Order` o ON od.order_id = o.id 
    WHERE 
        o.customer_id = NEW.customer_id 
        -- Check if the customer rating at exact product's product_variant
        AND od.product_variant_id IN (
            SELECT id FROM Product_variant WHERE product_id = NEW.product_id
        )
        -- Exists 1 record that have status 'Hoàn thành'
        AND EXISTS (
            SELECT 1 
            FROM Order_status_log osl
            WHERE osl.order_id = o.id 
            AND osl.status = 'Hoàn thành'
        )
        LIMIT 1; 

    IF v_is_purchased_successfully = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Ràng buộc đánh giá: Khách hàng chỉ được phép đánh giá sản phẩm sau khi đã mua sản phẩm đó thành công.';
    END IF;
END //
DELIMITER ;

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
-- ======================================
-- 2.3 DERIVED ATTRIBUTE  
-- ======================================
-- Lấy trạng thái mới nhất của từng đơn hàng trong khoảng thời gian.
DELIMITER $$

CREATE PROCEDURE sp_getLatestOrderStatus
(
    IN p_startDate DATETIME,
    IN p_endDate   DATETIME
)
BEGIN
    SELECT 
        o.id AS order_id,
        o.customer_id,
        o.address,
        o.date,
        osl.status AS latest_status,
        osl.time AS status_time
    FROM `Order` o
    JOIN Order_status_log osl 
        ON osl.order_id = o.id
    WHERE osl.time = (
        SELECT MAX(time)
        FROM Order_status_log
        WHERE order_id = o.id
    )
    AND o.date BETWEEN p_startDate AND p_endDate
    ORDER BY osl.time DESC;
END $$

DELIMITER ;


-- Tính số lượng product bán ra trung bình hàng tháng.
DELIMITER $$

CREATE PROCEDURE sp_avgMonthlySalesCompletedProducts
(
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

-- ==========================================
-- INSERT DATA
-- ==========================================

-- Account
INSERT INTO User_Account (id, email, password, status) VALUES
(1, 'admin.gear@shop.vn', 'Admin123', 'Hoạt động'),        
(2, 'stock.staff@shop.vn', 'Staff456', 'Hoạt động'),       
(3, 'khachhang.vip@gmail.com', 'KhachHang789', 'Hoạt động'), 
(4, 'tranvanduy@gmail.com', 'Duy900123', 'Hoạt động'),    
(5, 'lenguyenthao@gmail.com', 'Thao333333', 'Hoạt động'), 
(6, 'phamanh@hotmail.com', 'PhamAnh99', 'Ngưng hoạt động'),
(7, 'ngocnguyen@gmail.com', 'Ngoc000000', 'Hoạt động'),    
(8, 'hoangthien@yahoo.com', 'Thien11111', 'Hoạt động'),  
(9, 'maivan@gmail.com', 'MaiVan222', 'Hoạt động'),        
(10, 'truonggiang@gmail.com', 'Giang3333', 'Hoạt động'),
(11, 'thanhdat@gmail.com', 'ThanhDat4', 'Hoạt động'),     
(12, 'huyenmy@gmail.com', 'Huyen5555', 'Hoạt động'),    
(13, 'vietanh@gmail.com', 'VietAnh66', 'Hoạt động'),    
(14, 'phuonglinh@gmail.com', 'Linh77777', 'Hoạt động'),  
(15, 'baotran@gmail.com', 'BaoTran888', 'Hoạt động'),
(16, 'admin2.gear@shop.vn', 'Admin123', 'Hoạt động'), 
(17, 'admin3.gear@shop.vn', 'Admin123', 'Hoạt động'), 
(18, 'stock2.staff@shop.vn', 'Staff456', 'Hoạt động'); 

-- Admin
INSERT INTO Admin (id, role) VALUES
(1, 'Quản trị viên'),
(2, 'Nhân viên kho'),
(16, 'Quản trị viên'),
(17, 'Quản trị viên'),
(18, 'Nhân viên kho');
-- Customer
INSERT INTO Customer (id) VALUES
(3), (4), (5), (6), (7), (8), (9), (10), (11), (12), (13), (14), (15);

-- User
INSERT INTO User (account_id, fname, lname, address, phone) VALUES
(1, 'Nguyễn', 'Thanh', '123 Đường Công Nghệ, TP.HCM', '0901234567'), 
(3, 'Lê', 'Hoàng', '456 Phố Điện Tử, Hà Nội', '0912345678'), 
(4, 'Trần', 'Duy', '789 Hẻm Laptop, Đà Nẵng', '0987654321'),
(5, 'Lê', 'Thảo', '101 Đường Gaming, Hải Phòng', '0976543210'),
(6, 'Phạm', 'Anh', '202 Ngõ Chuột, Cần Thơ', '0965432109'),
(7, 'Nguyễn', 'Ngọc', '303 Phố Màn Hình, Bình Dương', '0954321098'),
(8, 'Hoàng', 'Thiện', '404 Đường Bàn Phím, Đồng Nai', '0943210987'),
(9, 'Mai', 'Vân', '505 Khu Tản Nhiệt, Vũng Tàu', '0932109876'),
(10, 'Trường', 'Giang', '606 Lô Chip, Huế', '0921098765'),
(11, 'Thanh', 'Đạt', '707 Đường RAM, Nha Trang', '0910987654');

-- Category 
INSERT INTO Category (id, name, parent_id) VALUES
(1, 'Laptop Gaming', NULL),           
(2, 'Laptop Văn Phòng', NULL),       
(3, 'Linh Kiện PC', NULL),            
(4, 'Laptop Gaming MSI', 1),      
(5, 'Laptop Gaming Lenovo', 1),   
(6, 'Case PC', 3),                  
(7, 'Card Màn Hình', 3),             
(8, 'Laptop Ultrabook', 2),          
(9, 'Laptop Macbook', 2),             
(10, 'Ổ Cứng SSD', 3);                

-- Product
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

INSERT INTO Product (id, name, trademark, cost_current, cost_old, description, status) VALUES
(113, 'Laptop Gaming (i4/RTX1080)', 'Acer Nitro', 21000000.00, 23000000.00, 'Laptop gaming tầm trung, hiệu năng cân bằng.', 'Còn hàng');

-- Product Variants
INSERT INTO Product_variant (product_id, quantity, color) VALUES
(101, 5, 'Xám Thiên Thạch'),    
(101, 2, 'Đen Obsidian'),       
(102, 10, 'Bạc Ánh Kim'),       
(102, 0, 'Xám Than'),            
(103, 0, 'Màu Đen'),             
(104, 20, 'Đen'),                
(105, 3, 'Xám đậm'),             
(106, 4, 'Đen'),                 
(107, 7, 'Bạc'),                 
(108, 6, 'Bạc Bạch Kim'),       
(109, 15, 'Đen'),                
(110, 8, 'Đen'),                 
(111, 25, 'Đen'),                
(112, 12, 'Xám'),                
(112, 0, 'Đen'),                 
(103, 5, 'Màu Trắng');           

-- Product Categorize
INSERT INTO Product_categorize (product_id, category_id) VALUES
(101, 4), 
(102, 8), 
(103, 7), 
(104, 10),
(105, 5), 
(106, 6), 
(107, 9), 
(108, 8), 
(109, 6), 
(110, 7), 
(111, 10),
(112, 5); 

-- Product Attribute
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

-- Order
INSERT INTO `Order` (id, customer_id, address, date, payment_method, total_cost) VALUES
(1001, 3, '456 Phố Điện Tử, Hà Nội', '2025-10-20 10:00:00', 'Chuyển khoản ngân hàng', 0.00),
(1002, 4, '789 Hẻm Laptop, Đà Nẵng', '2025-10-21 15:30:00', 'Thanh toán khi nhận hàng', 0.00),
(1003, 5, '101 Đường Gaming, Hải Phòng', '2025-10-22 11:45:00', 'Chuyển khoản ngân hàng', 0.00),
(1004, 7, '303 Phố Màn Hình, Bình Dương', '2025-10-23 09:10:00', 'Thẻ tín dụng', 0.00),
(1005, 8, '404 Đường Bàn Phím, Đồng Nai', '2025-10-24 14:00:00', 'Thanh toán khi nhận hàng', 0.00);

UPDATE `Order`
SET payment_status = 'Đã thanh toán'
WHERE id = 1001;

-- Order Detail
INSERT INTO Order_detail (id, order_id, product_variant_id, quantity) VALUES
(1, 1001, 1, 1), 
(2, 1001, 6, 2), 
(1, 1002, 3, 1), 
(1, 1003, 8, 1), 
(2, 1003, 6, 1), 
(1, 1004, 10, 1), 
(1, 1005, 14, 3), 
(2, 1005, 12, 1), 
(3, 1005, 13, 2); 

-- Order Status Log
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

-- Rating
INSERT INTO Rating (id, customer_id, product_id, comment_content, date, star) VALUES
(1, 3, 101, 'Máy quá mạnh, chạy game AAA mượt mà không nóng.', '2025-10-26 10:00:00', 5),
(1, 3, 104, 'SSD chạy nhanh hơn nhiều so với HDD cũ, đáng tiền.', '2025-10-26 15:00:00', 5);

-- Admin Response
INSERT INTO Admin_rating_response (rating_id, product_id, admin_id, response_content, date) VALUES
(1, 101, 1, 'Cảm ơn phản hồi của quý khách. Hân hạnh được phục vụ.', '2025-10-26 16:00:00');

-- Contact
INSERT INTO Contact (id, customer_id, content, date) VALUES
(1, 4, 'Tôi muốn hỏi về chính sách bảo hành mở rộng cho laptop Dell.', '2025-10-25 09:00:00'),
(2, 5, 'Làm thế nào để kiểm tra trạng thái đơn hàng 1003?', '2025-10-25 10:00:00'),
(3, 10, 'Tôi có thể mua trả góp qua thẻ tín dụng được không?', '2025-10-25 11:00:00');

-- Admin Contact Response
INSERT INTO Admin_contact_response (contact_id, admin_id, response_content, date) VALUES
(1, 1, 'Chào bạn, chúng tôi đã gửi chi tiết chính sách bảo hành mở rộng qua email.', '2025-10-25 12:00:00'),
(2, 2, 'Bạn vui lòng kiểm tra mục "Theo dõi đơn hàng" trên website, đơn hàng 1003 đang ở trạng thái đã xác nhận.', '2025-10-25 13:00:00');

-- Discount
INSERT INTO Discount (id, `value`, `condition`, time_start, time_end, type) VALUES
(1, 500000.00, 'Đơn hàng trên 20,000,000 VND', '2025-10-01 00:00:00', '2025-11-30 23:59:59', 'Giá trị'),
(2, 0.10, 'Áp dụng cho Laptop Gaming', '2025-11-01 00:00:00', '2025-11-07 23:59:59', 'Phần trăm'),
(3, 100000.00, 'Dành cho khách hàng mới', '2025-01-01 00:00:00', '2025-12-31 23:59:59', 'Giá trị');

-- Discount Order
INSERT INTO Discount_order (order_id, discount_id) VALUES
(1001, 1), 
(1003, 3);