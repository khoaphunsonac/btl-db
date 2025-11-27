<?php
require_once __DIR__ . '/BaseModel.php';

class Order extends BaseModel
{
    protected $table = '`Order`'; // Backticks because Order is reserved keyword
    
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
        $sql = "SELECT * FROM {$this->table} 
                WHERE customer_id = :customer_id 
                ORDER BY created_at DESC 
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
        $sql = "SELECT * FROM {$this->table} 
                WHERE status = :status 
                ORDER BY created_at DESC 
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
        $sql = "SELECT od.*, p.name as product_name, p.image 
                FROM Order_Detail od 
                JOIN Product p ON od.product_id = p.id 
                WHERE od.order_id = :order_id";
        
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
        $sql = "SELECT * FROM Order_Status_Log 
                WHERE order_id = :order_id 
                ORDER BY changed_at DESC";
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':order_id', $orderId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll();
    }
    
    /**
     * Update order status
     */
    public function updateStatus($id, $status, $note = null)
    {
        try {
            $this->pdo->beginTransaction();
            
            // Update order
            $sql = "UPDATE {$this->table} SET status = :status WHERE id = :id";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            
            // Log status change
            $sql = "INSERT INTO Order_Status_Log (order_id, status, note) 
                    VALUES (:order_id, :status, :note)";
            $stmt = $this->pdo->prepare($sql);
            $stmt->bindValue(':order_id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':status', $status);
            $stmt->bindValue(':note', $note);
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
