<?php
require_once __DIR__ . '/BaseModel.php';

class Order extends BaseModel
{
    protected $table = '`Order`'; // Backticks because Order is reserved keyword
    protected $dateColumn = 'date';
    /**
     * Phương thức này phải được định nghĩa để OrderController::index() hoạt động
     * (Đây là nơi lỗi created_at có khả năng xảy ra nếu không có getAll)
     */
    public function getAll($limit = 10, $offset = 0, $filters = []) {
        $page = $filters['page'] ?? 1;
        $limit = $filters['limit'] ?? 10;
        $offset = ($page - 1) * $limit;
        
        $params = [];
        $whereClauses = [];
        $joinClauses = [];
        
        // Build WHERE clauses (Thêm logic filter nếu cần)
        // ... 
        
        $whereSQL = !empty($whereClauses) ? 'WHERE ' . implode(' AND ', $whereClauses) : '';
        
        // LỖI QUAN TRỌNG: SỬ DỤNG 'date' THAY VÌ 'created_at'
        $orderBy = 'o.date DESC'; 


        $joinClauses[] = "LEFT JOIN Order_detail od ON o.id = od.order_id";
        // Lấy dữ liệu chính
        $sql = "SELECT 
                    o.*, 
                    ua.email, 
                    COALESCE(CONCAT(u.fname, ' ', u.lname), 'Người dùng chưa cập nhật') as customer_name,
                    -- Lấy GIÁ TRỊ GIẢM GIÁ được áp dụng (e.g., '10%', '50000 VNĐ')
                    GROUP_CONCAT(
                        CONCAT(d.value, IF(d.type = 'Phần trăm', '%', ' VNĐ')) 
                        SEPARATOR ', '
                    ) as applied_discount_values 
                FROM {$this->table} o
                LEFT JOIN Discount_order do ON o.id = do.order_id   -- JOIN ĐỂ LẤY MÃ GIẢM GIÁ
                LEFT JOIN Discount d ON do.discount_id = d.id  -- THÊM JOIN VỚI BẢNG Discount
                LEFT JOIN Customer c ON o.customer_id = c.id
                LEFT JOIN User_Account ua ON c.id = ua.id
                LEFT JOIN `User` u ON ua.id = u.account_id
                {$whereSQL}
                GROUP BY 
                    o.id, o.customer_id, o.address, o.date, o.payment_method, 
                    o.total_amount, o.total_cost, o.payment_status, 
                    ua.email, customer_name
                ORDER BY {$orderBy}
                LIMIT :limit OFFSET :offset";

        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->execute();
        $data = $stmt->fetchAll();

        // Đếm tổng số đơn hàng (giữ nguyên)
        $sqlCount = "SELECT COUNT(*) as total FROM {$this->table} o {$whereSQL}";
        $stmtCount = $this->pdo->prepare($sqlCount);
        foreach ($params as $key => $value) {
            $stmtCount->bindValue($key, $value);
        }
        $stmtCount->execute();
        $total = $stmtCount->fetch()['total'] ?? 0;
        
        return [
            'data' => $data,
            'pagination' => [
                'total_pages' => ceil($total / $limit),
                'total' => (int)$total,
                'page' => (int)$page
            ]
        ];
    }
    
    /**
     * Get order by code
     */
    public function getByCode($code)
    {
        $sql = "SELECT * FROM {$this->table} WHERE order_code = :code";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':code', $code);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    /**
     * Get orders by customer
     */
    public function getByCustomer($customerId, $limit = 10, $offset = 0)
    {
        // LỖI SQL (1/5): created_at -> date
        $sql = "SELECT * FROM {$this->table} 
                WHERE customer_id = :customer_id 
                ORDER BY date DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':customer_id', $customerId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get orders by status
     */
    public function getByStatus($status, $limit = 10, $offset = 0)
    {
        // LỖI SQL (2/5): created_at -> date
        $sql = "SELECT * FROM {$this->table} 
                WHERE status = :status 
                ORDER BY date DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':status', $status);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get order details
     */
    public function getDetails($orderId)
    {
        // Sử dụng COALESCE để trả về 'uploads/no_image.png' nếu MIN(pvp.url_path) là NULL
        $sql = "
            SELECT 
                od.quantity,
                od.price_at_order AS price,      -- Alias price_at_order thành 'price'
                p.name AS product_name,          -- Lấy tên sản phẩm
                pv.color,                        -- Lấy Màu
                '' AS size,                      -- Cột size không có trong DDL, trả về giá trị rỗng
                COALESCE(MIN(pvp.url_path), 'https://images.unsplash.com/photo-1551218808-94e220e084d2') AS product_image -- Xử lý NULL
            FROM 
                Order_detail od
            JOIN 
                Product_variant pv ON od.product_variant_id = pv.id
            JOIN 
                Product p ON pv.product_id = p.id
            LEFT JOIN 
                Product_variant_picture pvp ON pv.id = pvp.product_variant_id
            WHERE 
                od.order_id = :order_id
            GROUP BY 
                od.id, od.order_id, od.product_variant_id, od.quantity, od.price_at_order, p.name, pv.color
            ORDER BY 
                od.id ASC
        ";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':order_id', $orderId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get status logs
     */
    public function getStatusLogs($orderId)
    {
        // LỖI SQL (3/5): changed_at -> time
        $sql = "SELECT * FROM Order_Status_Log 
                WHERE order_id = :order_id 
                ORDER BY time DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':order_id', $orderId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }

    // --- BẮT ĐẦU THÊM CÁC PHƯƠNG THỨC THIẾU TỪ CONTROLLER ---
    
    /**
     * POST /api/orders. Tạo đơn hàng mới
     * PHƯƠNG THỨC MỚI (Lỗi Undefined method 'create')
     */
    public function create($data) {
            try {
            $this->pdo->beginTransaction();

            $userId = $data['user_id'];
            $address = $data['shipping_address'];
            $paymentMethod = $data['payment_method'];
            $discountId = $data['discount_id'] ?? null;
            $items = $data['items'];

            // 1. Tính toán Tổng tiền gốc và Tổng số lượng (total_amount)
            $totalCost = 0;
            $totalAmount = 0;
            foreach ($items as $item) {
                $totalCost += $item['price_at_order'] * $item['quantity'];
                $totalAmount += $item['quantity'];
            }
            
            // **LƯU Ý QUAN TRỌNG:** Logic tính toán giảm giá và giá cuối cùng
            // SẼ PHẢI ĐƯỢC THÊM VÀO ĐÂY nếu bạn muốn áp dụng discountId! 
            // Hiện tại, tôi bỏ qua logic giảm giá phức tạp và giả định total_cost là giá cuối cùng
            $finalCost = $totalCost; 

            // 2. Thêm đơn hàng vào bảng Order
            $sqlOrder = "INSERT INTO `Order` (customer_id, address, date, payment_method, total_amount, total_cost, payment_status, status) 
                        VALUES (:customer_id, NOW(), :address, :payment_method, :total_amount, :total_cost, 'pending', 'pending')";
            $stmtOrder = $this->pdo->prepare($sqlOrder);
            $stmtOrder->bindValue(':customer_id', $userId, PDO::PARAM_INT);
            $stmtOrder->bindValue(':address', $address);
            $stmtOrder->bindValue(':payment_method', $paymentMethod);
            $stmtOrder->bindValue(':total_amount', $totalAmount, PDO::PARAM_INT);
            $stmtOrder->bindValue(':total_cost', $finalCost); // Sử dụng $finalCost
            $stmtOrder->execute();
            $orderId = $this->pdo->lastInsertId();

            // 3. Thêm chi tiết sản phẩm vào Order_detail
            $sqlDetail = "INSERT INTO Order_detail (order_id, product_id, quantity, price_at_order) 
                        VALUES (:order_id, :product_id, :quantity, :price_at_order)";
            $stmtDetail = $this->pdo->prepare($sqlDetail);
            
            foreach ($items as $item) {
                $stmtDetail->bindValue(':order_id', $orderId, PDO::PARAM_INT);
                $stmtDetail->bindValue(':product_id', $item['product_id'], PDO::PARAM_INT);
                $stmtDetail->bindValue(':quantity', $item['quantity'], PDO::PARAM_INT);
                $stmtDetail->bindValue(':price_at_order', $item['price_at_order']);
                $stmtDetail->execute();
                
                // Cập nhật tồn kho (nếu cần)
                // ...
            }
            
            // 4. Thêm Discount_order (nếu có mã giảm giá)
            if ($discountId) {
                $sqlDiscount = "INSERT INTO Discount_order (order_id, discount_id) VALUES (:order_id, :discount_id)";
                $stmtDiscount = $this->pdo->prepare($sqlDiscount);
                $stmtDiscount->bindValue(':order_id', $orderId, PDO::PARAM_INT);
                $stmtDiscount->bindValue(':discount_id', $discountId, PDO::PARAM_INT);
                $stmtDiscount->execute();
            }

            // 5. Thêm log trạng thái ban đầu
            $sqlLog = "INSERT INTO Order_Status_Log (order_id, status, time) VALUES (:order_id, 'pending', NOW())";
            $stmtLog = $this->pdo->prepare($sqlLog);
            $stmtLog->bindValue(':order_id', $orderId, PDO::PARAM_INT);
            $stmtLog->execute();

            $this->pdo->commit();
            return $orderId;

        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /**
     * Kiểm tra tồn kho của biến thể sản phẩm
     * PHƯƠNG THỨC MỚI (Lỗi Undefined method 'checkStock')
     */
    public function checkStock($productVariantId, $quantity) {
        // !!! Cần triển khai logic kiểm tra stock tại đây
        // $sql = "SELECT stock FROM Product_Variant WHERE id = :id";
        // return $stock >= $quantity;
        
        // Placeholder:
        return true; 
    }
    
    /**
     * Kiểm tra và lấy thông tin mã giảm giá
     * PHƯƠNG THỨC MỚI (Lỗi Undefined method 'validateDiscount')
     */
    public function validateDiscount($discountCode, $totalAmount) {
        // !!! Cần triển khai logic validation discount tại đây
        // Ví dụ: kiểm tra hạn sử dụng, điều kiện giá trị đơn hàng, v.v.
        
        // Placeholder:
        return ['id' => 1, 'amount' => 10000]; // Giả định mã hợp lệ
    }
    
    /**
     * Giảm số lượng tồn kho
     * PHƯƠNG THỨC MỚI (Lỗi Undefined method 'decreaseStock')
     */
    public function decreaseStock($orderId) {
        // !!! Cần triển khai logic trừ kho tại đây
        // Lặp qua các Order_detail và giảm stock trong Product_Variant
        
        // Placeholder:
        return true; 
    }
    
    /**
     * Tăng số lượng tồn kho (hoàn kho)
     * PHƯƠNG THỨC MỚI (Lỗi Undefined method 'increaseStock')
     */
    public function increaseStock($orderId) {
        // !!! Cần triển khai logic cộng kho tại đây
        // Lặp qua các Order_detail và tăng stock trong Product_Variant
        
        // Placeholder:
        return true; 
    }

    // --- KẾT THÚC CÁC PHƯƠNG THỨC THIẾU ---

    /**
     * Update order status
     */
    public function updateStatus($id, $status, $note = null)
    {
        try {
            $this->pdo->beginTransaction();
            
            // Update order (giữ nguyên)
            // LƯU Ý: Bảng Order có thể không có cột status. Nếu lỗi xảy ra, hãy kiểm tra lại.
            $sql = "UPDATE {$this->table} SET status = :status WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            // Log status change
            // LỖI SQL (4/5): BỎ 'note' và THÊM 'time'
            $sql = "INSERT INTO Order_Status_Log (order_id, status, time) 
                    VALUES (:order_id, :status, NOW())";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':order_id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':status', $status);
            
            $stmt->execute();
            
            $this->pdo->commit();
            return true;
        } catch (Exception $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
    
    /**
     * Count orders by status
     */
    public function countByStatus($status)
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE status = :status";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':status', $status);
        $stmt->execute();
        
        $result = $stmt->fetch();
        return (int)$result['count'];
    }
}