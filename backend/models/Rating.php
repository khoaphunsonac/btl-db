<?php
require_once __DIR__ . '/BaseModel.php';

class Rating extends BaseModel
{
    protected $table = 'Rating';
    
    /**
     * Get ratings by product
     */
    public function getByProduct($productId, $limit = 10, $offset = 0)
    {
        $sql = "SELECT r.*, u.full_name as user_name 
                FROM {$this->table} r 
                LEFT JOIN User_Account u ON r.customer_id = u.id 
                WHERE r.product_id = :product_id 
                ORDER BY r.created_at DESC 
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
        $sql = "SELECT r.*, p.name as product_name 
                FROM {$this->table} r 
                JOIN Product p ON r.product_id = p.id 
                WHERE r.customer_id = :customer_id 
                ORDER BY r.created_at DESC 
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':customer_id', $customerId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Check if user already rated product
     */
    public function hasRated($customerId, $productId)
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} 
                WHERE customer_id = :customer_id AND product_id = :product_id";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':customer_id', $customerId, PDO::PARAM_INT);
        $stmt->bindValue(':product_id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }
    
    /**
     * Check if customer purchased product
     */
    public function hasPurchased($customerId, $productId)
    {
        $sql = "SELECT COUNT(*) as count 
                FROM `Order` o 
                JOIN Order_Detail od ON o.id = od.order_id 
                WHERE o.customer_id = :customer_id 
                AND od.product_id = :product_id 
                AND o.status = 'completed'";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':customer_id', $customerId, PDO::PARAM_INT);
        $stmt->bindValue(':product_id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch();
        return $result['count'] > 0;
    }
    
    /**
     * Get average rating for product
     */
    public function getAverageRating($productId)
    {
        $sql = "SELECT AVG(rating) as average, COUNT(*) as total 
                FROM {$this->table} 
                WHERE product_id = :product_id";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':product_id', $productId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch();
    }
}
