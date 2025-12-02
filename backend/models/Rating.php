<?php
require_once __DIR__ . '/BaseModel.php';

class Rating extends BaseModel
{
    protected $table = 'Rating';
    
    /**
     * Get all ratings with pagination and filters
     */
    public function getAll($page = 1, $limit = 10, $filters = [])
    {
        $offset = ($page - 1) * $limit;
        
        $conditions = ["1=1"];
        $params = [];
        
        // Filter by star rating
        if (!empty($filters['star'])) {
            $conditions[] = "r.star = ?";
            $params[] = $filters['star'];
        }
        
        // Filter by customer
        if (!empty($filters['customer_id'])) {
            $conditions[] = "r.customer_id = ?";
            $params[] = $filters['customer_id'];
        }
        
        // Filter by product
        if (!empty($filters['product_id'])) {
            $conditions[] = "r.product_id = ?";
            $params[] = $filters['product_id'];
        }
        
        // Search in comment content
        if (!empty($filters['search'])) {
            $conditions[] = "(r.comment_content LIKE ? OR p.name LIKE ? OR CONCAT(u.fname, ' ', u.lname) LIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = implode(' AND ', $conditions);
        
        // Count total records
        $countSql = "SELECT COUNT(*) as total 
                     FROM {$this->table} r
                     JOIN Product p ON r.product_id = p.id
                     JOIN Customer c ON r.customer_id = c.id
                     JOIN User u ON c.id = u.account_id
                     WHERE {$whereClause}";
        
        $countStmt = $this->pdo->prepare($countSql);
        $countStmt->execute($params);
        $total = $countStmt->fetch()['total'];
        
        // Get paginated data
        $sql = "SELECT r.id, r.customer_id, r.product_id, r.comment_content, r.date, r.star,
                       p.name as product_name, p.trademark,
                       CONCAT(u.fname, ' ', u.lname) as customer_name
                FROM {$this->table} r
                JOIN Product p ON r.product_id = p.id
                JOIN Customer c ON r.customer_id = c.id
                JOIN User u ON c.id = u.account_id
                WHERE {$whereClause}
                ORDER BY r.date DESC
                LIMIT ? OFFSET ?";
        
        $stmt = $this->pdo->prepare($sql);
        $dataParams = array_merge($params, [(int)$limit, (int)$offset]);
        $stmt->execute($dataParams);
        
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'data' => $data,
            'pagination' => [
                'current_page' => (int)$page,
                'per_page' => (int)$limit,
                'total' => (int)$total,
                'total_pages' => ceil($total / $limit),
                'has_next' => $page < ceil($total / $limit),
                'has_prev' => $page > 1
            ]
        ];
    }
    
    /**
     * Get rating statistics
     */
    public function getStats()
    {
        $sql = "SELECT 
                    COUNT(*) as total_ratings,
                    AVG(star) as average_star,
                    COUNT(CASE WHEN star = 5 THEN 1 END) as five_star,
                    COUNT(CASE WHEN star = 4 THEN 1 END) as four_star,
                    COUNT(CASE WHEN star = 3 THEN 1 END) as three_star,
                    COUNT(CASE WHEN star = 2 THEN 1 END) as two_star,
                    COUNT(CASE WHEN star = 1 THEN 1 END) as one_star
                FROM {$this->table}";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get rating by ID with full details
     */
    public function getById($id)
    {
        $sql = "SELECT r.*, 
                       p.name as product_name, p.trademark,
                       CONCAT(u.fname, ' ', u.lname) as customer_name,
                       ua.email, u.phone, u.address
                FROM {$this->table} r
                JOIN Product p ON r.product_id = p.id
                JOIN Customer c ON r.customer_id = c.id
                JOIN User u ON c.id = u.account_id
                JOIN User_Account ua ON c.id = ua.id
                WHERE r.id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$id]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get ratings by product
     */
    public function getByProduct($productId, $limit = 10, $offset = 0)
    {
        $sql = "SELECT r.*, CONCAT(u.fname, ' ', u.lname) as customer_name 
                FROM {$this->table} r 
                JOIN Customer c ON r.customer_id = c.id
                JOIN User u ON c.id = u.account_id 
                WHERE r.product_id = :product_id 
                ORDER BY r.date DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':product_id', $productId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Get ratings by customer
     */
    public function getByCustomer($customerId, $limit = 10, $offset = 0)
    {
        $sql = "SELECT r.*, p.name as product_name, p.trademark 
                FROM {$this->table} r 
                JOIN Product p ON r.product_id = p.id 
                WHERE r.customer_id = :customer_id 
                ORDER BY r.date DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':customer_id', $customerId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Check if customer already rated product
     */
    public function hasRated($customerId, $productId)
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} 
                WHERE customer_id = ? AND product_id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$customerId, $productId]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] > 0;
    }
    
    /**
     * Check if customer purchased product successfully
     */
    public function hasPurchased($customerId, $productId)
    {
        $sql = "SELECT COUNT(*) as count 
                FROM `Order` o 
                JOIN Order_detail od ON o.id = od.order_id 
                JOIN Product_variant pv ON od.product_variant_id = pv.id
                WHERE o.customer_id = ? 
                AND pv.product_id = ? 
                AND o.payment_status = 'Đã thanh toán'
                AND EXISTS (
                    SELECT 1 FROM Order_status_log osl 
                    WHERE osl.order_id = o.id 
                    AND osl.status = 'Hoàn thành'
                )";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute([$customerId, $productId]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result['count'] > 0;
    }
    
    /**
     * Get average rating for product
     */
    public function getAverageRating($productId)
    {
        $sql = "SELECT AVG(star) as average, COUNT(*) as total 
                FROM {$this->table} 
                WHERE product_id = :product_id";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':product_id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    /**
     * Create new rating
     */
    public function create($data)
    {
        // First, get the next ID for this product
        $sqlMaxId = "SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM {$this->table} WHERE product_id = ?";
        $stmtMaxId = $this->pdo->prepare($sqlMaxId);
        $stmtMaxId->execute([$data['product_id']]);
        $nextId = $stmtMaxId->fetch(PDO::FETCH_ASSOC)['next_id'];
        
        $sql = "INSERT INTO {$this->table} (id, customer_id, product_id, comment_content, star, date) 
                VALUES (?, ?, ?, ?, ?, NOW())";
        
        $stmt = $this->pdo->prepare($sql);
        $result = $stmt->execute([
            $nextId,
            $data['customer_id'],
            $data['product_id'],
            $data['comment_content'],
            $data['star']
        ]);
        
        if ($result) {
            // Return the created rating
            return $this->getById($nextId);
        }
        
        return false;
    }
    
    /**
     * Update rating
     */
    public function update($id, $data)
    {
        // Find the product_id for this rating ID first
        $findSql = "SELECT product_id FROM {$this->table} WHERE id = ? LIMIT 1";
        $findStmt = $this->pdo->prepare($findSql);
        $findStmt->execute([$id]);
        $productId = $findStmt->fetchColumn();
        
        if (!$productId) {
            return false;
        }
        
        $sql = "UPDATE {$this->table} 
                SET comment_content = ?, star = ?, date = NOW()
                WHERE id = ? AND product_id = ?";
        
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([
            $data['comment_content'],
            $data['star'],
            $id,
            $productId
        ]);
    }
    
    /**
     * Get customers for dropdown
     */
    public function getCustomers()
    {
        try {
            $sql = "SELECT c.id, CONCAT(COALESCE(u.fname, ''), ' ', COALESCE(u.lname, '')) as name, 
                           COALESCE(ua.email, '') as email 
                   FROM Customer c 
                   INNER JOIN User u ON c.id = u.account_id 
                   INNER JOIN User_Account ua ON c.id = ua.id
                   WHERE u.fname IS NOT NULL AND u.lname IS NOT NULL
                   ORDER BY u.fname, u.lname";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Customer query error: " . $e->getMessage());
            throw new Exception("Database error: " . $e->getMessage());
        }
    }
    
    /**
     * Get products for dropdown
     */
    public function getProducts()
    {
        try {
            $sql = "SELECT id, name, trademark FROM Product ORDER BY name";
            
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute();
            
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Product query error: " . $e->getMessage());
            throw new Exception("Database error: " . $e->getMessage());
        }
    }

    /**
     * Delete rating
     */
    public function delete($id)
    {
        // Find the product_id for this rating ID first
        $findSql = "SELECT product_id FROM {$this->table} WHERE id = ? LIMIT 1";
        $findStmt = $this->pdo->prepare($findSql);
        $findStmt->execute([$id]);
        $productId = $findStmt->fetchColumn();
        
        if (!$productId) {
            return false;
        }
        
        $sql = "DELETE FROM {$this->table} WHERE id = ? AND product_id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute([$id, $productId]);
    }
}
?>
