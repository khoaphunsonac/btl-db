<?php
// Sử dụng các Model có sẵn
require_once __DIR__ . '/../models/BaseModel.php'; 
require_once __DIR__ . '/../models/User.php'; 

class CartController {
    private $pdo;
    private $userModel;
    
    public function __construct($db) {
        $this->pdo = $db;
        // User Model được dùng để lấy thông tin chi tiết người dùng
        $this->userModel = new User($db); 
    }
    
    /**
     * Hàm dùng chung để lấy Subquery lọc các Order có trạng thái MỚI NHẤT là 'Chờ xử lí'
     * @return string SQL Subquery
     */
    private function getLatestPendingOrderSubquery() {
        // Tìm Order ID mà status MỚI NHẤT (dựa trên time) là 'Chờ xử lí'
        return "
            SELECT t1.order_id
            FROM Order_status_log t1
            INNER JOIN (
                SELECT order_id, MAX(`time`) AS max_time
                FROM Order_status_log
                GROUP BY order_id
            ) t2 ON t1.order_id = t2.order_id AND t1.`time` = t2.max_time
            WHERE t1.status = 'Chờ xử lí'
        ";
    }

    /**
     * GET /api/carts
     * Lấy danh sách các đơn hàng có trạng thái mới nhất là 'Chờ xử lí'
     */
    public function index() {
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $search = $_GET['search'] ?? null;
        $offset = ($page - 1) * $limit;
        $params = [];
        $where = '';
        
        // Logic tìm kiếm (dựa trên email, tên người dùng)
        if (!empty($search)) {
            $where = "HAVING (user_email LIKE :search OR user_name LIKE :search)";
            $params[':search'] = '%' . $search . '%';
        }

        // Subquery để lọc các giỏ hàng
        $cartFilterSql = $this->getLatestPendingOrderSubquery();

        // Query chính: Lấy danh sách đơn hàng (giỏ hàng)
        $sql = "SELECT 
                    o.id AS user_id, -- Dùng order ID là ID chính cho cart list
                    o.customer_id,
                    o.date AS created_at,
                    MAX(osl.time) AS updated_at, 
                    SUM(od.quantity) AS total_items,
                    ua.email AS user_email,
                    COALESCE(CONCAT(u.fname, ' ', u.lname), 'Người dùng chưa cập nhật') AS user_name
                FROM `Order` o
                JOIN Order_detail od ON o.id = od.order_id
                JOIN User_Account ua ON o.customer_id = ua.id
                LEFT JOIN `User` u ON ua.id = u.account_id -- Lấy tên từ bảng User
                JOIN Order_status_log osl ON o.id = osl.order_id
                WHERE o.id IN ({$cartFilterSql})
                GROUP BY o.id, o.customer_id, o.date, ua.email, u.fname, u.lname
                $where
                ORDER BY updated_at DESC
                LIMIT :limit OFFSET :offset";

        try {
            // Đếm tổng số lượng (cho phân trang)
            $countSql = "SELECT COUNT(DISTINCT o.id) AS total
                         FROM `Order` o
                         WHERE o.id IN ({$cartFilterSql})";
            $countStmt = $this->pdo->prepare($countSql);
            $countStmt->execute();
            $totalItems = $countStmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
            $totalPages = ceil($totalItems / $limit);

            // Lấy dữ liệu giỏ hàng
            $stmt = $this->pdo->prepare($sql);
            if (!empty($search)) $stmt->bindValue(':search', $params[':search']);
            $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
            $stmt->execute();
            $carts = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Chỉnh sửa tên key để khớp với client side mong đợi
            foreach($carts as &$cart) {
                // Dùng id của Order là ID cho danh sách carts
                $cart['id'] = $cart['user_id']; 
                unset($cart['user_id']); 
            }
            unset($cart);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'carts' => $carts,
                'page' => (int)$page,
                'pagination' => [
                    'total_pages' => (int)$totalPages,
                    'total' => (int)$totalItems
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Lỗi server: ' . $e->getMessage()]);
        }
    }
    
    /**
     * GET /api/carts/{order_id}
     * Lấy chi tiết giỏ hàng (Chi tiết Order đang 'Chờ xử lí')
     */
    public function get($orderId) {
        try {
            // 1. Kiểm tra đơn hàng có tồn tại và đang ở trạng thái 'Chờ xử lí' không
            $cartFilterSql = $this->getLatestPendingOrderSubquery();
            
            $sqlCheck = "SELECT o.*, ua.email 
                         FROM `Order` o
                         JOIN User_Account ua ON o.customer_id = ua.id
                         WHERE o.id = :order_id 
                         AND o.id IN ({$cartFilterSql})";
            $stmtCheck = $this->pdo->prepare($sqlCheck);
            $stmtCheck->bindValue(':order_id', $orderId, PDO::PARAM_INT);
            $stmtCheck->execute();
            $order = $stmtCheck->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Giỏ hàng (Đơn hàng chờ xử lý) không tồn tại.']);
                return;
            }

            // 2. Lấy chi tiết sản phẩm trong đơn hàng
            $sqlItems = "SELECT 
                            od.quantity, 
                            od.price_at_order AS price, 
                            od.total_cost AS subtotal,
                            pv.color,
                            p.name, 
                            -- Lấy ảnh đầu tiên của Product Variant
                            (SELECT url_path 
                             FROM Product_variant_picture 
                             WHERE product_variant_id = od.product_variant_id 
                             ORDER BY id ASC 
                             LIMIT 1) AS image
                         FROM Order_detail od
                         JOIN Product_variant pv ON od.product_variant_id = pv.id
                         JOIN Product p ON pv.product_id = p.id
                         WHERE od.order_id = :order_id";
                    
            $stmtItems = $this->pdo->prepare($sqlItems);
            $stmtItems->bindValue(':order_id', $orderId, PDO::PARAM_INT);
            $stmtItems->execute();
            $items = $stmtItems->fetchAll(PDO::FETCH_ASSOC);

            // 3. Chuẩn hóa dữ liệu
            $total = 0;
            foreach ($items as &$item) {
                // Thêm trường size (không có trong schema của bạn, mặc định là '-')
                $item['size'] = '-'; 
                $total += $item['subtotal'];
            }
            unset($item);

            // Lấy thông tin user
            $userInfo = $this->userModel->getById($order['customer_id']);

            // Lấy thời gian cập nhật cuối cùng (trạng thái 'Chờ xử lí')
            $sqlUpdatedAt = "SELECT MAX(`time`) as updated_at 
                             FROM Order_status_log 
                             WHERE order_id = :order_id 
                             AND status = 'Chờ xử lí'";
            $stmtUpdatedAt = $this->pdo->prepare($sqlUpdatedAt);
            $stmtUpdatedAt->bindValue(':order_id', $orderId, PDO::PARAM_INT);
            $stmtUpdatedAt->execute();
            $updatedAt = $stmtUpdatedAt->fetch(PDO::FETCH_ASSOC)['updated_at'] ?? $order['date'];

            
            http_response_code(200);
            echo json_encode([
                'success' => true, 
                'cart' => [
                    'id' => (int)$orderId, 
                    'user_id' => (int)$order['customer_id'],
                    'created_at' => $order['date'],
                    'updated_at' => $updatedAt,
                    'user_name' => $userInfo['fname'] . ' ' . $userInfo['lname'] ?? $order['email']
                ], 
                'items' => $items,
                'total' => $total // Sử dụng trường total_cost đã được tính toán trong Order_detail
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Lỗi server: ' . $e->getMessage()]);
        }
    }
}