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
  status ENUM('Còn hàng', 'Hết hàng', 'Chưa mở bán')
    DEFAULT 'Chưa mở bán' NOT NULL,
  overall_rating_star DECIMAL(10, 2) NOT NULL DEFAULT 0.0,
  rating_count INT NOT NULL DEFAULT 0,
  CONSTRAINT CK_cost
	CHECK (cost_current <> cost_old)
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